import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntitlement, entitlementQueryKey } from "@/lib/commerce/use-entitlement";
import { trackCommerceEvent } from "@/lib/commerce/analytics";

export const Route = createFileRoute("/_authenticated/checkout/success")({
  component: CheckoutSuccessPage,
  head: () => ({
    meta: [
      { title: "Purchase confirmed | Publisher Blueprint™" },
      {
        name: "description",
        content: "Your Publisher Blueprint™ purchase is confirmed and your strategic plan is unlocked.",
      },
      { property: "og:title", content: "Purchase confirmed | Publisher Blueprint™" },
      { property: "og:description", content: "Your strategic blueprint is now unlocked." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function CheckoutSuccessPage() {
  const queryClient = useQueryClient();
  const { tier, isFetching } = useEntitlement();

  // The webhook lands a moment after the overlay closes, so poll briefly.
  useEffect(() => {
    void trackCommerceEvent("purchase_confirmed", { tier });
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      void queryClient.invalidateQueries({ queryKey: entitlementQueryKey });
      if (attempts >= 6) clearInterval(timer);
    }, 2500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlocked = tier !== "free";

  return (
    <>
      <div className="mx-auto max-w-2xl space-y-8 py-10 text-center">
        <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden />
        <div className="space-y-3">
          <h1 className="text-display text-3xl">Thank you — your purchase is confirmed</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {unlocked
              ? "Your full blueprint, 90-day roadmap and Publisher Copilot™ deliverables are unlocked."
              : isFetching
                ? "Finalising your account…"
                : "We're confirming your payment. This usually takes a few seconds — refresh if this message persists."}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/dashboard">
              Open my dashboard <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/roadmap">View 90-day roadmap</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          A receipt has been emailed to you by Paddle, our merchant of record. Manage billing any
          time from Settings.
        </p>
      </div>
    </>
  );
}
