import type { ReactNode } from "react";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntitlement } from "@/lib/commerce/use-entitlement";
import { useCheckout } from "@/lib/commerce/use-checkout";
import { FEATURE_MINIMUM, planForTier, type Feature } from "@/lib/commerce/plans";
import { trackCommerceEvent } from "@/lib/commerce/analytics";
import { cn } from "@/lib/utils";

type LockedFeatureProps = {
  feature: Feature;
  title: string;
  description: string;
  /** Blurred preview rendered behind the lock overlay. */
  preview?: ReactNode;
  className?: string;
};

/**
 * UX-level paywall. The underlying data is also gated server-side, so this
 * only controls what is worth rendering.
 */
export function LockedFeature({
  feature,
  title,
  description,
  preview,
  className,
}: LockedFeatureProps) {
  const requiredTier = FEATURE_MINIMUM[feature];
  const plan = planForTier(requiredTier);
  const { openCheckout, loading, checkoutElement } = useCheckout();

  return (
    <section
      className={cn("surface-panel relative overflow-hidden p-6 sm:p-8", className)}
      aria-labelledby={`locked-${feature}`}
    >
      {preview ? (
        <div aria-hidden className="pointer-events-none select-none opacity-30 blur-sm">
          {preview}
        </div>
      ) : null}

      <div
        className={cn(
          "flex flex-col items-start gap-4",
          preview && "absolute inset-0 justify-center bg-background/70 p-6 backdrop-blur-sm sm:p-8",
        )}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-eyebrow">
          <Lock className="size-3" aria-hidden /> {plan.name}
        </span>
        <div className="max-w-xl space-y-2">
          <h3 id={`locked-${feature}`} className="text-display text-xl">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={loading || !plan.priceId}
            onClick={() => {
              void trackCommerceEvent("upgrade_prompt_viewed", { feature });
              if (plan.priceId) void openCheckout({ priceId: plan.priceId });
            }}
          >
            Unlock for {plan.priceLabel} <ArrowRight className="size-4" aria-hidden />
          </Button>
          <span className="text-xs text-muted-foreground">{plan.cadence}</span>
        </div>
      </div>
    </section>
  );
}

/** Renders children when entitled, otherwise the paywall. */
export function FeatureGate({
  feature,
  title,
  description,
  preview,
  children,
}: LockedFeatureProps & { children: ReactNode }) {
  const { can, isLoading } = useEntitlement();
  if (isLoading) return null;
  if (can(feature)) return <>{children}</>;
  return (
    <LockedFeature
      feature={feature}
      title={title}
      description={description}
      {...(preview ? { preview } : {})}
    />
  );
}
