import type { KpiRule } from "@/lib/blueprint/rules";

/** Recommended KPIs for the user's maturity tier. Values are illustrative. */
export function KpiGrid({ kpis }: { kpis: KpiRule[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi) => (
        <div key={kpi.id} className="rounded-lg border border-border bg-surface px-4 py-4">
          <p className="text-eyebrow">{kpi.label}</p>
          <p className="mt-2 text-sm font-semibold tracking-tight text-foreground">{kpi.target}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{kpi.description}</p>
        </div>
      ))}
    </div>
  );
}
