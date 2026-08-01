import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardCard } from "@/components/blueprint/dashboard-card";
import { ExportableSection } from "@/components/blueprint/exportable-section";
import { ScoreRing } from "@/components/blueprint/score-ring";
import { CategoryCard } from "@/components/blueprint/category-card";
import { IndexRadar } from "@/components/assessment/index-radar";
import { BlueprintEmptyState } from "@/components/blueprint/blueprint-empty-state";
import { SavedActions } from "@/components/blueprint/saved-actions";
import { LockedFeature } from "@/components/billing/feature-gate";
import { useEntitlement } from "@/lib/commerce/use-entitlement";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MATURITY_LEVELS } from "@/lib/assessment/config";
import { useBlueprint, formatAssessmentDate } from "@/lib/blueprint/use-blueprint";
import { trackBlueprintEvent } from "@/lib/blueprint/analytics";

export const Route = createFileRoute("/_authenticated/blueprint")({
  head: () => ({
    meta: [
      { title: "Publisher Index™ Detail — Publisher Blueprint" },
      {
        name: "description",
        content: "The full Publisher Index™ reading: overall score, six category diagnostics, and what each level means.",
      },
      { property: "og:title", content: "Publisher Index™ Detail" },
      { property: "og:description", content: "Overall score, category diagnostics, and maturity interpretation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndexDetail,
  errorComponent: ({ error }) => (
    <div role="alert" className="surface-panel p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
});

function IndexDetail() {
  const { data: blueprint, isLoading } = useBlueprint();
  const { can, isLoading: entitlementLoading } = useEntitlement();


  useEffect(() => {
    if (blueprint) void trackBlueprintEvent("publisher_index_viewed", { overall: blueprint.overall });
  }, [blueprint]);

  if (isLoading) {
    return (
      <div className="space-y-8" aria-busy="true" aria-live="polite">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="space-y-8">
        <PageHeader eyebrow="Publisher Index™" title="Index detail" description="Complete the assessment to see your index." />
        <BlueprintEmptyState />
      </div>
    );
  }

  const { maturity } = blueprint;

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Publisher Index™"
        title={blueprint.organizationName ? `${blueprint.organizationName} · Index detail` : "Index detail"}
        description="The complete diagnostic behind your score: how each capability was read and what your maturity level implies."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.info("PDF export arrives in a later phase.")}>
              <Download className="size-4" aria-hidden /> Export
            </Button>
            <Button asChild>
              <Link to="/roadmap">
                View roadmap <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </>
        }
      />

      <section
        aria-labelledby="index-overview-heading"
        data-export-section="index-overview"
        className="surface-panel grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_1.1fr]"
      >
        <div className="space-y-6">
          <h2 id="index-overview-heading" className="sr-only">
            Publisher Index overview
          </h2>
          <ScoreRing score={blueprint.overall} />
          <div className="space-y-2">
            <p className="inline-flex rounded-full border border-brass/50 bg-brass/10 px-3 py-1 text-sm font-medium text-brass">
              Level {maturity.level} · {maturity.title}
            </p>
            <p className="text-sm leading-relaxed text-foreground">{maturity.summary}</p>
            <p className="text-xs text-muted-foreground">Assessed {formatAssessmentDate(blueprint.completedAt)}</p>
          </div>
          <ol className="grid grid-cols-5 gap-1 text-center" aria-label="Maturity ladder">
            {MATURITY_LEVELS.map((level) => (
              <li key={level.level} className="space-y-2">
                <div className={`h-1 rounded-full ${level.level <= maturity.level ? "bg-brass" : "bg-muted"}`} aria-hidden />
                <span
                  className={`block text-[10px] leading-tight ${
                    level.level === maturity.level ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {level.title}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-4">
          <p className="text-eyebrow">Category breakdown</p>
          <IndexRadar data={blueprint.categories.map((item) => ({ label: item.label, score: item.score }))} />
        </div>
      </section>

      <ExportableSection
        id="category-diagnostics"
        eyebrow="Diagnostics"
        title="How each capability reads"
        description="Six categories, each banded against the Publisher Index™ thresholds."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blueprint.categories.map((reading) => (
            <CategoryCard key={reading.id} reading={reading} />
          ))}
        </div>
        <Accordion type="single" collapsible className="surface-panel px-5">
          {blueprint.categories.map((reading) => (
            <AccordionItem key={reading.id} value={reading.id} className="border-border">
              <AccordionTrigger
                className="text-sm"
                onClick={() => void trackBlueprintEvent("section_expanded", { category: reading.id }, "category-detail")}
              >
                {reading.label} · what this category measures
              </AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <p>{reading.meaning}</p>
                <p>{reading.description}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ExportableSection>

      <ExportableSection id="level-meaning" eyebrow={`Level ${maturity.level}`} title={`What a ${maturity.title} looks like`}>
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <DashboardCard eyebrow="Characteristics">
            <ul className="space-y-2">
              {maturity.characteristics.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-brass" />
                  {item}
                </li>
              ))}
            </ul>
          </DashboardCard>
          <div className="grid gap-5">
            <DashboardCard eyebrow="Strategic focus" accent>
              <p className="text-sm leading-relaxed text-foreground">{maturity.strategicFocus}</p>
            </DashboardCard>
            <DashboardCard eyebrow="Next step">
              <p className="text-sm leading-relaxed text-foreground">{maturity.nextStep}</p>
            </DashboardCard>
          </div>
        </div>
      </ExportableSection>

      <ExportableSection
        id="saved-actions"
        eyebrow="From Publisher Copilot™"
        title="Saved to your Blueprint"
        description="Actions you added from your strategy deliverables. Mark them done as you ship them."
      >
        <SavedActions />
      </ExportableSection>

      {!entitlementLoading && !can("roadmap") ? (
        <LockedFeature
          feature="roadmap"
          title="Turn this diagnostic into a strategic plan"
          description="Unlock the full executive dashboard, opportunity matrix, 90-day roadmap, AI strategy documents like The Branded Entertainment Brief, and PDF export — plus one month of Publisher OS™."
        />
      ) : null}
    </div>
  );
}

