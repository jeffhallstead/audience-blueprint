import { PERSONALIZATION_STATS, formatStat } from "@/lib/blueprint/personalization-stats";

const FIGURES = [
  {
    value: `${formatStat(PERSONALIZATION_STATS.roadmaps)}+`,
    label: "distinct 90-day roadmaps",
    detail: "Each phase is filled with the priorities your own scores select, not a template picked off a shelf.",
  },
  {
    value: `${formatStat(PERSONALIZATION_STATS.blueprints)}+`,
    label: "unique blueprint configurations",
    detail: "Opportunities, quick wins, long-term moves, gaps, strengths, KPIs, and resources all shift with your result.",
  },
  {
    value: formatStat(PERSONALIZATION_STATS.opportunitySets),
    label: "priority opportunity combinations",
    detail: "Ranked by leverage against your weakest dimensions, so no two teams get the same top three.",
  },
];

/**
 * Public proof block explaining how much the engine actually varies per user.
 * Figures come from `PERSONALIZATION_STATS`, re-derivable with
 * `bun scripts/verify-personalization.ts`.
 */
export function PersonalizationProof({ heading }: { heading?: string }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-2xl space-y-3">
        <p className="text-eyebrow">How personalized is it?</p>
        <h2 className="text-display text-3xl">{heading ?? "Not a template with your name on it."}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The rule engine selects and ranks every recommendation from your six category scores and your maturity tier.
          We measured the output space by running{" "}
          {formatStat(PERSONALIZATION_STATS.sampleSize)} simulated score profiles through the live engine and counting
          the distinct plans it produced.
        </p>
      </div>

      <dl className="mt-12 grid gap-10 sm:grid-cols-3">
        {FIGURES.map((figure) => (
          <div key={figure.label} className="space-y-2">
            <dt className="text-display text-3xl text-brass">{figure.value}</dt>
            <dd className="space-y-2">
              <p className="text-sm font-semibold tracking-tight text-foreground">{figure.label}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{figure.detail}</p>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
