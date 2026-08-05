import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { StripeEnv } from "@/lib/stripe.server";
import type { Tier } from "@/lib/commerce/plans";

const isEnv = (value: unknown): StripeEnv => (value === "live" ? "live" : "sandbox");

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
  /** Set when access was granted manually by an admin rather than paid for. */
  grantedTier: Exclude<Tier, "free"> | null;
  grantExpiresAt: string | null;
};

/** Authoritative entitlement read. Never trust a client-supplied tier. */
export const getEntitlement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => ({ environment: isEnv(data.environment) }))
  .handler(async ({ data, context }): Promise<Entitlement> => {
    const { resolveEntitlement } = await import("@/lib/commerce/entitlement.server");
    const { tier, includedOsUntil, grantedTier, grantExpiresAt, subscriptions, purchases } =
      await resolveEntitlement(context.supabase, context.userId, data.environment);

    const latestSub = subscriptions[0] ?? null;

    return {
      tier,
      includedOsUntil,
      grantedTier,
      grantExpiresAt,
      subscription: latestSub
        ? {
            id: latestSub.stripe_subscription_id ?? latestSub.paddle_subscription_id ?? "",
            status: latestSub.status,
            priceId: latestSub.price_id,
            productId: latestSub.product_id,
            currentPeriodEnd: latestSub.current_period_end,
            cancelAtPeriodEnd: latestSub.cancel_at_period_end,
          }
        : null,

      purchases: purchases.map((row) => ({
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
