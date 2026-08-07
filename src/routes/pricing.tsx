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
import { PersonalizationProof } from "@/components/marketing/personalization-proof";
import { PersonaSelector } from "@/components/marketing/persona-selector";


export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "Plans & Pricing | Publisher Blueprint" },
      {
        name: "description",
        content:
          "Choose the Publisher Blueprint plan that fits: the free Publisher Test, or the one-time $49 Publisher Blueprint with your full 90-day roadmap.",
      },
      { property: "og:title", content: "Plans & Pricing | Publisher Blueprint" },
      {
        property: "og:description",
        content: "Free Publisher Test diagnostic, or the $49 one-time Publisher Blueprint roadmap.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://blueprint.jeffhallstead.com/pricing" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://blueprint.jeffhallstead.com/pricing" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Publisher Blueprint",
          description:
            "Strategic assessment and personalized 90-day roadmap for newsletter publishers and content entrepreneurs.",
          brand: { "@type": "Brand", name: "Publisher Blueprint" },
          offers: [
            {
              "@type": "Offer",
              name: "Publisher Test",
              description: "Free diagnostic that scores your publishing maturity across seven dimensions.",
              price: "0",
              priceCurrency: "USD",
              url: "https://blueprint.jeffhallstead.com/pricing",
            },
            {
              "@type": "Offer",
              name: "Publisher Blueprint",
              description: "One-time purchase unlocking the full executive dashboard, 90-day roadmap and exports.",
              price: "49",
              priceCurrency: "USD",
              url: "https://blueprint.jeffhallstead.com/pricing",
            },
          ],
        }),
      },
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

      <PersonalizationProof heading="Every Blueprint is built from your own scores." />

      <section className="max-w-2xl space-y-3">

        <h2 className="text-lg font-semibold tracking-tight text-foreground">Working with your team directly</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The Publisher Blueprint is a starting point. Brand leaders who want to move faster — or want experienced
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
        Payments and invoices are processed securely by Stripe. See our{" "}
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
