import { getPaddleEnvironment } from "@/lib/paddle";

/** Renders nothing in live mode — safe to mount unconditionally. */
export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;

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
