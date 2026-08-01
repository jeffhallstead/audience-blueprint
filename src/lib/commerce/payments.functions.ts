import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { gatewayFetch, type PaddleEnv } from "@/lib/paddle.server";

const isEnv = (value: unknown): PaddleEnv => (value === "live" ? "live" : "sandbox");

/** Resolve a human-readable price ID to the Paddle internal ID for checkout. */
export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((data: { priceId: string; environment: PaddleEnv }) => ({
    priceId: String(data.priceId),
    environment: isEnv(data.environment),
  }))
  .handler(async ({ data }) => {
    const response = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const result = (await response.json()) as { data?: Array<{ id: string }> };
    if (!result.data?.length) throw new Error(`Price not found: ${data.priceId}`);
    return result.data[0]!.id;
  });

/**
 * Create a Paddle-hosted customer portal session for the signed-in user.
 * Returns null when the user has no subscription to manage.
 */
export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => ({ environment: isEnv(data.environment) }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("paddle_subscription_id, paddle_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let customerId = subscription?.paddle_customer_id ?? null;
    if (!customerId) {
      const { data: purchase } = await supabase
        .from("purchases")
        .select("paddle_customer_id")
        .eq("user_id", userId)
        .eq("environment", data.environment)
        .not("paddle_customer_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      customerId = purchase?.paddle_customer_id ?? null;
    }

    if (!customerId) return { url: null as string | null };

    const { getPaddleClient } = await import("@/lib/paddle.server");
    const paddle = getPaddleClient(data.environment);
    const session = await paddle.customerPortalSessions.create(
      customerId,
      subscription?.paddle_subscription_id ? [subscription.paddle_subscription_id] : [],
    );

    const subscriptionUrls = (session.urls.subscriptions ?? [])[0] as
      | { cancelSubscription?: string; updateSubscriptionPaymentMethod?: string }
      | undefined;

    return {
      url: session.urls.general.overview as string | null,
      cancelUrl: subscriptionUrls?.cancelSubscription ?? null,
      updatePaymentMethodUrl: subscriptionUrls?.updateSubscriptionPaymentMethod ?? null,
    };
  });

export type Invoice = {
  id: string;
  createdAt: string;
  amountCents: number;
  currency: string;
  status: string;
  description: string;
  invoiceUrl: string | null;
};

/**
 * Full billing history from Paddle — one-time purchases and every subscription
 * renewal — so the customer sees the same invoices Paddle emailed them.
 */
export const listInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => ({ environment: isEnv(data.environment) }))
  .handler(async ({ data, context }): Promise<Invoice[]> => {
    const { supabase, userId } = context;

    const [{ data: subs }, { data: purchases }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("paddle_customer_id")
        .eq("user_id", userId)
        .eq("environment", data.environment),
      supabase
        .from("purchases")
        .select("paddle_customer_id")
        .eq("user_id", userId)
        .eq("environment", data.environment),
    ]);

    const customerIds = Array.from(
      new Set(
        [...(subs ?? []), ...(purchases ?? [])]
          .map((row) => row.paddle_customer_id)
          .filter((value): value is string => !!value),
      ),
    );
    if (customerIds.length === 0) return [];

    const response = await gatewayFetch(
      data.environment,
      `/transactions?customer_id=${customerIds.join(",")}&per_page=50&order_by=created_at[DESC]`,
    );
    if (!response.ok) {
      console.error("[payments] invoice list failed", response.status);
      return [];
    }

    const result = (await response.json()) as {
      data?: Array<{
        id: string;
        status: string;
        created_at: string;
        subscription_id: string | null;
        currency_code: string;
        invoice_number?: string | null;
        details?: { totals?: { total?: string } };
      }>;
    };

    return (result.data ?? [])
      .filter((row) => ["completed", "billed", "past_due"].includes(row.status))
      .map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        amountCents: Number(row.details?.totals?.total ?? 0),
        currency: row.currency_code ?? "USD",
        status: row.status,
        description: row.subscription_id ? "Publisher OS™ — monthly" : "Publisher Blueprint™",
        invoiceUrl: null,
      }));
  });
