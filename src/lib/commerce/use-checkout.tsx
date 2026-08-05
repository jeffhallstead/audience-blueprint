import { useCallback, useState } from "react";
import { toast } from "sonner";
import { getStripeEnvironment, paymentsConfigured } from "@/lib/stripe";
import { useAuth } from "@/hooks/use-auth";
import { trackCommerceEvent } from "@/lib/commerce/analytics";
import { CheckoutDialog } from "@/components/billing/checkout-dialog";

/**
 * Opens the embedded Stripe checkout for a plan price. Consumers must render
 * the returned `checkoutElement` so the payment form has somewhere to mount.
 */
export function useCheckout() {
  const [priceId, setPriceId] = useState<string | null>(null);
  const [returnUrl, setReturnUrl] = useState<string>("");
  const { user } = useAuth();

  const openCheckout = useCallback(
    (options: { priceId: string; successUrl?: string }) => {
      if (!user) {
        toast.error("Sign in to continue to checkout.");
        return;
      }
      if (!paymentsConfigured()) {
        toast.error("Payments are not available yet. Please try again shortly.");
        return;
      }
      void trackCommerceEvent("checkout_started", { priceId: options.priceId });
      setReturnUrl(
        options.successUrl ??
          `${window.location.origin}/checkout/success?price=${encodeURIComponent(options.priceId)}&session_id={CHECKOUT_SESSION_ID}`,
      );
      setPriceId(options.priceId);
    },
    [user],
  );

  const closeCheckout = useCallback(() => setPriceId(null), []);

  const checkoutElement = priceId ? (
    <CheckoutDialog priceId={priceId} returnUrl={returnUrl} onClose={closeCheckout} />
  ) : null;

  return {
    openCheckout,
    closeCheckout,
    checkoutElement,
    isOpen: priceId !== null,
    loading: false,
    environment: getStripeEnvironment(),
  };
}
