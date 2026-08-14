import { BookACallButton } from "@/lib/marketing/book-a-call";
import { PATTERN_EXPLAINER, type PublisherPattern } from "@/lib/publisher-patterns";
import type { Blueprint } from "@/lib/blueprint/engine";

interface PatternSummaryProps {
  blueprint: Blueprint;
}

/** Compact pattern banner: name, short diagnosis, strategic shift. */
export function PatternSummary({ blueprint }: PatternSummaryProps) {
  const pattern = blueprint.pattern;
  const weakest = blueprint.categories.find((category) => category.priority === 1);

  return (
    <div className="surface-panel border-l-4 border-l-primary p-6 sm:p-8">
      <div className="space-y-4">
        <p className="text-eyebrow">Your Publisher Pattern</p>
        <h2 className="text-display text-2xl leading-snug">{pattern.name}</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {pattern.diagnosisLine} {PATTERN_EXPLAINER.patternLine}
        </p>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-eyebrow">Strategic shift</dt>
            <dd className="mt-1 text-sm text-foreground">{pattern.strategicShift}</dd>
          </div>
          <div>
            <dt className="text-eyebrow">Blueprint priority</dt>
            <dd className="mt-1 text-sm text-foreground">{pattern.blueprintPriority}</dd>
          </div>
        </dl>
        <BookACallButton
          surface="pattern_summary"
          patternId={pattern.id}
          maturityLevel={blueprint.maturity.level}
          {...(weakest?.id ? { weakestCategory: weakest.id } : {})}
          label={pattern.cta.label}
          size="sm"
        />
      </div>
    </div>
  );
}

/** Full canonical pattern detail: diagnosis, signals, constraint, opportunity. */
export function PatternDetail({ pattern }: { pattern: PublisherPattern }) {
  return (
    <section
      aria-labelledby="publisher-pattern-heading"
      data-export-section="pattern"
      className="surface-panel space-y-6 p-6 sm:p-8"
    >
      <div className="space-y-2">
        <p className="text-eyebrow">Publisher Pattern</p>
        <h2 id="publisher-pattern-heading" className="text-display text-2xl">
          {pattern.name}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{pattern.diagnosisLine}</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Diagnosis</h3>
        {pattern.diagnosis.map((paragraph) => (
          <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Typical signals</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {pattern.typicalSignals.map((signal) => (
            <li key={signal} className="text-sm leading-relaxed text-muted-foreground">
              · {signal}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Underlying constraint</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{pattern.underlyingConstraint}</p>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Strategic opportunity</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{pattern.strategicOpportunity}</p>
        </div>
      </div>

      <div className="border-l-2 border-l-primary pl-4">
        <p className="text-eyebrow">Publisher Blueprint priority</p>
        <p className="mt-1 text-sm font-medium text-foreground">{pattern.blueprintPriority}</p>
      </div>
    </section>
  );
}
