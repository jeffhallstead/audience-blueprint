import { cn } from "@/lib/utils";

/** Wordmark used across marketing and app chrome. Matches jeffhallstead.com. */
export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("flex flex-col leading-none", className)}>
      <span
        className={cn(
          "font-[family-name:var(--font-wordmark)] text-[16px] font-bold uppercase tracking-[0.18em]",
          inverted ? "text-sidebar-accent-foreground" : "text-foreground",
        )}
      >
        Publisher Blueprint
      </span>
      <span className="text-eyebrow mt-1.5 text-[9px] text-primary">Jeff Hallstead</span>
    </span>
  );
}
