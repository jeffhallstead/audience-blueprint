import { TrendingDown, TrendingUp } from "lucide-react";
import type { GapReading, StrengthReading } from "@/lib/blueprint/engine";

/** Top organizational strengths with their business implication. */
export function StrengthList({ items }: { items: StrengthReading[] }) {
  return (
    <ul className="grid gap-4 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="surface-panel space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-eyebrow">
              <TrendingUp className="size-3.5 text-success" aria-hidden />
              {item.categoryLabel}
            </span>
            <span className="text-sm font-semibold tabular-nums text-success">{item.score}</span>
          </div>
          <h3 className="text-sm font-semibold leading-snug tracking-tight text-foreground">{item.title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
            <span className="text-foreground">Business implication · </span>
            {item.implication}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Top capability gaps with why they matter and the expected benefit. */
export function GapList({ items }: { items: GapReading[] }) {
  return (
    <ul className="grid gap-4 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="surface-panel space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-eyebrow">
              <TrendingDown className="size-3.5 text-destructive" aria-hidden />
              {item.categoryLabel}
            </span>
            <span className="text-sm font-semibold tabular-nums text-destructive">{item.score}</span>
          </div>
          <h3 className="text-sm font-semibold leading-snug tracking-tight text-foreground">{item.title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="text-foreground">Why it matters · </span>
            {item.whyItMatters}
          </p>
          <p className="border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
            <span className="text-foreground">If improved · </span>
            {item.benefit}
          </p>
        </li>
      ))}
    </ul>
  );
}
