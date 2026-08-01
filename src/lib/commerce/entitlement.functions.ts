import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PaddleEnv } from "@/lib/paddle.server";
import { FEATURE_MINIMUM, TIER_RANK, type Feature, type Tier } from "@/lib/commerce/plans";

const isEnv = (value: unknown): PaddleEnv => (value === "live" ? "live" : "sandbox");

export type SubscriptionSummary = {
  id: string;
  status: string;
  priceId: string;
  productId: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export type PurchaseSummary = {
  id: string;
  productId: string;
  priceId: string;
  amountCents: number;
  currency: string;
  status: string;
  includedOsAccessUntil: string | null;
  createdAt: string;
};

export type Entitlement = {
  tier: Tier;
  subscription: SubscriptionSummary | null;
  purchases: PurchaseSummary[];
  /** Set when OS access comes from the month bundled with a Blueprint purchase. */
  includedOsUntil: string | null;
};

function subscriptionIsActive(row: {
  status: string;
  current_period_end: string | null;
}): boolean {
  const endsInFuture = !row.current_period_end || new Date(row.current_period_end) > new Date();
  if (["active", "trialing", "past_due"].includes(row.status)) return endsInFuture;
  if (row.status === "canceled") return endsInFuture && !!row.current_period_end;
  return false;
}

/** Authoritative entitlement read. Never trust a client-supplied tier. */
export const getEntitlement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => ({ environment: isEnv(data.environment) }))
  .handler(async ({ data, context }): Promise<Entitlement> => {
    const { supabase, userId } = context;
    const env = data.environment;

    const [{ data: subs }, { data: purchaseRows }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("environment", env)
        .order("created_at", { ascending: false }),
      supabase
        .from("purchases")
        .select("*")
        .eq("user_id", userId)
        .eq("environment", env)
        .order("created_at", { ascending: false }),
    ]);

    const activeSub = (subs ?? []).find(subscriptionIsActive) ?? null;
    const latestSub = activeSub ?? (subs ?? [])[0] ?? null;

    const completed = (purchaseRows ?? []).filter((row) => row.status === "completed");
    const includedOs = completed
      .map((row) => row.included_os_access_until)
      .filter((value): value is string => !!value && new Date(value) > new Date())
      .sort()
      .at(-1) ?? null;

    let tier: Tier = "free";
    if (completed.length > 0) tier = "blueprint";
    if (activeSub || includedOs) tier = "os";

    return {
      tier,
      includedOsUntil: activeSub ? null : includedOs,
      subscription: latestSub
        ? {
            id: latestSub.paddle_subscription_id,
            status: latestSub.status,
            priceId: latestSub.price_id,
            productId: latestSub.product_id,
            currentPeriodEnd: latestSub.current_period_end,
            cancelAtPeriodEnd: latestSub.cancel_at_period_end,
          }
        : null,
      purchases: completed.map((row) => ({
        id: row.id,
        productId: row.product_id,
        priceId: row.price_id,
        amountCents: row.amount_cents,
        currency: row.currency,
        status: row.status,
        includedOsAccessUntil: row.included_os_access_until,
        createdAt: row.created_at,
      })),
    };
  });

/** Server-side gate used before returning any paid payload. */
export function assertFeature(tier: Tier, feature: Feature) {
  if (TIER_RANK[tier] < TIER_RANK[FEATURE_MINIMUM[feature]]) {
    throw new Error(`Upgrade required: ${feature}`);
  }
}
