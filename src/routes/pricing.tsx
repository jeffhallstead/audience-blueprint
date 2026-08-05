import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PricingTable } from "@/components/billing/pricing-table";
import { useEntitlement } from "@/lib/commerce/use-entitlement";
import { useCheckout } from "@/lib/commerce/use-checkout";
import { createPortalSession } from "@/lib/commerce/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
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
          "Choose the Publisher Blueprint™ plan that fits: free Publisher Index™, one-time strategic blueprint, or the monthly Publisher OS™ operating system.",
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
  const { openCheckout, loading, checkoutElement } = useCheckout();

  useEffect(() => {
    void trackCommerceEvent("pricing_viewed");
  }, []);

  async function manageSubscription() {
    try {
      const session = await createPortalSession({ data: { environment: getStripeEnvironment() } });
      if ("error" in session) throw new Error(session.error);
      const { url } = session;
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
        <h1 className="text-display text-3xl sm:text-4xl">Start with a score. Leave with a plan.</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The Publisher Test is free. The Blueprint gives you the full roadmap.
        </p>
        <p className="text-xs text-muted-foreground">by Jeff Hallstead</p>
      </header>

      <PricingTable
        currentTier={tier}
        loading={loading || isLoading || authLoading}
        isAuthenticated={!!user}
        hasSubscription={!!entitlement?.subscription}
        includedOsUntil={entitlement?.includedOsUntil ?? null}
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

      <section className="max-w-2xl space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Working with your team directly</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The Publisher Blueprint™ is a starting point. Brand leaders who want to move faster — or want experienced
          hands on the implementation — can work with Jeff directly. Consulting engagements are available for teams
          ready to build.
        </p>
        <a
          href="https://jeffhallstead.com/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-sm text-primary underline underline-offset-4"
        >
          Get in touch →
        </a>
      </section>

      <p className="text-xs text-muted-foreground">
        Payments, invoices and refunds are handled by our reseller and merchant of record, Paddle. See our{" "}
        <Link to="/terms" className="underline">
          Terms
        </Link>
        ,{" "}
        <Link to="/refund-policy" className="underline">
          Refund policy
        </Link>{" "}
        and{" "}
        <Link to="/privacy" className="underline">
          Privacy notice
        </Link>
        .
      </p>
      {checkoutElement}
    </div>

  );
}
