import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Export-ready section wrapper.
 *
 * Every blueprint block is wrapped in one of these. The stable `data-export-*`
 * attributes let a future PDF / PowerPoint / Notion / Google Docs renderer walk
 * the document tree and map sections without touching presentation code.
 */
export function ExportableSection({
  id,
  title,
  eyebrow,
  description,
  actions,
  children,
  className,
}: {
  id: string;
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const headingId = `${id}-heading`;
  return (
    <section
      aria-labelledby={headingId}
      data-export-section={id}
      data-export-title={title}
      className={cn("space-y-5 scroll-mt-24", className)}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl space-y-1.5">
          {eyebrow ? <p className="text-eyebrow">{eyebrow}</p> : null}
          <h2 id={headingId} className="text-display text-2xl">
            {title}
          </h2>
          {description ? <p className="text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
