import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardCard } from "@/components/blueprint/dashboard-card";
import { RecommendationCard } from "@/components/blueprint/recommendation-card";
import { ProgressBar } from "@/components/blueprint/progress-bar";
import { Button } from "@/components/ui/button";
import { fetchLatestBlueprint } from "@/lib/assessments";
import { PLACEHOLDER_BLUEPRINT, PLACEHOLDER_RECOMMENDATIONS } from "@/lib/placeholder-blueprint";

export const Route = createFileRoute("/_authenticated/blueprint")({
  head: () => ({
    meta: [
      { title: "My Blueprint — Owned Audience Blueprint" },
      { name: "description", content: "Your full owned-audience strategy blueprint and prioritized recommendations." },
      { property: "og:title", content: "My Blueprint — Owned Audience Blueprint" },
      { property: "og:description", content: "Your full owned-audience strategy blueprint." },
    ],
  }),
  component: BlueprintPage,
});

function BlueprintPage() {
  const { data } = useQuery({ queryKey: ["blueprint", "latest"], queryFn: fetchLatestBlueprint });
  const organization = data?.assessments?.organizations?.name;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="My blueprint"
        title={organization ? `${organization} · Owned Audience Blueprint` : "Owned Audience Blueprint"}
        description="The full strategic reading of your assessment: maturity, thesis, and the prioritized moves behind your roadmap."
        actions={
          <Button variant="outline" onClick={() => toast.info("PDF export arrives in the next release.")}>
            <Download className="size-4" /> Export PDF
          </Button>
        }
      />

      <DashboardCard eyebrow="Strategic thesis" title="Where the leverage is" accent>
        <p className="text-sm leading-relaxed text-foreground">{PLACEHOLDER_BLUEPRINT.topOpportunity}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{PLACEHOLDER_BLUEPRINT.recommendedPriority}</p>
      </DashboardCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardCard eyebrow="Dimension scores" title="Maturity by dimension">
          <div className="space-y-4">
            {PLACEHOLDER_BLUEPRINT.sectionScores.map((item) => (
              <ProgressBar key={item.label} label={item.label} value={item.score} />
            ))}
          </div>
        </DashboardCard>
        <DashboardCard eyebrow="Primary risk" title="What could derail this">
          <p className="text-sm leading-relaxed text-foreground">{PLACEHOLDER_BLUEPRINT.topRisk}</p>
        </DashboardCard>
      </div>

      <section className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-eyebrow">Recommendations</p>
            <h2 className="text-display mt-1 text-2xl">Prioritized moves</h2>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/roadmap">View roadmap</Link>
          </Button>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {PLACEHOLDER_RECOMMENDATIONS.map((item) => (
            <RecommendationCard key={item.title} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
