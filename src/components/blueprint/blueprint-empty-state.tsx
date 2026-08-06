import { Link } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shown on every blueprint screen when no assessment has been completed. */
export function BlueprintEmptyState({
  title = "Your blueprint is waiting on one assessment",
  description = "The Publisher Blueprint is generated directly from your Publisher Index results. Complete the assessment — about ten minutes — and the full dashboard, roadmap, and resource set will be ready.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="surface-panel flex flex-col items-start gap-4 p-8 sm:p-10">
      <span className="inline-flex size-11 items-center justify-center rounded-full border border-brass/40 bg-brass/10">
        <ClipboardList className="size-5 text-brass" aria-hidden />
      </span>
      <div className="max-w-xl space-y-2">
        <h2 className="text-display text-2xl">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Button asChild>
        <Link to="/wizard">Start the Publisher Index assessment</Link>
      </Button>
    </section>
  );
}
