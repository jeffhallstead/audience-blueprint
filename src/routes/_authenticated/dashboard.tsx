import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardCard } from "@/components/blueprint/dashboard-card";
import { ScoreCard } from "@/components/blueprint/score-card";
import { MetricTile } from "@/components/blueprint/metric-tile";
import { ProgressBar } from "@/components/blueprint/progress-bar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchLatestBlueprint } from "@/lib/assessments";
import { PLACEHOLDER_BLUEPRINT, PUBLISHER_LEVELS } from "@/lib/placeholder-blueprint";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Executive Dashboard — Publisher Blueprint" },
      { name: "description", content: "Your owned-audience readiness score, opportunities, risks, and priorities." },
      { property: "og:title", content: "Executive Dashboard — Publisher Blueprint" },
      { property: "og:description", content: "Your owned-audience readiness score and strategic priorities." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["blueprint", "latest"], queryFn: fetchLatestBlueprint });

  const blueprint = {
    ...PLACEHOLDER_BLUEPRINT,
    publisherLevel: data?.publisher_level ?? PLACEHOLDER_BLUEPRINT.publisherLevel,
    overallScore: data?.overall_score ?? PLACEHOLDER_BLUEPRINT.overallScore,
    topOpportunity: data?.top_opportunity ?? PLACEHOLDER_BLUEPRINT.topOpportunity,
    topRisk: data?.top_risk ?? PLACEHOLDER_BLUEPRINT.topRisk,
    recommendedPriority: data?.recommended_priority ?? PLACEHOLDER_BLUEPRINT.recommendedPriority,
    next90Days: data?.next_90_days ?? PLACEHOLDER_BLUEPRINT.next90Days,
  };

  const levelIndex = Math.max(0, PUBLISHER_LEVELS.indexOf(blueprint.publisherLevel));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Executive dashboard"
        title="Owned audience readiness"
        description="A consolidated view of your maturity, the single biggest opportunity, and what to sequence next."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.info("PDF export arrives in the next release.")}>
              <Download className="size-4" /> Export PDF
            </Button>
            <Button asChild>
              <Link to="/wizard">Retake assessment</Link>
            </Button>
          </>
        }
      />

      {isLoading ? (
        <Skeleton className="h-56 w-full rounded-xl" />
      ) : (
        <>
          {!scores ? (
            <div className="surface-panel flex flex-wrap items-center justify-between gap-4 border-primary/40 p-5">
              <p className="text-sm text-muted-foreground">
                You're viewing sample data. Complete the Publisher Index™ assessment to generate your own scores.
              </p>
              <Button asChild size="sm">
                <Link to="/wizard">
                  Start assessment <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="surface-panel flex flex-wrap items-center justify-between gap-4 p-5">
              <p className="text-sm text-muted-foreground">
                Your latest Publisher Index™ assessment is complete.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/results">
                  View full results <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          )}

          <ScoreCard
            score={overallScore}
            level={levelTitle}
            levels={MATURITY_LEVELS.map((level) => level.title)}
            levelIndex={levelIndex}
          />
        </>
      )}


      <div className="grid gap-5 lg:grid-cols-3">
        <DashboardCard eyebrow="Top opportunity" accent>
          <p className="text-sm leading-relaxed text-foreground">{blueprint.topOpportunity}</p>
        </DashboardCard>
        <DashboardCard eyebrow="Top risk">
          <p className="text-sm leading-relaxed text-foreground">{blueprint.topRisk}</p>
        </DashboardCard>
        <DashboardCard eyebrow="Recommended priority">
          <p className="text-sm leading-relaxed text-foreground">{blueprint.recommendedPriority}</p>
        </DashboardCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <DashboardCard
          eyebrow="Publisher Index™ categories"
          title="Where you stand"
          footer={scores ? undefined : "Sample data — complete the assessment for your own scores."}
        >
          <div className="space-y-4">
            {categoryScores.map((item) => (
              <ProgressBar key={item.id} label={item.label} value={item.score} />
            ))}
          </div>
        </DashboardCard>


        <DashboardCard eyebrow="Next 90 days" title="Immediate mandate" footer="Full sequencing lives in Roadmap.">
          <p className="text-sm leading-relaxed text-foreground">{blueprint.next90Days}</p>
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link to="/roadmap">
              Open roadmap <ArrowRight className="size-4" />
            </Link>
          </Button>
        </DashboardCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Publisher level" value={levelTitle} hint="Five-stage maturity model" />
        <MetricTile label="Publisher Index™" value={`${overallScore}/100`} hint={scores ? "Your score" : "Sample score"} />
        <MetricTile label="Assessment status" value={scores ? "Completed" : "Not started"} hint="Latest run" />
        <MetricTile label="Roadmap horizon" value="90 days" hint="Three sequenced months" />
      </div>

    </div>
  );
}
