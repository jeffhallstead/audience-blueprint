import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";
import { PRODUCT_TIER } from "@/lib/commerce/plans";
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

async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const userId = data.customData?.userId;
  if (!userId) return console.error("[payments] subscription.created without customData.userId");

  const item = data.items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.product?.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn("[payments] skipping subscription: missing importMeta.externalId");
    return;
  }

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        paddle_subscription_id: data.id,
        paddle_customer_id: data.customerId,
        product_id: productId,
        price_id: priceId,
        status: data.status,
        current_period_start: data.currentBillingPeriod?.startsAt ?? null,
        current_period_end: data.currentBillingPeriod?.endsAt ?? null,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paddle_subscription_id" },
    );

  await logEvent(userId, "subscription_started", { productId, priceId, environment: env });
}

async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const item = data.items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.product?.importMeta?.externalId;

  await getSupabase()
    .from("subscriptions")
    .update({
      status: data.status,
      ...(priceId ? { price_id: priceId } : {}),
      ...(productId ? { product_id: productId } : {}),
      current_period_start: data.currentBillingPeriod?.startsAt ?? null,
      current_period_end: data.currentBillingPeriod?.endsAt ?? null,
      cancel_at_period_end: data.scheduledChange?.action === "cancel",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);
}

async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  // Access is retained until current_period_end — see entitlement.functions.ts.
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
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

  const item = data.items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  if (!priceId) {
    console.warn("[payments] skipping purchase: missing importMeta.externalId");
    return;
  }

  const productExternalId =
    Object.keys(PRODUCT_TIER).find((key) => priceId.startsWith(key)) ?? "publisher_blueprint";

  // Buying the Blueprint includes one month of Publisher OS access.
  const includedUntil = new Date();
  includedUntil.setMonth(includedUntil.getMonth() + 1);

  await getSupabase()
    .from("purchases")
    .upsert(
      {
        user_id: userId,
        paddle_transaction_id: data.id,
        paddle_customer_id: data.customerId ?? null,
        product_id: productExternalId,
        price_id: priceId,
        amount_cents: Number(data.details?.totals?.total ?? 0),
        currency: data.currencyCode ?? "USD",
        status: "completed",
        included_os_access_until:
          productExternalId === "publisher_blueprint" ? includedUntil.toISOString() : null,
        invoice_url: data.invoiceId ? `https://my.paddle.com/invoice/${data.invoiceId}` : null,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paddle_transaction_id" },
    );

  await logEvent(userId, "purchase_completed", {
    priceId,
    productId: productExternalId,
    amountCents: Number(data.details?.totals?.total ?? 0),
    environment: env,
  });
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
      await handleSubscriptionUpdated(event.data, env);
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
