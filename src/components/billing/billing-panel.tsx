import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ExternalLink, ArrowRight } from "lucide-react";
import { DashboardCard } from "@/components/blueprint/dashboard-card";
import { Button } from "@/components/ui/button";
import { useEntitlement } from "@/lib/commerce/use-entitlement";
import { createPortalSession, listInvoices } from "@/lib/commerce/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
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

  async function openPortal(target: "overview" | "cancel" = "overview") {
    setOpening(true);
    try {
      void trackCommerceEvent(target === "cancel" ? "cancel_started" : "portal_opened");
      const session = await createPortalSession({ data: { environment: getStripeEnvironment() } });
      if ("error" in session) throw new Error(session.error);
      const { url } = session;
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
  const invoicesQuery = useQuery({
    queryKey: ["invoices", getStripeEnvironment()],
    queryFn: () => listInvoices({ data: { environment: getStripeEnvironment() } }),
    staleTime: 60_000,
  });
  const invoices = invoicesQuery.data ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <DashboardCard eyebrow="Plan" title={isLoading ? "Loading…" : plan.name}>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">{plan.tagline}</p>

          {subscription?.status === "past_due" ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Your last payment failed. We are retrying it — update your payment method to keep
              Publisher OS™ active.
            </p>
          ) : null}

          {subscription?.cancelAtPeriodEnd ? (
            <p className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              Your subscription is scheduled to end on {formatDate(subscription.currentPeriodEnd)}.
              You keep full access until then.
            </p>
          ) : null}

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
            {subscription && !subscription.cancelAtPeriodEnd && subscription.status !== "canceled" ? (
              <Button
                variant="ghost"
                onClick={() => void openPortal("cancel")}
                disabled={opening}
                className="text-muted-foreground"
              >
                Cancel subscription
              </Button>
            ) : null}
          </div>
        </div>
      </DashboardCard>

      <DashboardCard
        eyebrow="Billing"
        title="Invoices"
        footer="Invoices and refunds are handled by Paddle, our merchant of record."
      >
        {invoicesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading invoices…</p>
        ) : invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {invoices.map((invoice) => (
              <li key={invoice.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{invoice.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(invoice.createdAt)}
                    {invoice.status !== "completed" ? ` · ${invoice.status.replace("_", " ")}` : ""}
                  </p>
                </div>
                <span>{formatMoney(invoice.amountCents, invoice.currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </div>
  );
}
