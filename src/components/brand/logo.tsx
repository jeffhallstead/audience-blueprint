import { cn } from "@/lib/utils";

/** Product-first wordmark for Publisher Blueprint. */
export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 leading-none", className)}>
      <span
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        )}
        aria-hidden
      >
        <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </span>
      <span
        className={cn(
          "font-[family-name:var(--font-wordmark)] text-[18px] font-semibold tracking-tight",
          inverted ? "text-sidebar-accent-foreground" : "text-foreground",
        )}
      >
        Publisher Blueprint
        <span className="ml-0.5 text-primary" aria-hidden>
          
        </span>
      </span>
    </span>
  );
}
