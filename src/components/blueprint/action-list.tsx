import { CheckCircle2, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ActionReading } from "@/lib/blueprint/engine";

/** Quick wins and long-term initiatives share one presentation. */
export function ActionList({
  items,
  variant = "quick",
}: {
  items: ActionReading[];
  variant?: "quick" | "long";
}) {
  const Icon = variant === "quick" ? CheckCircle2 : Target;
  return (
    <ul className="grid gap-4 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.id} className="surface-panel flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <Icon className={variant === "quick" ? "size-4 text-success" : "size-4 text-brass"} aria-hidden />
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              {item.timeframe}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold leading-snug tracking-tight text-foreground">{item.title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          <p className="mt-auto text-eyebrow">{item.categoryLabel}</p>
        </li>
      ))}
    </ul>
  );
}
