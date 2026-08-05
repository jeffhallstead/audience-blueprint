import { getStripeEnvironment, paymentsConfigured } from "@/lib/stripe";

/** Renders nothing in live mode — safe to mount unconditionally. */
export function PaymentTestModeBanner() {
  if (!paymentsConfigured()) {
    return (
      <div className="w-full border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-center text-xs tracking-wide text-destructive">
        Checkout is not configured for this build yet. Payments are temporarily unavailable.
      </div>
    );
  }

  if (getStripeEnvironment() !== "sandbox") return null;

  return (
    <div className="w-full border-b border-accent/40 bg-accent/10 px-4 py-2 text-center text-xs tracking-wide text-accent-foreground">
      All payments in the preview are in test mode.{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium underline underline-offset-4"
      >
        Read more
      </a>
    </div>
  );
}
