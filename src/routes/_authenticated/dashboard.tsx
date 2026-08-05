import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download, Loader2, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardCard } from "@/components/blueprint/dashboard-card";
import { ExportableSection } from "@/components/blueprint/exportable-section";
import { ScoreRing } from "@/components/blueprint/score-ring";
import { CategoryCard } from "@/components/blueprint/category-card";
import { OpportunityMatrix } from "@/components/blueprint/opportunity-matrix";
import { StrengthList, GapList } from "@/components/blueprint/insight-lists";
import { ActionList } from "@/components/blueprint/action-list";
import { KpiGrid } from "@/components/blueprint/kpi-grid";
import { UpgradeCta } from "@/components/blueprint/upgrade-cta";
import { BlueprintEmptyState } from "@/components/blueprint/blueprint-empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MATURITY_LEVELS } from "@/lib/assessment/config";
import { useBlueprint, formatAssessmentDate } from "@/lib/blueprint/use-blueprint";
import { LockedFeature } from "@/components/billing/feature-gate";
import { trackBlueprintEvent } from "@/lib/blueprint/analytics";
import { useSavedRecommendations } from "@/lib/copilot/queries";
import { exportFilename } from "@/lib/export/rows";
import { buildBlueprintPdf } from "@/lib/export/pdf";
import { sendReportPdf } from "@/lib/email/report.functions";
import { useServerFn } from "@tanstack/react-start";
import { trackRecommendationExport } from "@/lib/analytics/recommendation-metadata";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Publisher Blueprint™ Dashboard — Executive Overview" },
      {
        name: "description",
        content:
          "Your personalized Publisher Blueprint™: maturity level, Publisher Index™ score, category analysis, priority opportunities, and a 90-day roadmap.",
      },
      { property: "og:title", content: "Publisher Blueprint™ Dashboard" },
      { property: "og:description", content: "Maturity, priorities, and a 90-day plan derived from your assessment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
  errorComponent: ({ error }) => (
    <div role="alert" className="surface-panel p-6 text-sm text-destructive">
      {error.message}
    </div>
  ),
});

function Dashboard() {
  const { data: blueprint, isLoading, locked } = useBlueprint();
  const { data: saved } = useSavedRecommendations();
  const [exporting, setExporting] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const sendReport = useServerFn(sendReportPdf);

  async function generatePdfBlob(): Promise<Blob> {
    if (!blueprint) throw new Error("No blueprint available");
    const blob = await buildBlueprintPdf(blueprint, {
      saved: locked ? null : (saved ?? null),
      locked,
    });
    return blob;
  }

  async function handleDownloadPdf() {
    if (!blueprint) return;
    setExporting(true);
    try {
      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${exportFilename(blueprint)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded.");
      // Logged through the same export analytics path as CSV/Excel. The free
      // report has no opportunities, so it records the report itself.
      void trackRecommendationExport(
        locked
          ? ["Publisher Index summary"]
          : blueprint.opportunities.map((item) => item.title),
        "pdf",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate the PDF.");
    } finally {
      setExporting(false);
    }
  }

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Could not read PDF as base64."));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

  async function handleEmailPdf() {
    if (!blueprint) return;
    setEmailing(true);
    try {
      const blob = await generatePdfBlob();
      const base64 = await blobToBase64(blob);
      const result = await sendReport({ data: { pdfBase64: base64, filename: exportFilename(blueprint) } });
      if (!result.sent) {
        toast.warning(result.reason === "recipient_suppressed" ? "This email is currently suppressed." : "Could not send the email.");
      } else {
        toast.success("Report emailed to your account.");
      }
      void trackRecommendationExport(
        locked
          ? ["Publisher Index summary"]
          : blueprint.opportunities.map((item) => item.title),
        "email-pdf",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not email the PDF.");
    } finally {
      setEmailing(false);
    }
  }

  useEffect(() => {
    if (blueprint) void trackBlueprintEvent("dashboard_viewed", { overall: blueprint.overall });
  }, [blueprint]);

  if (isLoading) {
    return (
      <div className="space-y-8" aria-busy="true" aria-live="polite">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Publisher Blueprint™"
          title="Executive dashboard"
          description="Your personalized strategic assessment appears here once the Publisher Index™ is complete."
        />
        <BlueprintEmptyState />
      </div>
    );
  }

  const { summary, maturity } = blueprint;

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section
        aria-labelledby="blueprint-hero-heading"
        data-export-section="hero"
        className="surface-panel grid gap-8 border-brass/30 p-6 sm:p-10 lg:grid-cols-[auto_minmax(0,1fr)]"
      >
        <div className="flex flex-col items-center gap-3">
          <ScoreRing score={blueprint.overall} />
          <span className="inline-flex rounded-full border border-brass/50 bg-brass/10 px-3 py-1 text-xs font-medium text-brass">
            Level {maturity.level} · {maturity.title}
          </span>
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-eyebrow">
              {blueprint.organizationName ? `${blueprint.organizationName} · ` : ""}Publisher Blueprint™
            </p>
            <h1 id="blueprint-hero-heading" className="text-display text-3xl sm:text-4xl">
              You are operating as a {maturity.title}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{maturity.summary}</p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-eyebrow">Publisher Index™</dt>
              <dd className="mt-1 text-sm font-semibold tabular-nums text-foreground">{blueprint.overall}/100</dd>
            </div>
            <div>
              <dt className="text-eyebrow">Assessment date</dt>
              <dd className="mt-1 text-sm text-foreground">{formatAssessmentDate(blueprint.completedAt)}</dd>
            </div>
            <div>
              <dt className="text-eyebrow">Progress</dt>
              <dd className="mt-1 text-sm text-foreground">
                Stage {maturity.level} of {MATURITY_LEVELS.length}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/roadmap">
                Continue building your blueprint <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void trackBlueprintEvent("assessment_revisited");
                toast.info("Retake the assessment any time — your history is preserved.");
              }}
              asChild
            >
              <Link to="/wizard">
                <RefreshCw className="size-4" aria-hidden /> Retake assessment
              </Link>
            </Button>
            <Button variant="ghost" onClick={() => void handleDownloadPdf()} disabled={exporting}>
              {exporting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Download className="size-4" aria-hidden />
              )}
              {exporting ? "Preparing PDF…" : "Download PDF"}
            </Button>
            <Button variant="ghost" onClick={() => void handleEmailPdf()} disabled={emailing}>
              {emailing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Mail className="size-4" aria-hidden />
              )}
              {emailing ? "Sending…" : "Email my report"}
            </Button>
          </div>
        </div>
      </section>

      {/* Executive summary */}
      {locked ? (
        <LockedFeature
          feature="full_dashboard"
          title="Unlock your executive summary"
          description="Your Publisher Index™ score and category readings are always free. The strategic interpretation — position, biggest opportunity, primary risk, opportunity matrix, quick wins, 90-day roadmap and KPIs — comes with Publisher Blueprint™."
        />
      ) : (
      <ExportableSection
        id="executive-summary"
        eyebrow="Executive summary"
        title="Where your organization stands"
        description="A rule-based reading of your assessment: current position, the single biggest opportunity, the primary risk, and the focus that follows from both."
      >
        <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <DashboardCard eyebrow="Current position">
            <p className="text-sm leading-relaxed text-foreground">{summary.position}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{maturity.strategicFocus}</p>
          </DashboardCard>
          <div className="grid gap-5">
            <DashboardCard eyebrow="Biggest opportunity" accent>
              <p className="text-sm leading-relaxed text-foreground">{summary.biggestOpportunity}</p>
            </DashboardCard>
            <DashboardCard eyebrow="Biggest risk">
              <p className="text-sm leading-relaxed text-foreground">{summary.biggestRisk}</p>
            </DashboardCard>
          </div>
        </div>
        <DashboardCard eyebrow="Recommended focus">
          <p className="text-sm leading-relaxed text-foreground">{summary.recommendedFocus}</p>
        </DashboardCard>
      </ExportableSection>
      )}

      {/* Publisher Index */}
      <ExportableSection
        id="publisher-index"
        eyebrow="Publisher Index™"
        title="Your score and what it means"
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to="/blueprint">
              Full index detail <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        }
      >
        <div className="surface-panel grid gap-8 p-6 sm:p-8 lg:grid-cols-[auto_minmax(0,1fr)]">
          <ScoreRing score={blueprint.overall} size={140} />
          <div className="space-y-4">
            <ol className="grid grid-cols-5 gap-1 text-center" aria-label="Maturity ladder">
              {MATURITY_LEVELS.map((level) => (
                <li key={level.level} className="space-y-2">
                  <div
                    className={`h-1 rounded-full ${level.level <= maturity.level ? "bg-brass" : "bg-muted"}`}
                    aria-hidden
                  />
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
            <Accordion type="single" collapsible>
              <AccordionItem value="meaning" className="border-border">
                <AccordionTrigger
                  className="text-sm"
                  onClick={() => void trackBlueprintEvent("section_expanded", {}, "what-this-means")}
                >
                  What this means
                </AccordionTrigger>
                <AccordionContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <p>{maturity.summary}</p>
                  <ul className="space-y-1.5">
                    {maturity.characteristics.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-brass" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="text-foreground">{maturity.nextStep}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <p className="text-xs text-muted-foreground">
              Confidence · based on a completed {blueprint.categories.length}-category assessment. Benchmarks arrive in a
              later phase.
            </p>
          </div>
        </div>
      </ExportableSection>

      {/* Category dashboard */}
      <ExportableSection
        id="category-analysis"
        eyebrow="Category analysis"
        title="Six capabilities, scored"
        description="Each category is scored 0–100 and banded. Priority numbers indicate the order in which gaps should be addressed."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {blueprint.categories.map((reading) => (
            <CategoryCard key={reading.id} reading={reading} />
          ))}
        </div>
      </ExportableSection>

      {!locked ? (
        <>
      {/* Opportunity matrix */}
      <ExportableSection
        id="opportunity-matrix"
        eyebrow="Opportunity matrix"
        title="The three highest-leverage moves"
        description="Ranked by business impact against effort, derived from your lowest-scoring capabilities."
      >
        <OpportunityMatrix items={blueprint.opportunities} />
      </ExportableSection>

      {/* Strengths */}
      <ExportableSection
        id="strengths"
        eyebrow="Strengths"
        title="What is already working"
        description="The capabilities to protect and build on."
      >
        <StrengthList items={blueprint.strengths} />
      </ExportableSection>

      {/* Gaps */}
      <ExportableSection
        id="growth-opportunities"
        eyebrow="Growth opportunities"
        title="Where the gap is widest"
        description="Each gap includes why it matters now and the benefit of closing it."
      >
        <GapList items={blueprint.gaps} />
      </ExportableSection>

      {/* Quick wins */}
      <ExportableSection
        id="quick-wins"
        eyebrow="Quick wins"
        title="Three actions inside a week"
        description="Low-effort moves that create momentum before the roadmap begins."
      >
        <ActionList items={blueprint.quickWins} />
      </ExportableSection>

      {/* Roadmap preview */}
      <ExportableSection
        id="roadmap-preview"
        eyebrow="90-day roadmap"
        title="Your implementation plan"
        description={`Three sequenced phases calibrated to a ${maturity.title} operating level.`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/roadmap">
              Open the roadmap <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        }
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {blueprint.roadmap.map((phase) => (
            <div key={phase.id} className="surface-panel space-y-2 p-5">
              <p className="text-eyebrow">
                Month {phase.month} · {phase.phase}
              </p>
              <p className="text-sm leading-relaxed text-foreground">{phase.objective}</p>
              <p className="text-xs text-muted-foreground">{phase.activities.length} key activities</p>
            </div>
          ))}
        </div>
      </ExportableSection>

      {/* KPIs */}
      <ExportableSection
        id="kpis"
        eyebrow="Measurement"
        title="Recommended KPIs"
        description="The metrics that matter at your maturity level. Targets are directional until live integrations land."
      >
        <KpiGrid kpis={blueprint.kpis} />
      </ExportableSection>

      <UpgradeCta
        cta={blueprint.cta}
        onClick={() => {
          void trackBlueprintEvent("upgrade_cta_clicked", { tier: blueprint.tier });
          toast.info("Booking opens in the next phase — your blueprint is saved.");
        }}
      />
        </>
      ) : null}
    </div>
  );
}
