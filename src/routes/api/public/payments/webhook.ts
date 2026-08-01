import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, gatewayFetch, EventName, type PaddleEnv } from "@/lib/paddle.server";
import { PRICE_PRODUCT, PRODUCT_TIER } from "@/lib/commerce/plans";
import type { Database } from "@/integrations/supabase/types";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env["SUPABASE_URL"]!,
      process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
    );
  }
  return _supabase;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

async function logEvent(userId: string, eventName: string, metadata: Record<string, unknown>) {
  await getSupabase().from("customer_events").insert({
    user_id: userId,
    event_name: eventName,
    metadata: metadata as never,
  });
}

/** Paddle internal price id → human-readable external id, cached per worker. */
const priceExternalIdCache = new Map<string, string>();

async function lookupPriceExternalId(paddlePriceId: string, env: PaddleEnv): Promise<string | null> {
  const cached = priceExternalIdCache.get(paddlePriceId);
  if (cached) return cached;
  try {
    const response = await gatewayFetch(env, `/prices/${encodeURIComponent(paddlePriceId)}`);
    if (!response.ok) return null;
    const result: any = await response.json();
    const externalId: string | undefined =
      result?.data?.import_meta?.external_id ?? result?.data?.importMeta?.externalId;
    if (!externalId) return null;
    priceExternalIdCache.set(paddlePriceId, externalId);
    return externalId;
  } catch (err) {
    console.error("[payments] price lookup failed:", paddlePriceId, err);
    return null;
  }
}

/**
 * Resolve the catalog product for a line item, or null when it is unknown.
 *
 * Notification payloads do not always carry `importMeta` on the price (and
 * transaction events carry no product object at all), so fall back to looking
 * the Paddle internal price id up through the API.
 */
async function resolveCatalog(
  item: any,
  env: PaddleEnv,
): Promise<{ priceId: string; productId: string } | null> {
  const rawPriceId: string | undefined = item?.price?.id ?? item?.priceId;
  const priceId: string | null =
    item?.price?.importMeta?.externalId ??
    item?.price?.import_meta?.external_id ??
    (rawPriceId ? await lookupPriceExternalId(rawPriceId, env) : null);

  if (!priceId) {
    console.error("[payments] could not resolve price external id", { rawPriceId });
    return null;
  }

  const productId =
    item?.product?.importMeta?.externalId ??
    item?.product?.import_meta?.external_id ??
    PRICE_PRODUCT[priceId] ??
    null;

  // Never grant a tier for something that is not in our catalog.
  if (!productId || !PRODUCT_TIER[productId]) {
    console.error("[payments] price is not in the catalog", { priceId, productId, rawPriceId });
    return null;
  }
  return { priceId, productId };
}


async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const userId = data.customData?.userId;
  if (!userId) return console.error("[payments] subscription.created without customData.userId");

  const catalog = resolveCatalog(data.items?.[0]);
  if (!catalog) {
    console.warn("[payments] skipping subscription: unknown catalog item");
    return;
  }

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        paddle_subscription_id: data.id,
        paddle_customer_id: data.customerId,
        product_id: catalog.productId,
        price_id: catalog.priceId,
        status: data.status,
        current_period_start: data.currentBillingPeriod?.startsAt ?? null,
        current_period_end: data.currentBillingPeriod?.endsAt ?? null,
        cancel_at_period_end: data.scheduledChange?.action === "cancel",
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paddle_subscription_id" },
    );

  await logEvent(userId, "subscription_started", { ...catalog, environment: env });
}

/**
 * Covers subscription.updated, .past_due, .paused and .resumed — Paddle sends
 * the same subscription entity on each, with `status` reflecting the change.
 */
async function handleSubscriptionStateChange(data: any, env: PaddleEnv) {
  const catalog = resolveCatalog(data.items?.[0]);

  await getSupabase()
    .from("subscriptions")
    .update({
      status: data.status,
      ...(catalog ? { price_id: catalog.priceId, product_id: catalog.productId } : {}),
      current_period_start: data.currentBillingPeriod?.startsAt ?? null,
      current_period_end: data.currentBillingPeriod?.endsAt ?? null,
      cancel_at_period_end: data.scheduledChange?.action === "cancel",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);

  const userId = data.customData?.userId;
  if (userId && data.status === "past_due") {
    await logEvent(userId, "subscription_past_due", { environment: env });
  }
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  // Access is retained until current_period_end — see entitlement.server.ts.
  await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      current_period_end: data.currentBillingPeriod?.endsAt ?? data.canceledAt ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);

  const userId = data.customData?.userId;
  if (userId) await logEvent(userId, "subscription_canceled", { environment: env });
}

async function handleTransactionCompleted(data: any, env: PaddleEnv) {
  // Subscription renewals arrive here too; only one-time purchases are recorded.
  if (data.subscriptionId) return;

  const userId = data.customData?.userId;
  if (!userId) return console.error("[payments] transaction.completed without customData.userId");

  const catalog = resolveCatalog(data.items?.[0]);
  if (!catalog) {
    console.warn("[payments] skipping purchase: unknown catalog item");
    return;
  }

  // Buying the Blueprint includes one month of Publisher OS™ access.
  const includedUntil = new Date();
  includedUntil.setMonth(includedUntil.getMonth() + 1);

  await getSupabase()
    .from("purchases")
    .upsert(
      {
        user_id: userId,
        paddle_transaction_id: data.id,
        paddle_customer_id: data.customerId ?? null,
        product_id: catalog.productId,
        price_id: catalog.priceId,
        amount_cents: Number(data.details?.totals?.total ?? 0),
        currency: data.currencyCode ?? "USD",
        status: "completed",
        included_os_access_until:
          catalog.productId === "publisher_blueprint" ? includedUntil.toISOString() : null,
        invoice_url: data.invoiceId ? `https://my.paddle.com/invoice/${data.invoiceId}` : null,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paddle_transaction_id" },
    );

  await logEvent(userId, "purchase_completed", {
    ...catalog,
    amountCents: Number(data.details?.totals?.total ?? 0),
    environment: env,
  });

  // CRM / records sync (queued, retried out of band).
  try {
    const { data: userRecord } = await getSupabase().auth.admin.getUserById(userId);
    const { data: profile } = await getSupabase()
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();
    const { enqueueIntegrationEvent } = await import("@/lib/integrations/outbox.server");
    await enqueueIntegrationEvent(
      {
        eventName: "purchase.completed",
        userId,
        email: userRecord?.user?.email ?? null,
        fullName: profile?.full_name ?? null,
        tier: catalog.productId,
        amount: Number(data.details?.totals?.total ?? 0) / 100,
        currency: data.currencyCode ?? "USD",
        occurredAt: new Date().toISOString(),
        metadata: { transactionId: data.id, environment: env },
      },
      { dedupeKey: `purchase:${data.id}` },
    );
  } catch (err) {
    console.error("[integrations] purchase sync enqueue failed:", err);
  }
}


/**
 * Refunds and chargebacks. Access is revoked as soon as the adjustment is
 * approved: the purchase is marked refunded and the bundled OS month cleared.
 */
async function handleAdjustment(data: any, env: PaddleEnv) {
  const action = String(data.action ?? "");
  const status = String(data.status ?? "");
  if (!["refund", "chargeback", "chargeback_warning"].includes(action)) return;
  // adjustment.created for chargebacks is immediate; refunds revoke on approval.
  if (action === "refund" && status !== "approved") return;
  if (status === "rejected" || status === "reversed") return;

  const transactionId = data.transactionId;
  if (!transactionId) return;

  const { data: rows } = await getSupabase()
    .from("purchases")
    .update({
      status: action === "refund" ? "refunded" : "charged_back",
      included_os_access_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_transaction_id", transactionId)
    .eq("environment", env)
    .select("user_id");

  const userId = rows?.[0]?.user_id;
  if (userId) await logEvent(userId, "purchase_refunded", { action, environment: env });
}

async function handlePaymentFailed(data: any, env: PaddleEnv) {
  const userId = data.customData?.userId;
  if (userId) await logEvent(userId, "payment_failed", { environment: env });
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      await handleSubscriptionCreated(event.data, env);
      break;
    case EventName.SubscriptionUpdated:
    case EventName.SubscriptionPastDue:
    case EventName.SubscriptionPaused:
    case EventName.SubscriptionResumed:
    case EventName.SubscriptionActivated:
    case EventName.SubscriptionTrialing:
      await handleSubscriptionStateChange(event.data, env);
      break;
    case EventName.SubscriptionCanceled:
      await handleSubscriptionCanceled(event.data, env);
      break;
    case EventName.TransactionCompleted:
      await handleTransactionCompleted(event.data, env);
      break;
    case EventName.TransactionPaymentFailed:
      await handlePaymentFailed(event.data, env);
      break;
    case EventName.AdjustmentCreated:
    case EventName.AdjustmentUpdated:
      await handleAdjustment(event.data, env);
      break;
    default:
      console.log("[payments] unhandled event:", event.eventType);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (error) {
          console.error("[payments] webhook error:", error);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
