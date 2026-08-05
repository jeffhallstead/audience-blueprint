import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, createStripeClient, type StripeEnv } from "@/lib/stripe.server";
import { PRICE_PRODUCT, PRODUCT_TIER } from "@/lib/commerce/plans";
import type { Database } from "@/integrations/supabase/types";
import { emitPlatformEvent } from "@/lib/events/emit.server";
import type { PlatformEventType } from "@/lib/events/catalog";

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

/** Legacy webhook event name → canonical platform event type. */
const CANONICAL: Record<string, PlatformEventType> = {
  subscription_started: "commerce.subscription_activated",
  subscription_past_due: "commerce.subscription_past_due",
  subscription_canceled: "commerce.subscription_canceled",
  purchase_unmatched: "commerce.purchase_unmatched",
  purchase_completed: "commerce.purchase_completed",
  purchase_refunded: "commerce.purchase_refunded",
  payment_failed: "commerce.payment_failed",
};

/**
 * Dual-writes to legacy `customer_events` and the canonical `platform_events`
 * store. `dedupeKey` keys off the Stripe object id so a redelivered webhook
 * records the event exactly once.
 */
async function logEvent(userId: string, eventName: string, metadata: Record<string, unknown>) {
  const canonical = CANONICAL[eventName];
  const reference =
    (metadata["transactionId"] as string | undefined) ??
    (metadata["subscriptionId"] as string | undefined) ??
    null;
  await Promise.allSettled([
    getSupabase().from("customer_events").insert({
      user_id: userId,
      event_name: eventName,
      metadata: metadata as never,
    }),
    canonical
      ? emitPlatformEvent({
          type: canonical,
          userId,
          environment: (metadata["environment"] as string | undefined) ?? "live",
          source: "webhook",
          context: { provider: "stripe" },
          payload: metadata,
          dedupeKey: reference ? `${canonical}:${reference}` : null,
        })
      : Promise.resolve(),
  ]);
}

/**
 * Resolve the catalog entry for a Stripe price. `lookup_key` carries the
 * human-readable id (e.g. `publisher_blueprint_onetime`) and is identical in
 * test and live, so entitlements survive the go-live switch.
 */
function resolveCatalog(price: any): { priceId: string; productId: string } | null {
  const priceId: string | null =
    price?.lookup_key ?? price?.metadata?.lovable_external_id ?? null;
  if (!priceId) {
    console.error("[payments] price has no lookup_key", { rawPriceId: price?.id });
    return null;
  }
  const productId = PRICE_PRODUCT[priceId] ?? null;
  if (!productId || !PRODUCT_TIER[productId]) {
    console.error("[payments] price is not in the catalog", { priceId, productId });
    return null;
  }
  return { priceId, productId };
}

/** userId lives on the Customer, the Subscription and the Session. */
async function resolveUserId(
  object: any,
  env: StripeEnv,
  customerId?: string | null,
): Promise<string | null> {
  const direct = object?.metadata?.userId;
  if (direct) return direct;
  if (!customerId) return null;
  try {
    const stripe = createStripeClient(env);
    const customer = await stripe.customers.retrieve(customerId);
    if (!("deleted" in customer && customer.deleted)) {
      return (customer as any).metadata?.userId ?? null;
    }
  } catch (err) {
    console.error("[payments] customer lookup failed", customerId, err);
  }
  return null;
}

const isoFromUnix = (seconds: number | null | undefined) =>
  seconds ? new Date(seconds * 1000).toISOString() : null;

const customerIdOf = (value: any): string | null =>
  typeof value === "string" ? value : (value?.id ?? null);

async function upsertSubscription(subscription: any, env: StripeEnv, isNew: boolean) {
  const customerId = customerIdOf(subscription.customer);
  const userId = await resolveUserId(subscription, env, customerId);
  if (!userId) {
    console.error("[payments] subscription without resolvable userId", subscription.id);
    return;
  }

  const item = subscription.items?.data?.[0];
  const catalog = resolveCatalog(item?.price);
  if (!catalog) {
    console.warn("[payments] skipping subscription: unknown catalog item", subscription.id);
    return;
  }

  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        product_id: catalog.productId,
        price_id: catalog.priceId,
        status: subscription.status,
        current_period_start: isoFromUnix(periodStart),
        current_period_end: isoFromUnix(periodEnd),
        cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );

  if (isNew) {
    await logEvent(userId, "subscription_started", {
      ...catalog,
      subscriptionId: subscription.id,
      environment: env,
    });
  } else if (subscription.status === "past_due") {
    await logEvent(userId, "subscription_past_due", {
      subscriptionId: subscription.id,
      environment: env,
    });
  }
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  // Access is retained until current_period_end — see entitlement.server.ts.
  const item = subscription.items?.data?.[0];
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  const { data: rows } = await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      current_period_end: isoFromUnix(periodEnd),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env)
    .select("user_id");

  const userId = rows?.[0]?.user_id;
  if (userId) {
    await logEvent(userId, "subscription_canceled", {
      subscriptionId: subscription.id,
      environment: env,
    });
  }
}

/** One-time Blueprint purchases. Subscription sessions are handled above. */
async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  if (session.mode !== "payment") return;
  // Delayed-notification methods settle later via async_payment_succeeded.
  if (session.payment_status === "unpaid") return;

  const customerId = customerIdOf(session.customer);
  const userId = await resolveUserId(session, env, customerId);
  if (!userId) {
    console.error("[payments] checkout.session without resolvable userId", session.id);
    return;
  }

  const stripe = createStripeClient(env);
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 1,
    expand: ["data.price"],
  });
  const catalog = resolveCatalog(lineItems.data[0]?.price);

  if (!catalog) {
    // A paid transaction we cannot attribute must never disappear quietly.
    console.error("[payments] UNMATCHED PURCHASE — no catalog item", {
      sessionId: session.id,
      userId,
      environment: env,
    });
    await logEvent(userId, "purchase_unmatched", {
      transactionId: session.id,
      environment: env,
    });
    return;
  }

  // Buying the Blueprint includes one month of Publisher OS™ access.
  const includedUntil = new Date();
  includedUntil.setMonth(includedUntil.getMonth() + 1);

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  let receiptUrl: string | null = null;
  if (paymentIntentId) {
    try {
      const charges = await stripe.charges.list({ payment_intent: paymentIntentId, limit: 1 });
      receiptUrl = charges.data[0]?.receipt_url ?? null;
    } catch (err) {
      console.error("[payments] receipt lookup failed", paymentIntentId, err);
    }
  }

  const amountCents = Number(session.amount_total ?? 0);
  const currency = String(session.currency ?? "usd").toUpperCase();

  await getSupabase()
    .from("purchases")
    .upsert(
      {
        user_id: userId,
        stripe_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        stripe_customer_id: customerId,
        product_id: catalog.productId,
        price_id: catalog.priceId,
        amount_cents: amountCents,
        currency,
        status: "completed",
        included_os_access_until:
          catalog.productId === "publisher_blueprint" ? includedUntil.toISOString() : null,
        invoice_url: receiptUrl,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_session_id" },
    );

  await logEvent(userId, "purchase_completed", {
    ...catalog,
    transactionId: session.id,
    amountCents,
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
        amount: amountCents / 100,
        currency,
        occurredAt: new Date().toISOString(),
        metadata: { sessionId: session.id, environment: env },
      },
      { dedupeKey: `purchase:${session.id}` },
    );
  } catch (err) {
    console.error("[integrations] purchase sync enqueue failed:", err);
  }
}

/**
 * Refunds and chargebacks. Access is revoked as soon as the money leaves: the
 * purchase is marked refunded and the bundled OS month cleared.
 */
async function handleRefundOrDispute(
  paymentIntentId: string | null,
  status: "refunded" | "charged_back",
  env: StripeEnv,
) {
  if (!paymentIntentId) return;

  const { data: rows } = await getSupabase()
    .from("purchases")
    .update({
      status,
      included_os_access_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("environment", env)
    .select("user_id");

  const userId = rows?.[0]?.user_id;
  if (userId) {
    await logEvent(userId, "purchase_refunded", { action: status, environment: env });
  }
}

async function handlePaymentFailed(invoice: any, env: StripeEnv) {
  const customerId = customerIdOf(invoice.customer);
  const userId = await resolveUserId(invoice, env, customerId);
  if (userId) await logEvent(userId, "payment_failed", { environment: env });
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  const object = event.data.object as any;

  switch (event.type) {
    case "customer.subscription.created":
      await upsertSubscription(object, env, true);
      break;
    case "customer.subscription.updated":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      await upsertSubscription(object, env, false);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(object, env);
      break;
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await handleCheckoutCompleted(object, env);
      break;
    case "charge.refunded":
      await handleRefundOrDispute(
        typeof object.payment_intent === "string" ? object.payment_intent : null,
        "refunded",
        env,
      );
      break;
    case "charge.dispute.created":
      await handleRefundOrDispute(
        typeof object.payment_intent === "string" ? object.payment_intent : null,
        "charged_back",
        env,
      );
      break;
    case "invoice.payment_failed":
    case "checkout.session.async_payment_failed":
      await handlePaymentFailed(object, env);
      break;
    default:
      console.log("[payments] unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("[payments] webhook with invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (error) {
          console.error("[payments] webhook error:", error);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
