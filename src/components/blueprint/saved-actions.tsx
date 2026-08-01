import { Link } from "@tanstack/react-router";
import { Check, FileText, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavedRecommendations, useToggleSavedStatus } from "@/lib/copilot/queries";
import { DOCUMENT_KIND_LABELS } from "@/lib/copilot/objectives";

/**
 * Actions pushed into the Blueprint from Publisher Copilot™.
 *
 * Presentation only — the list, its status transitions, and cache
 * invalidation all live in the Copilot data layer.
 */
export function SavedActions({ compact = false }: { compact?: boolean }) {
  const { data, isLoading } = useSavedRecommendations();
  const toggleStatus = useToggleSavedStatus();

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 2 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const items = data ?? [];
  const active = items.filter((item) => item.status !== "done");
  const done = items.filter((item) => item.status === "done");

  if (!items.length) {
    return (
      <div className="surface-panel space-y-3 p-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Nothing added yet. Open a deliverable in the Strategy Library and choose{" "}
          <span className="text-foreground">Add to Blueprint</span> on any recommended action — it will collect here
          alongside your plan.
        </p>
        <Button asChild size="sm" variant="outline">
          <Link to="/copilot/documents">Open Strategy Library</Link>
        </Button>
      </div>
    );
  }

  function setStatus(id: string, status: string, message: string) {
    toggleStatus.mutate(
      { id, status },
      {
        onSuccess: () => toast.success(message),
        onError: (error) => toast.error((error as Error).message),
      },
    );
  }

  return (
    <div className="space-y-3">
      {active.map((item) => (
        <article key={item.id} className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h3 className="text-sm font-semibold leading-snug text-foreground">{item.title}</h3>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                disabled={toggleStatus.isPending}
                onClick={() => setStatus(item.id, "done", "Marked done")}
              >
                <Check className="size-3.5" aria-hidden /> Done
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                disabled={toggleStatus.isPending}
                onClick={() => setStatus(item.id, "archived", "Removed from your Blueprint")}
                aria-label={`Remove ${item.title}`}
              >
                <X className="size-3.5" aria-hidden /> Remove
              </Button>
            </div>
          </div>

          {!compact && item.body ? (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              {DOCUMENT_KIND_LABELS[item.category] ?? item.category}
            </Badge>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              Impact: {item.impact}
            </Badge>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              Effort: {item.effort}
            </Badge>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Added {new Date(item.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
            </span>
            {item.document_id ? (
              <Link
                to="/copilot/documents/$documentId"
                params={{ documentId: item.document_id }}
                className="inline-flex items-center gap-1 text-[11px] text-brass underline-offset-4 hover:underline"
              >
                <FileText className="size-3" aria-hidden /> Source document
              </Link>
            ) : null}
          </div>
        </article>
      ))}

      {done.length ? (
        <details className="rounded-xl border border-dashed border-border p-4">
          <summary className="cursor-pointer text-xs uppercase tracking-wider text-muted-foreground">
            Completed ({done.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {done.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <span className="line-through">{item.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={toggleStatus.isPending}
                  onClick={() => setStatus(item.id, "saved", "Moved back to active")}
                >
                  <Undo2 className="size-3.5" aria-hidden /> Reopen
                </Button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
