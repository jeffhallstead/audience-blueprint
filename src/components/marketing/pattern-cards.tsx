import { PUBLISHER_PATTERNS, PATTERN_EXPLAINER } from "@/lib/publisher-patterns";
import { BookACallButton } from "@/lib/marketing/book-a-call";

export function PatternCards() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-2xl">
        <h2 className="text-display text-3xl">{PATTERN_EXPLAINER.heading}</h2>
        {PATTERN_EXPLAINER.body.map((paragraph) => (
          <p key={paragraph} className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PUBLISHER_PATTERNS.map((pattern) => (
          <div key={pattern.id} className="surface-panel flex flex-col justify-between gap-5 p-6">
            <div className="space-y-3">
              <p className="text-eyebrow">Publisher Pattern</p>
              <h3 className="text-lg font-semibold leading-snug tracking-tight text-foreground">
                {pattern.name}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{pattern.shortDiagnosis}</p>
              <p className="text-sm font-medium text-foreground">{pattern.strategicShift}</p>
            </div>
            <BookACallButton
              surface="homepage_pattern_card"
              patternId={pattern.id}
              label={pattern.cta.label}
              variant="outline"
              size="sm"
              className="w-full"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
