import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Base surface for dashboard content. Never restyle colors at call sites. */
export function DashboardCard({
  eyebrow,
  title,
  footer,
  children,
  className,
  accent = false,
}: {
  eyebrow?: string;
  title?: string;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <section
      className={cn(
        "surface-panel flex flex-col gap-4 p-6 transition-shadow hover:shadow-elevated",
        accent && "border-brass/40",
        className,
      )}
    >
      {(eyebrow || title) && (
        <div className="space-y-1.5">
          {eyebrow ? <p className="text-eyebrow">{eyebrow}</p> : null}
          {title ? <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2> : null}
        </div>
      )}
      {children}
      {footer ? <div className="mt-auto border-t border-border pt-4 text-xs text-muted-foreground">{footer}</div> : null}
    </section>
  );
}
