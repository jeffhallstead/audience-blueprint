import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ExportableSection } from "@/components/blueprint/exportable-section";
import { ResourceCard } from "@/components/blueprint/resource-card";
import { BlueprintEmptyState } from "@/components/blueprint/blueprint-empty-state";
import { UpgradeCta } from "@/components/blueprint/upgrade-cta";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlueprint } from "@/lib/blueprint/use-blueprint";
import { trackBlueprintEvent } from "@/lib/blueprint/analytics";

export const Route = createFileRoute("/_authenticated/resources")({
  head: () => ({
    meta: [
      { title: "Recommended Resources — Publisher Blueprint™" },
      {
        name: "description",
        content:
          "Frameworks, templates, and playbooks matched to your Publisher Index™ gaps and 90-day roadmap priorities.",
      },
      { property: "og:title", content: "Recommended Resources — Publisher Blueprint™" },
      { property: "og:description", content: "Frameworks and playbooks matched to your assessment gaps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResourcesPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="surface-panel p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
});

function ResourcesPage() {
  const { data: blueprint, isLoading } = useBlueprint();

  useEffect(() => {
    if (blueprint) void trackBlueprintEvent("resources_viewed", { count: blueprint.resources.length });
  }, [blueprint]);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Resources"
          title="Matched to your gaps"
          description="Resource recommendations are selected from your assessment results."
        />
        <BlueprintEmptyState
          title="Resources are matched to your assessment"
          description="Complete the Publisher Index™ and this library narrows to the frameworks, templates, and playbooks that address your specific gaps."
        />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Resources"
        title="Matched to your priorities"
        description="Selected against your lowest-scoring capabilities and the phases of your 90-day roadmap."
      />

      <ExportableSection id="recommended-resources" eyebrow="Recommended" title="Start here">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blueprint.resources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onOpen={(id) => {
                void trackBlueprintEvent("resource_clicked", { resource: id });
                toast.info("This resource unlocks in the next release.");
              }}
            />
          ))}
        </div>
      </ExportableSection>

      <UpgradeCta
        cta={blueprint.cta}
        onClick={() => {
          void trackBlueprintEvent("upgrade_cta_clicked", { tier: blueprint.tier, surface: "resources" });
          toast.info("Booking opens in the next phase — your blueprint is saved.");
        }}
      />
    </div>
  );
}
