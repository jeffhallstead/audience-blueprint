import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { PricingTable } from "@/components/billing/pricing-table";
import { PaymentTestModeBanner } from "@/components/billing/payment-test-mode-banner";
import { useEntitlement } from "@/lib/commerce/use-entitlement";
import { useCheckout } from "@/lib/commerce/use-checkout";
import { trackCommerceEvent } from "@/lib/commerce/analytics";

export const Route = createFileRoute("/_authenticated/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Plans & Pricing | Publisher Blueprint™" },
      {
        name: "description",
        content:
          "Choose the Publisher Blueprint™ plan that fits: free diagnostic, one-time strategic blueprint, or the monthly Publisher OS™ operating system.",
      },
      { property: "og:title", content: "Plans & Pricing | Publisher Blueprint™" },
      {
        property: "og:description",
        content:
          "Free diagnostic, $99 one-time Publisher Blueprint™, or $49/month Publisher OS™.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function PricingPage() {
  const { tier, isLoading } = useEntitlement();
  const { openCheckout, loading } = useCheckout();

  useEffect(() => {
    void trackCommerceEvent("pricing_viewed");
  }, []);

  return (
    <>
      <PaymentTestModeBanner />
      <div className="space-y-10">
        <header className="max-w-2xl space-y-3">
          <p className="text-eyebrow">Plans</p>
          <h1 className="text-display text-3xl sm:text-4xl">
            Turn your Publisher Index™ into an operating plan
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Start free with the diagnostic. Upgrade when you want the full blueprint, the 90-day
            roadmap, and Publisher Copilot™ working alongside your team.
          </p>
        </header>

        <PricingTable
          currentTier={tier}
          loading={loading || isLoading}
          onSelect={(priceId) => void openCheckout({ priceId })}
        />

        <p className="text-xs text-muted-foreground">
          Payments, invoices and refunds are handled by our reseller and merchant of record,
          Paddle. Cancel Publisher OS™ any time — access continues to the end of the billing
          period.
        </p>
      </div>
    </>
  );
}
