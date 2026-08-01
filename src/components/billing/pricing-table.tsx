import { Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, TIER_RANK, type Tier } from "@/lib/commerce/plans";
import { cn } from "@/lib/utils";

type PricingTableProps = {
  currentTier: Tier;
  loading?: boolean;
  /** True when there is an active or scheduled-to-cancel OS subscription. */
  hasSubscription?: boolean;
  /** True when the one-time Blueprint has actually been purchased. */
  ownsBlueprint?: boolean;
  onSelect: (priceId: string) => void;
  onManage?: (() => void) | undefined;
};

export function PricingTable({
  currentTier,
  loading,
  hasSubscription,
  ownsBlueprint,
  onSelect,
  onManage,
}: PricingTableProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PLANS.map((plan) => {
        const featured = plan.tier === "blueprint";
        // The Blueprint is a one-time purchase: once owned it is never re-sold,
        // including to OS subscribers who reached that tier through it.
        const owned =
          plan.tier === "blueprint"
            ? !!ownsBlueprint
            : plan.tier !== "free" && TIER_RANK[currentTier] >= TIER_RANK[plan.tier];
        const isCurrent = plan.tier === currentTier;
        const manageable = plan.tier === "os" && hasSubscription;

        let label = `Get ${plan.name}`;
        if (!plan.priceId) label = isCurrent ? "Your current plan" : "Included free";
        else if (manageable) label = "Manage subscription";
        else if (owned) label = plan.tier === "blueprint" ? "Owned — lifetime access" : "Your current plan";

        const disabled = loading || (!plan.priceId ? true : owned && !manageable);

        return (
          <section
            key={plan.tier}
            aria-labelledby={`plan-${plan.tier}`}
            className={cn(
              "surface-panel flex flex-col gap-6 p-6 sm:p-8",
              featured && "border-primary/50 shadow-lg",
              owned && "border-success/40",
            )}
          >
            <header className="space-y-2">
              <p className="text-eyebrow">{plan.name}</p>
              <h2 id={`plan-${plan.tier}`} className="text-display text-4xl">
                {plan.priceLabel}
              </h2>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {plan.cadence}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">{plan.tagline}</p>
              {plan.highlight && !owned ? (
                <p className="inline-flex rounded-full border border-primary/40 px-3 py-1 text-xs text-primary">
                  {plan.highlight}
                </p>
              ) : null}
              {owned ? (
                <p className="inline-flex rounded-full border border-success/40 px-3 py-1 text-xs text-success">
                  Included in your account
                </p>
              ) : null}
            </header>

            <ul className="flex-1 space-y-3 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
              {plan.excluded?.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-muted-foreground">
                  <Minus className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              variant={featured && !owned ? "default" : "outline"}
              size="lg"
              disabled={disabled}
              onClick={() => {
                if (manageable) return onManage?.();
                if (plan.priceId && !owned) onSelect(plan.priceId);
              }}
            >
              {label}
            </Button>
          </section>
        );
      })}
    </div>
  );
}
