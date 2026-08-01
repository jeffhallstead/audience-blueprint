import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ResourceRule } from "@/lib/blueprint/rules";

/** Configuration-driven resource recommendation. */
export function ResourceCard({ resource, onOpen }: { resource: ResourceRule; onOpen: (id: string) => void }) {
  return (
    <article className="surface-panel flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
          {resource.kind}
        </Badge>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden />
          {resource.readingMinutes} min read
        </span>
      </div>
      <h3 className="text-sm font-semibold leading-snug tracking-tight text-foreground">{resource.title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{resource.description}</p>
      <Button variant="outline" size="sm" className="mt-auto w-fit" onClick={() => onOpen(resource.id)}>
        {resource.ctaLabel}
      </Button>
    </article>
  );
}
