import { useQuery } from "@tanstack/react-query";
import { getStripeEnvironment } from "@/lib/stripe";
import { getEntitlement, type Entitlement } from "@/lib/commerce/entitlement.functions";
import { tierAllows, type Feature, type Tier } from "@/lib/commerce/plans";

export const entitlementQueryKey = ["entitlement"] as const;

/**
 * Client-side entitlement state. UX only — every paid payload is also gated
 * server-side (see assertFeature / route loaders).
 */
export function useEntitlement(options: { enabled?: boolean } = {}) {
  const query = useQuery({
    enabled: options.enabled ?? true,
    queryKey: entitlementQueryKey,
    queryFn: () => getEntitlement({ data: { environment: getStripeEnvironment() } }),
    staleTime: 30_000,
  });

  const entitlement: Entitlement | undefined = query.data;
  const tier: Tier = entitlement?.tier ?? "free";

  return {
    ...query,
    entitlement,
    tier,
    can: (feature: Feature) => tierAllows(tier, feature),
    isPaid: tier !== "free",
  };
}
