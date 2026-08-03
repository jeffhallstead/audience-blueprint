import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getLifecycleBreakdown, rebuildLifecycles } from "@/lib/lifecycle/lifecycle.functions";
import { STAGE_DESCRIPTION, type LifecycleStage } from "@/lib/lifecycle/stages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const relative = (iso: string) => new Date(iso).toLocaleString("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** Funnel view of derived lifecycle stages, for the internal console. */
export function LifecyclePanel() {
  const fetchBreakdown = useServerFn(getLifecycleBreakdown);
  const rebuild = useServerFn(rebuildLifecycles);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "lifecycle"],
    queryFn: () => fetchBreakdown(),
    retry: false,
  });

  const rebuildMutation = useMutation({
    mutationFn: () => rebuild(),
    onSuccess: (result) => {
      toast.success(`Rebuilt ${result.processed} lifecycle records (${result.changed} changed)`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "lifecycle"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading || !data) return <Skeleton className="h-64" />;

  const max = Math.max(1, ...data.stages.map((s) => s.count));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {data.tracked} tracked {data.tracked === 1 ? "account" : "accounts"}. Stages are derived
          from the platform event stream and entitlements — never set by hand.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => rebuildMutation.mutate()}
          disabled={rebuildMutation.isPending}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${rebuildMutation.isPending ? "animate-spin" : ""}`} />
          Rebuild
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stage distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.stages.map((s) => (
            <div key={s.stage} className="space-y-1">
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="font-medium">{s.label}</span>
                <span className="tabular-nums text-muted-foreground">{s.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${s.stage === "churned" ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${(s.count / max) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {STAGE_DESCRIPTION[s.stage as LifecycleStage]}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent transitions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.recentTransitions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stage changes recorded yet.</p>
          ) : (
            data.recentTransitions.map((t, i) => (
              <div key={`${t.userId}-${i}`} className="flex items-center justify-between gap-4 text-sm">
                <span className="font-mono text-xs text-muted-foreground">{t.userId.slice(0, 8)}</span>
                <span>
                  {t.from ?? "new"} <span className="text-muted-foreground">→</span>{" "}
                  <span className="font-medium">{t.to}</span>
                </span>
                <span className="text-xs text-muted-foreground">{relative(t.occurredAt)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
