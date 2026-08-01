import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ExternalLink, ArrowRight } from "lucide-react";
import { DashboardCard } from "@/components/blueprint/dashboard-card";
import { Button } from "@/components/ui/button";
import { useEntitlement } from "@/lib/commerce/use-entitlement";
import { createPortalSession } from "@/lib/commerce/payments.functions";
import { getPaddleEnvironment } from "@/lib/paddle";
import { planForTier } from "@/lib/commerce/plans";
import { trackCommerceEvent } from "@/lib/commerce/analytics";

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";

const formatMoney = (cents: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);

/** Billing summary, subscription state, invoices and portal access. */
export function BillingPanel() {
  const { entitlement, tier, isLoading } = useEntitlement();
  const [opening, setOpening] = useState(false);
  const plan = planForTier(tier);

  async function openPortal() {
    setOpening(true);
    try {
      void trackCommerceEvent("portal_opened");
      const { url } = await createPortalSession({ data: { environment: getPaddleEnvironment() } });
      if (!url) {
        toast.info("No billing account yet — make a purchase first.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("[payments] portal failed", error);
      toast.error("Could not open the billing portal. Please try again.");
    } finally {
      setOpening(false);
    }
  }

  const subscription = entitlement?.subscription ?? null;
  const purchases = entitlement?.purchases ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <DashboardCard eyebrow="Plan" title={isLoading ? "Loading…" : plan.name}>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">{plan.tagline}</p>

          {subscription ? (
            <dl className="space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="capitalize">{subscription.status.replace("_", " ")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  {subscription.cancelAtPeriodEnd ? "Access until" : "Renews"}
                </dt>
                <dd>{formatDate(subscription.currentPeriodEnd)}</dd>
              </div>
            </dl>
          ) : entitlement?.includedOsUntil ? (
            <p className="text-muted-foreground">
              Publisher OS™ is included with your Blueprint purchase until{" "}
              {formatDate(entitlement.includedOsUntil)}.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button asChild variant={tier === "os" ? "outline" : "default"}>
              <Link to="/pricing">
                {tier === "os" ? "View plans" : "Upgrade"} <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button variant="outline" onClick={() => void openPortal()} disabled={opening}>
              Manage billing <ExternalLink className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard
        eyebrow="Billing"
        title="Purchase history"
        footer="Invoices and refunds are handled by Paddle, our merchant of record."
      >
        {purchases.length === 0 ? (
          <p className="text-sm text-muted-foreground">No purchases yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {purchases.map((purchase) => (
              <li key={purchase.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{planForTier("blueprint").name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(purchase.createdAt)}</p>
                </div>
                <span>{formatMoney(purchase.amountCents, purchase.currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </div>
  );
}
