import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyLifecycle } from "@/lib/lifecycle/lifecycle.functions";
import { LIFECYCLE_STAGES, STAGE_DESCRIPTION, STAGE_RANK } from "@/lib/lifecycle/stages";
import { DashboardCard } from "@/components/blueprint/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";

const LADDER = LIFECYCLE_STAGES.filter((s) => s !== "visitor" && s !== "churned");

/** Shows the customer where they are in the Publisher Blueprint journey. */
export function LifecycleStatus() {
  const fetchLifecycle = useServerFn(getMyLifecycle);
  const { data, isLoading } = useQuery({
    queryKey: ["lifecycle", "me"],
    queryFn: () => fetchLifecycle(),
    retry: false,
  });

  if (isLoading) return <Skeleton className="h-40" />;
  if (!data) return null;

  const currentRank = STAGE_RANK[data.stage];

  return (
    <DashboardCard eyebrow="Journey" title={data.stageLabel}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {data.reason ?? STAGE_DESCRIPTION[data.stage]}
        </p>
        <ol className="space-y-2">
          {LADDER.map((stage) => {
            const reached = STAGE_RANK[stage] <= currentRank;
            const isCurrent = stage === data.stage;
            return (
              <li key={stage} className="flex items-center gap-3 text-sm">
                <span
                  aria-hidden
                  className={`h-2 w-2 shrink-0 rounded-full ${reached ? "bg-primary" : "bg-muted"}`}
                />
                <span className={isCurrent ? "font-medium" : "text-muted-foreground"}>
                  {STAGE_DESCRIPTION[stage]}
                </span>
              </li>
            );
          })}
        </ol>
        {data.stage === "churned" ? (
          <p className="text-sm text-muted-foreground">
            Your paid access has ended — you can restart any time from Plans &amp; Billing.
          </p>
        ) : null}
      </div>
    </DashboardCard>
  );
}
