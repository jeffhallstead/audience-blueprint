import { Badge } from "@/components/ui/badge";
import type { OpportunityReading } from "@/lib/blueprint/engine";

const IMPACT_TONE: Record<string, string> = {
  High: "text-success",
  Medium: "text-warning",
  Low: "text-muted-foreground",
};

/** Ranked table of the three highest-leverage opportunities. */
export function OpportunityMatrix({ items }: { items: OpportunityReading[] }) {
  if (!items.length) {
    return (
      <div className="surface-panel p-6 text-sm text-muted-foreground">
        No structural gaps surfaced at this score. Focus on defending and monetizing the audience you own.
      </div>
    );
  }

  return (
    <div className="surface-panel overflow-hidden">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Highest-leverage improvement opportunities ranked by priority</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="px-5 py-3 text-eyebrow font-normal">
              Priority
            </th>
            <th scope="col" className="px-5 py-3 text-eyebrow font-normal">
              Opportunity
            </th>
            <th scope="col" className="hidden px-5 py-3 text-eyebrow font-normal sm:table-cell">
              Business impact
            </th>
            <th scope="col" className="hidden px-5 py-3 text-eyebrow font-normal sm:table-cell">
              Effort
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border last:border-0 align-top">
              <td className="px-5 py-4">
                <span className="inline-flex size-7 items-center justify-center rounded-full border border-brass/50 bg-brass/10 text-xs font-semibold tabular-nums text-brass">
                  {item.rank}
                </span>
              </td>
              <td className="px-5 py-4">
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">{item.rationale}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 sm:hidden">
                  <Badge variant="outline" className="text-[10px] uppercase">
                    Impact {item.impact}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    Effort {item.effort}
                  </Badge>
                </div>
              </td>
              <td className={`hidden px-5 py-4 font-medium sm:table-cell ${IMPACT_TONE[item.impact] ?? ""}`}>
                {item.impact}
              </td>
              <td className="hidden px-5 py-4 text-muted-foreground sm:table-cell">{item.effort}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
