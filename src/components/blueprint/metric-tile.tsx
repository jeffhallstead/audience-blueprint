import { cn } from "@/lib/utils";

/** Compact key/value tile for dense metric rows. */
export function MetricTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface px-4 py-3.5", className)}>
      <p className="text-eyebrow">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
