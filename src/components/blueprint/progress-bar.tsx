import { cn } from "@/lib/utils";

/** Thin labelled progress track used by scores and the wizard. */
export function ProgressBar({
  value,
  label,
  className,
  tone = "primary",
}: {
  value: number;
  label?: string;
  className?: string;
  tone?: "primary" | "brass";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium tabular-nums text-foreground">{clamped}</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", tone === "brass" ? "bg-brass" : "bg-primary")}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
