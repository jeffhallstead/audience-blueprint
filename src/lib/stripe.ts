import { loadStripe, type Stripe } from "@stripe/stripe-js";

type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

/** Single source of truth for which payment environment the client is in. */
export function getStripeEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  // No token yet (payments not configured): read/report as the test environment.
  // Checkout itself is gated separately by paymentsConfigured().
  return "sandbox";
}

/** True when checkout can be opened at all — use for UI guards. */
export function paymentsConfigured(): boolean {
  return !!clientToken && (clientToken.startsWith("pk_test_") || clientToken.startsWith("pk_live_"));
}

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    getStripeEnvironment();
    stripePromise = loadStripe(clientToken as string);
  }
  return stripePromise;
}
