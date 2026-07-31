import { cn } from "@/lib/utils";

/** Wordmark used across marketing and app chrome. Matches jeffhallstead.com. */
export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("flex flex-col leading-none", className)}>
      <span
        className={cn(
          "text-wordmark text-[15px]",
          inverted ? "text-sidebar-accent-foreground" : "text-foreground",
        )}
      >
        Publisher Blueprint
      </span>
      <span className="text-eyebrow mt-1.5 text-[9px] text-primary">Jeff Hallstead</span>
    </span>
  );
}
