import type { RoadmapPhase } from "@/lib/blueprint/engine";

/** One month of the 90-day roadmap: objective, activities, success metrics. */
export function RoadmapPhaseCard({ phase }: { phase: RoadmapPhase }) {
  return (
    <article className="surface-panel space-y-5 p-6" data-export-phase={phase.month}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-eyebrow">Month {phase.month}</p>
          <h3 className="text-display mt-1 text-xl">{phase.phase}</h3>
        </div>
        <span className="inline-flex rounded-full border border-brass/50 bg-brass/10 px-3 py-1 text-[10px] uppercase tracking-widest text-brass">
          Days {(phase.month - 1) * 30 + 1}–{phase.month * 30}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-foreground">{phase.objective}</p>

      {phase.priorities.length > 0 ? (
        <div className="space-y-3 rounded-lg border border-brass/30 bg-brass/5 p-4">
          <p className="text-eyebrow text-brass">{phase.prioritiesLabel}</p>
          <ul className="space-y-3">
            {phase.priorities.map((priority) => (
              <li key={priority.id} className="space-y-1">
                <p className="text-sm font-semibold tracking-tight text-foreground">{priority.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{priority.description}</p>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {priority.categoryLabel} · {priority.timeframe}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}


      <div className="grid gap-6 border-t border-border pt-5 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-eyebrow">Key activities</p>
          <ul className="space-y-2">
            {phase.activities.map((activity) => (
              <li key={activity} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-brass" />
                {activity}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-eyebrow">Success metrics</p>
          <ul className="space-y-2">
            {phase.metrics.map((metric) => (
              <li key={metric} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-success" />
                {metric}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
