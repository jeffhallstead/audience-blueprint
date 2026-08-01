import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CtaRule } from "@/lib/blueprint/rules";

/** Context-sensitive next-step CTA, selected by maturity tier. */
export function UpgradeCta({ cta, onClick }: { cta: CtaRule; onClick: () => void }) {
  return (
    <section
      aria-labelledby="upgrade-cta-heading"
      data-export-section="next-step"
      className="surface-panel flex flex-col gap-5 border-brass/40 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
    >
      <div className="max-w-2xl space-y-2">
        <p className="text-eyebrow">{cta.eyebrow}</p>
        <h2 id="upgrade-cta-heading" className="text-display text-2xl">
          {cta.title}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{cta.body}</p>
      </div>
      <Button size="lg" className="shrink-0" onClick={onClick}>
        {cta.action} <ArrowRight className="size-4" aria-hidden />
      </Button>
    </section>
  );
}
