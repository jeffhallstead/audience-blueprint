import { cn } from "@/lib/utils";

/** Wordmark used across marketing and app chrome. */
export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "grid size-8 place-items-center rounded-lg border text-[13px] font-semibold",
          inverted
            ? "border-sidebar-border bg-sidebar-accent text-sidebar-primary"
            : "border-border bg-primary text-primary-foreground",
        )}
        aria-hidden
      >
        OA
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[13px] font-semibold tracking-tight",
            inverted ? "text-sidebar-foreground" : "text-foreground",
          )}
        >
          Publisher
        </span>
        <span className="text-eyebrow mt-1 text-[9px]">Blueprint</span>
      </span>
    </span>
  );
}
