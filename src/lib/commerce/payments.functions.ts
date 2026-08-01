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
