import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ExportableSection } from "@/components/blueprint/exportable-section";
import { RoadmapPhaseCard } from "@/components/blueprint/roadmap-phase-card";
import { ActionList } from "@/components/blueprint/action-list";
import { BlueprintEmptyState } from "@/components/blueprint/blueprint-empty-state";
import { SavedActions } from "@/components/blueprint/saved-actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlueprint } from "@/lib/blueprint/use-blueprint";
import { useEntitlement } from "@/lib/commerce/use-entitlement";
import { LockedFeature } from "@/components/billing/feature-gate";
import { trackBlueprintEvent } from "@/lib/blueprint/analytics";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({
    meta: [
      { title: "90-Day Roadmap — Publisher Blueprint™" },
      {
        name: "description",
        content:
          "A three-phase, 90-day implementation plan generated from your Publisher Index™ score, with objectives, activities, and success metrics.",
      },
      { property: "og:title", content: "90-Day Roadmap — Publisher Blueprint™" },
      { property: "og:description", content: "Three sequenced phases with objectives, activities, and success metrics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoadmapPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="surface-panel p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
});

function RoadmapPage() {
  const { data: blueprint, isLoading } = useBlueprint();
  const { can, isLoading: entitlementLoading } = useEntitlement();

  useEffect(() => {
    if (blueprint) void trackBlueprintEvent("roadmap_viewed", { tier: blueprint.tier });
  }, [blueprint]);

  if (isLoading) {
    return (
      <div className="space-y-8" aria-busy="true" aria-live="polite">
        <Skeleton className="h-24 w-full rounded-xl" />
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Roadmap"
          title="Your next 90 days"
          description="The roadmap is generated from your assessment results."
        />
        <BlueprintEmptyState
          title="Your 90-day roadmap is generated from your results"
          description="Complete the Publisher Index™ assessment and a three-phase implementation plan — calibrated to your maturity level — will be waiting here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="90-day roadmap"
        title="Your implementation plan"
        description={`Three sequenced phases calibrated to a ${blueprint.maturity.title} operating level. Each phase carries an objective, the activities that deliver it, and the metrics that prove it worked.`}
        actions={
          <>
            <ExportMenu blueprint={blueprint} defaultScopes={["roadmap", "saved"]} />

            <Button asChild>
              <Link to="/resources">
                Supporting resources <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </>
        }
      />

      {!entitlementLoading && !can("roadmap") ? (
        <LockedFeature
          feature="roadmap"
          title="Unlock your 90-day implementation plan"
          description="The full roadmap sequences three phases of objectives, activities, owners, and success metrics — calibrated to your Publisher Index™ result."
        />
      ) : null}

      {can("roadmap") ? (
      <>
      <ExportableSection id="roadmap-phases" eyebrow="Phases" title="Month by month">
        <div className="space-y-5">
          {blueprint.roadmap.map((phase) => (
            <RoadmapPhaseCard key={phase.id} phase={phase} />
          ))}
        </div>
      </ExportableSection>

      <ExportableSection
        id="quick-wins"
        eyebrow="Before day one"
        title="Quick wins to start this week"
        description="Low-effort actions that build momentum ahead of month one."
      >
        <ActionList items={blueprint.quickWins} />
      </ExportableSection>

      <ExportableSection
        id="long-term"
        eyebrow="Beyond 90 days"
        title="Long-term initiatives"
        description="The structural investments that follow once the first quarter lands."
      >
        <ActionList items={blueprint.longTerm} variant="long" />
      </ExportableSection>

      <ExportableSection
        id="copilot-actions"
        eyebrow="From Publisher Copilot™"
        title="Added from your strategy documents"
        description="Actions you pushed into the Blueprint, tracked alongside the generated plan."
      >
        <SavedActions compact />
      </ExportableSection>
      </>
      ) : null}
    </div>
  );
}
