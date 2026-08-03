import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  getQualificationBreakdown,
  rebuildQualifications,
} from "@/lib/qualification/qualification.functions";
import { TIER_DESCRIPTION, type QualificationTier } from "@/lib/qualification/tiers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/** Fit vs. engagement qualification view for the internal console. */
export function QualificationPanel() {
  const fetchBreakdown = useServerFn(getQualificationBreakdown);
  const rebuild = useServerFn(rebuildQualifications);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "qualification"],
    queryFn: () => fetchBreakdown(),
    retry: false,
  });

  const rebuildMutation = useMutation({
    mutationFn: () => rebuild(),
    onSuccess: (result) => {
      toast.success(`Rescored ${result.processed} accounts (${result.changed} changed tier)`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "qualification"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading || !data) return <Skeleton className="h-64" />;

  const max = Math.max(1, ...data.tiers.map((t) => t.count));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {data.tracked} scored {data.tracked === 1 ? "account" : "accounts"} · avg fit{" "}
          {data.averageFit} · avg engagement {data.averageEngagement}. Tiers are derived from profile
          fit and the platform event stream — never set by hand.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => rebuildMutation.mutate()}
          disabled={rebuildMutation.isPending}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${rebuildMutation.isPending ? "animate-spin" : ""}`} />
          Rescore
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tier distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.tiers.map((t) => (
            <div key={t.tier} className="space-y-1">
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="font-medium">{t.label}</span>
                <span className="tabular-nums text-muted-foreground">{t.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(t.count / max) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {TIER_DESCRIPTION[t.tier as QualificationTier]}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Highest scoring accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.topAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts scored yet.</p>
          ) : (
            data.topAccounts.map((account) => (
              <div key={account.userId} className="space-y-1 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">
                    {account.userId.slice(0, 8)}
                  </span>
                  <span className="font-medium">{account.tierLabel}</span>
                  <span className="tabular-nums text-muted-foreground">
                    fit {account.fitScore} · engagement {account.engagementScore} · total{" "}
                    {account.totalScore}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {account.reason} · scored {when(account.scoredAt)}
                </p>
                {account.signals.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {account.signals.map((s) => `${s.label} (+${s.points})`).join(" · ")}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent tier changes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.recentTransitions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tier changes recorded yet.</p>
          ) : (
            data.recentTransitions.map((t, i) => (
              <div
                key={`${t.userId}-${i}`}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {t.userId.slice(0, 8)}
                </span>
                <span>
                  {t.from ?? "new"} <span className="text-muted-foreground">→</span>{" "}
                  <span className="font-medium">{t.to}</span>
                  {t.totalScore !== null ? (
                    <span className="text-muted-foreground"> ({t.totalScore})</span>
                  ) : null}
                </span>
                <span className="text-xs text-muted-foreground">{when(t.occurredAt)}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
