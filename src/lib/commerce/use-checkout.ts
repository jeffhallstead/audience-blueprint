import { useState } from "react";
import { toast } from "sonner";
import { initializePaddle, getPaddlePriceId, getPaddleEnvironment } from "@/lib/paddle";
import { useAuth } from "@/hooks/use-auth";
import { trackCommerceEvent } from "@/lib/commerce/analytics";

/** Opens the hosted checkout overlay for a plan price. */
export function useCheckout() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  async function openCheckout(options: { priceId: string; successUrl?: string }) {
    if (!user) {
      toast.error("Sign in to continue to checkout.");
      return;
    }
    setLoading(true);
    try {
      void trackCommerceEvent("checkout_started", { priceId: options.priceId });
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(options.priceId);

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: user.email ? { email: user.email } : undefined,
        customData: { userId: user.id },
        settings: {
          displayMode: "overlay",
          variant: "one-page",
          allowLogout: false,
          successUrl:
            options.successUrl ??
            `${window.location.origin}/checkout/success?price=${encodeURIComponent(options.priceId)}`,
        },
      });
    } catch (error) {
      console.error("[payments] checkout failed", error);
      toast.error("Checkout could not be opened. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return { openCheckout, loading, environment: getPaddleEnvironment() };
}
