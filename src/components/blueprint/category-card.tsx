import { bandToneClasses } from "@/lib/blueprint/engine";
import type { CategoryReading } from "@/lib/blueprint/engine";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** One of the six Publisher Index™ category cards. */
export function CategoryCard({ reading }: { reading: CategoryReading }) {
  const tone = bandToneClasses(reading.band);
  return (
    <article className={cn("surface-panel flex flex-col gap-4 p-5", tone.border)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-eyebrow">{reading.label}</p>
          <p className={cn("mt-1 text-sm font-medium", tone.text)}>{reading.status}</p>
        </div>
        <div className="text-right">
          <p className="text-display text-3xl leading-none tabular-nums">{reading.score}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">of 100</p>
        </div>
      </div>

      <div
        role="progressbar"
        aria-valuenow={reading.score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${reading.label} score`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${reading.score}%` }} />
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{reading.explanation}</p>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wide", tone.text, tone.border)}>
          {reading.bandLabel}
        </Badge>
        {reading.priority !== null ? (
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
            Priority {reading.priority}
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
            Strength
          </Badge>
        )}
      </div>
    </article>
  );
}
