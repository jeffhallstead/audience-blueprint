import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { FEATURE_MINIMUM, TIER_RANK, type Feature, type Tier } from "@/lib/commerce/plans";
import type { StripeEnv } from "@/lib/stripe.server";

type Client = SupabaseClient<Database>;

export function isStripeEnv(value: unknown): StripeEnv {
  return value === "live" ? "live" : "sandbox";
}

function subscriptionIsActive(row: { status: string; current_period_end: string | null }) {
  const endsInFuture = !row.current_period_end || new Date(row.current_period_end) > new Date();
  if (["active", "trialing", "past_due"].includes(row.status)) return endsInFuture;
  // Canceled subscriptions keep access until the paid period ends.
  if (row.status === "canceled") return endsInFuture && !!row.current_period_end;
  return false;
}

export type ResolvedEntitlement = {
  tier: Tier;
  includedOsUntil: string | null;
  /** Tier granted manually by an admin, when one is active. */
  grantedTier: Exclude<Tier, "free"> | null;
  grantExpiresAt: string | null;
  subscriptions: Database["public"]["Tables"]["subscriptions"]["Row"][];
  purchases: Database["public"]["Tables"]["purchases"]["Row"][];
};

/** Roles that unlock the full Blueprint. Access is internal-only by design. */
const INTERNAL_ROLES = ["admin", "analyst"] as const;

async function isInternalUser(supabase: Client, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return (data ?? []).some((row) =>
    (INTERNAL_ROLES as readonly string[]).includes(row.role as string),
  );
}

/**
 * Authoritative tier resolution. Runs with the caller's RLS-scoped client.
 *
 * The Blueprint is no longer sold: it is delivered by Jeff or an analyst on a
 * booked call. Only internal roles (`admin`, `analyst`) resolve above `free`.
 * Purchase, subscription and grant rows are still read and returned so the
 * admin console and historical reporting keep working.
 */
export async function resolveEntitlement(
  supabase: Client,
  userId: string,
  env: StripeEnv,
): Promise<ResolvedEntitlement> {
  const nowIso = new Date().toISOString();
  const [{ data: subs }, { data: purchaseRows }, { data: grantRows }, internal] = await Promise.all([
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
    supabase
      .from("entitlement_grants")
      .select("tier, expires_at")
      .eq("user_id", userId)
      .eq("environment", env)
      .is("revoked_at", null)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`),
    isInternalUser(supabase, userId),
  ]);

  const subscriptions = subs ?? [];
  const purchases = (purchaseRows ?? []).filter((row) => row.status === "completed");

  const activeSub = subscriptions.find(subscriptionIsActive) ?? null;
  const includedOsUntil =
    purchases
      .map((row) => row.included_os_access_until)
      .filter((value): value is string => !!value && new Date(value) > new Date())
      .sort()
      .at(-1) ?? null;

  // Highest active manual grant, if any.
  const grants = (grantRows ?? []) as { tier: Exclude<Tier, "free">; expires_at: string | null }[];
  const bestGrant =
    grants.sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier])[0] ?? null;

  let tier: Tier = "free";
  if (internal) {
    // Internal users get everything; a grant can still pin them to a lower tier
    // is not a case we support, so admins/analysts resolve to the top tier.
    tier = "os";
  }

  return {
    tier,
    includedOsUntil: activeSub ? null : includedOsUntil,
    grantedTier: bestGrant?.tier ?? null,
    grantExpiresAt: bestGrant?.expires_at ?? null,
    subscriptions,
    purchases,
  };
}


export function tierMeets(tier: Tier, feature: Feature) {
  return TIER_RANK[tier] >= TIER_RANK[FEATURE_MINIMUM[feature]];
}

/** Throws when the caller is not entitled. Use before returning any paid payload. */
export async function requireFeature(
  supabase: Client,
  userId: string,
  env: StripeEnv,
  feature: Feature,
): Promise<Tier> {
  const { tier } = await resolveEntitlement(supabase, userId, env);
  if (!tierMeets(tier, feature)) {
    throw new Error(
      `Upgrade required: this feature is part of ${FEATURE_MINIMUM[feature] === "os" ? "Publisher OS" : "Publisher Blueprint"}.`,
    );
  }
  return tier;
}
