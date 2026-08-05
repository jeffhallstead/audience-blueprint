import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StripeEmbeddedCheckout } from "@/components/billing/stripe-embedded-checkout";

/** Modal wrapper that hosts the embedded Stripe payment form. */
export function CheckoutDialog({
  priceId,
  returnUrl,
  onClose,
}: {
  priceId: string;
  returnUrl: string;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete your purchase</DialogTitle>
        </DialogHeader>
        <StripeEmbeddedCheckout priceId={priceId} returnUrl={returnUrl} />
      </DialogContent>
    </Dialog>
  );
}
