import { Badge } from "@/components/ui/badge";
import type { RecommendationItem } from "@/lib/placeholder-blueprint";

/** Single strategic recommendation with impact/effort signalling. */
export function RecommendationCard({ item }: { item: RecommendationItem }) {
  return (
    <article className="surface-panel space-y-3 p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-eyebrow">{item.category}</p>
        <div className="flex gap-1.5">
          <Badge variant="outline" className="text-[10px] uppercase">
            Impact {item.impact}
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase">
            Effort {item.effort}
          </Badge>
        </div>
      </div>
      <h3 className="text-sm font-semibold leading-snug tracking-tight text-foreground">{item.title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{item.rationale}</p>
    </article>
  );
}
