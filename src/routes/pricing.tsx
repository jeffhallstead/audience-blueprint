import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PricingTable } from "@/components/billing/pricing-table";
import { useEntitlement } from "@/lib/commerce/use-entitlement";
import { useCheckout } from "@/lib/commerce/use-checkout";
import { createPortalSession } from "@/lib/commerce/payments.functions";
import { getPaddleEnvironment } from "@/lib/paddle";
import { trackCommerceEvent } from "@/lib/commerce/analytics";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/brand/logo";

export const Route = createFileRoute("/pricing")({
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
        content: "Free diagnostic, $99 one-time Publisher Blueprint™, or $49/month Publisher OS™.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function PricingPage() {
  const { user, loading: authLoading } = useAuth();
  const { tier, entitlement, isLoading } = useEntitlement({ enabled: !!user });
  const { openCheckout, loading } = useCheckout();

  useEffect(() => {
    void trackCommerceEvent("pricing_viewed");
  }, []);

  async function manageSubscription() {
    try {
      const { url } = await createPortalSession({ data: { environment: getPaddleEnvironment() } });
      if (!url) {
        toast.info("No billing account yet.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not open the billing portal.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-5 py-10 sm:px-8">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" aria-label="Publisher Blueprint home">
          <Logo />
        </Link>
        <Button asChild variant="outline" size="sm">
          <Link to={user ? "/dashboard" : "/auth"}>{user ? "Dashboard" : "Sign in"}</Link>
        </Button>
      </div>

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
        loading={loading || isLoading || authLoading}
        hasSubscription={!!entitlement?.subscription}
        ownsBlueprint={(entitlement?.purchases ?? []).some((purchase) => purchase.productId === "publisher_blueprint")}
        onSelect={(priceId) => {
          if (!user) {
            toast.info("Create your free account first — it takes a minute.");
            return;
          }
          void openCheckout({ priceId });
        }}
        onManage={() => void manageSubscription()}
      />

      <p className="text-xs text-muted-foreground">
        Payments, invoices and refunds are handled by our reseller and merchant of record, Paddle.
        Cancel Publisher OS™ any time — access continues to the end of the billing period.
      </p>
    </div>
  );
}
