import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Simulation } from "@/lib/copilot/schema";

function directionMeta(direction: string) {
  const value = direction.toLowerCase();
  if (value.includes("up")) return { Icon: ArrowUpRight, tone: "text-emerald-400", label: "Improves" };
  if (value.includes("down")) return { Icon: ArrowDownRight, tone: "text-destructive", label: "Pressures" };
  return { Icon: Minus, tone: "text-muted-foreground", label: "No change" };
}

const MAGNITUDE_WIDTH: Record<string, string> = {
  negligible: "w-1/6",
  modest: "w-1/2",
  significant: "w-full",
};

/**
 * Directional scenario read.
 *
 * Deliberately shows no numbers: the model estimates direction and magnitude
 * only, and a real score change requires a re-assessment.
 */
export function SimulationView({ simulation }: { simulation: Simulation }) {
  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-brass/40 bg-brass/5 p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">Directional read</p>
        <p className="mt-3 text-sm leading-relaxed text-foreground">{simulation.headline}</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Category effects</h2>
        <div className="space-y-2">
          {simulation.categories.map((entry, index) => {
            const { Icon, tone, label } = directionMeta(entry.direction);
            const magnitude = entry.magnitude.toLowerCase();
            const width = MAGNITUDE_WIDTH[magnitude] ?? "w-1/2";
            return (
              <div key={`${entry.category}-${index}`} className="rounded-lg border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`size-4 ${tone}`} aria-hidden />
                    <span className="text-sm font-semibold text-foreground">{entry.category}</span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {label} · {entry.magnitude}
                  </span>
                </div>
                <div className="mt-3 h-1 rounded-full bg-muted">
                  <div className={`h-1 rounded-full bg-brass/70 ${width}`} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{entry.rationale}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">Prerequisites</p>
          <ul className="mt-3 ml-4 list-disc space-y-1.5 text-sm text-foreground/85 marker:text-brass">
            {simulation.prerequisites.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-border bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Assumptions</p>
          <ul className="mt-3 ml-4 list-disc space-y-1.5 text-sm text-muted-foreground">
            {simulation.assumptions.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-brass/40 bg-brass/5 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">Recommended experiment</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{simulation.recommendedExperiment}</p>
      </section>

      <section className="rounded-xl border border-dashed border-border p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Read this carefully</p>
        <ul className="mt-3 ml-4 list-disc space-y-1.5 text-xs text-muted-foreground">
          {simulation.caveats.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
          <li>
            This is a reasoned estimate, not a forecast. Only a re-assessment produces an actual Publisher Index score.
          </li>
        </ul>
      </section>
    </div>
  );
}
