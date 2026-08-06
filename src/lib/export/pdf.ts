/**
 * Publisher Blueprint — PDF report generation (browser-side).
 *
 * A typographic document built from the same Blueprint object the dashboard
 * renders, not a screenshot: text stays selectable and the layout is print-safe
 * (dark ink on white paper) rather than mirroring the Executive Obsidian UI.
 */

import type { Blueprint } from "@/lib/blueprint/engine";
import type { SavedRecommendationRow } from "@/lib/copilot/queries";

// Print-safe translations of the Executive Obsidian tokens.
const INK: RGB = [24, 24, 27];
const MUTED: RGB = [113, 113, 122];
const ACCENT: RGB = [99, 84, 241];
const RULE: RGB = [212, 212, 216];

type RGB = [number, number, number];

const PAGE = { width: 595.28, height: 841.89 }; // A4 portrait, points
const MARGIN = { top: 64, bottom: 64, left: 56, right: 56 };
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;

type Doc = import("jspdf").jsPDF;

/** Cursor-based writer: every helper advances `y` and breaks pages on its own. */
class Layout {
  y = MARGIN.top;

  constructor(private readonly doc: Doc) {}

  private space(height: number) {
    if (this.y + height > PAGE.height - MARGIN.bottom) this.pageBreak();
  }

  pageBreak() {
    this.doc.addPage();
    this.y = MARGIN.top;
  }

  gap(height: number) {
    this.y += height;
  }

  /** Section heading with an accent rule under it. */
  heading(text: string) {
    this.space(46);
    this.doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...INK);
    this.doc.text(text.toUpperCase(), MARGIN.left, this.y);
    this.y += 7;
    this.doc.setDrawColor(...ACCENT).setLineWidth(1.2);
    this.doc.line(MARGIN.left, this.y, MARGIN.left + 46, this.y);
    this.y += 16;
  }

  subheading(text: string) {
    this.space(28);
    this.doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(...INK);
    this.doc.text(text, MARGIN.left, this.y);
    this.y += 14;
  }

  /** Wrapped body copy. Splits across pages line by line so nothing is clipped. */
  paragraph(
    text: string,
    options: { size?: number; color?: RGB; indent?: number; style?: "normal" | "italic" | "bold" } = {},
  ) {
    const { size = 10, color = INK, indent = 0, style = "normal" } = options;
    const lineHeight = size * 1.45;
    this.doc.setFont("helvetica", style).setFontSize(size).setTextColor(...color);
    const lines = this.doc.splitTextToSize(text, CONTENT_WIDTH - indent) as string[];
    for (const line of lines) {
      this.space(lineHeight);
      // Font state resets on a new page, so re-apply before each line.
      this.doc.setFont("helvetica", style).setFontSize(size).setTextColor(...color);
      this.doc.text(line, MARGIN.left + indent, this.y);
      this.y += lineHeight;
    }
  }

  bullet(text: string, options: { size?: number; color?: RGB } = {}) {
    const { size = 10, color = INK } = options;
    this.space(size * 1.45);
    this.doc.setFont("helvetica", "normal").setFontSize(size).setTextColor(...ACCENT);
    this.doc.text("•", MARGIN.left, this.y);
    this.paragraph(text, { size, color, indent: 14 });
  }

  /** Label/value pair used for scores and KPI targets. */
  row(label: string, value: string, options: { emphasis?: boolean } = {}) {
    const lineHeight = 15;
    this.space(lineHeight);
    this.doc.setFont("helvetica", options.emphasis ? "bold" : "normal").setFontSize(10).setTextColor(...INK);
    const labelLines = this.doc.splitTextToSize(label, CONTENT_WIDTH - 120) as string[];
    const valueWidth = this.doc.getTextWidth(value);
    this.doc.text(labelLines[0] ?? "", MARGIN.left, this.y);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(value, PAGE.width - MARGIN.right - valueWidth, this.y);
    this.y += lineHeight;
    for (const extra of labelLines.slice(1)) {
      this.space(lineHeight);
      this.doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...INK);
      this.doc.text(extra, MARGIN.left, this.y);
      this.y += lineHeight;
    }
  }

  divider() {
    this.space(14);
    this.doc.setDrawColor(...RULE).setLineWidth(0.5);
    this.doc.line(MARGIN.left, this.y, PAGE.width - MARGIN.right, this.y);
    this.y += 14;
  }
}

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function coverPage(doc: Doc, layout: Layout, blueprint: Blueprint, locked: boolean) {
  layout.y = 132;

  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...ACCENT);
  doc.text("PUBLISHER BLUEPRINT", MARGIN.left, layout.y, { charSpace: 2.4 });
  layout.y += 34;

  doc.setFont("helvetica", "bold").setFontSize(26).setTextColor(...INK);
  const title = blueprint.organizationName || "Your owned-audience strategy";
  for (const line of doc.splitTextToSize(title, CONTENT_WIDTH) as string[]) {
    doc.text(line, MARGIN.left, layout.y);
    layout.y += 32;
  }

  layout.y += 4;
  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(...MUTED);
  doc.text(
    locked ? "Publisher Index summary" : "Executive strategic report",
    MARGIN.left,
    layout.y,
  );
  layout.y += 40;

  doc.setDrawColor(...ACCENT).setLineWidth(2);
  doc.line(MARGIN.left, layout.y, MARGIN.left + 64, layout.y);
  layout.y += 84; // clears the 56pt score cap height below the rule

  // Headline score.
  doc.setFont("helvetica", "bold").setFontSize(56).setTextColor(...ACCENT);
  doc.text(String(blueprint.overall), MARGIN.left, layout.y);
  const scoreWidth = doc.getTextWidth(String(blueprint.overall));
  doc.setFont("helvetica", "normal").setFontSize(16).setTextColor(...MUTED);
  doc.text("/100", MARGIN.left + scoreWidth + 6, layout.y);
  layout.y += 26;

  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(...INK);
  doc.text(`Level ${blueprint.maturity.level} · ${blueprint.maturity.title}`, MARGIN.left, layout.y);
  layout.y += 20;

  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...MUTED);
  doc.text(`Publisher Index · Assessed ${formatDate(blueprint.completedAt)}`, MARGIN.left, layout.y);
  layout.y += 40;

  layout.paragraph(blueprint.maturity.summary, { size: 10.5, color: INK });
}

function footers(doc: Doc) {
  const total = doc.getNumberOfPages();
  const stamp = `Generated ${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`;
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...RULE).setLineWidth(0.5);
    doc.line(MARGIN.left, PAGE.height - 46, PAGE.width - MARGIN.right, PAGE.height - 46);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...MUTED);
    doc.text(`Publisher Blueprint · ${stamp}`, MARGIN.left, PAGE.height - 32);
    const label = `${page} of ${total}`;
    doc.text(label, PAGE.width - MARGIN.right - doc.getTextWidth(label), PAGE.height - 32);
  }
}

export interface BlueprintPdfOptions {
  saved?: SavedRecommendationRow[] | null;
  /** True when the server withheld the paid analysis — produces the free-tier report. */
  locked?: boolean;
}

/** Builds the report and returns it as a PDF Blob. */
export async function buildBlueprintPdf(
  blueprint: Blueprint,
  options: BlueprintPdfOptions = {},
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  doc.setProperties({
    title: `Publisher Blueprint — ${blueprint.organizationName ?? "Report"}`,
    subject: "Publisher Index assessment and owned-audience strategy",
    creator: "Publisher Blueprint",
  });

  const locked = options.locked ?? false;
  const layout = new Layout(doc);

  coverPage(doc, layout, blueprint, locked);

  // ---- Category readings (all tiers) ----
  layout.pageBreak();
  layout.heading("Category readings");
  layout.paragraph(
    "Your Publisher Index broken down by the six capabilities that determine owned-audience performance.",
    { color: MUTED },
  );
  layout.gap(8);
  for (const category of blueprint.categories) {
    layout.row(category.label, `${category.score}/100 · ${category.bandLabel}`, { emphasis: true });
    layout.paragraph(category.meaning, { size: 9.5, color: MUTED });
    layout.gap(8);
  }

  if (locked) {
    layout.gap(20);
    layout.heading("Unlock the full report");
    layout.paragraph(
      "This summary covers your Publisher Index score and category readings. The complete Publisher Blueprint adds the strategic interpretation behind those numbers:",
      { color: INK },
    );
    layout.gap(10);
    for (const item of [
      "Executive summary: your position, biggest opportunity, and primary risk",
      "Priority opportunities ranked by impact and effort",
      "Strengths to protect and gaps to close",
      "A 90-day roadmap, month by month, with success metrics",
      "The KPIs to track as the plan runs",
      "AI strategy documents from Publisher Copilot",
    ]) {
      layout.bullet(item);
    }
    layout.gap(16);
    layout.paragraph(blueprint.cta.title, { size: 11, style: "bold" });
    layout.paragraph(blueprint.cta.body, { color: MUTED });
    footers(doc);
    return doc.output("blob");
  }

  // ---- Executive summary ----
  layout.gap(20);
  layout.heading("Executive summary");
  layout.subheading("Where you stand");
  layout.paragraph(blueprint.summary.position);
  layout.gap(12);
  layout.subheading("Biggest opportunity");
  layout.paragraph(blueprint.summary.biggestOpportunity);
  layout.gap(12);
  layout.subheading("Primary risk");
  layout.paragraph(blueprint.summary.biggestRisk);
  layout.gap(12);
  layout.subheading("Recommended focus");
  layout.paragraph(blueprint.summary.recommendedFocus);

  // ---- Strengths and gaps ----
  if (blueprint.strengths.length > 0 || blueprint.gaps.length > 0) {
    layout.gap(20);
    layout.heading("Strengths and gaps");
    if (blueprint.strengths.length > 0) {
      layout.subheading("Strengths to build on");
      for (const strength of blueprint.strengths) {
        layout.row(strength.title, `${strength.score}/100`);
        layout.paragraph(strength.implication, { size: 9.5, color: MUTED });
        layout.gap(6);
      }
      layout.gap(8);
    }
    if (blueprint.gaps.length > 0) {
      layout.subheading("Gaps to close");
      for (const gap of blueprint.gaps) {
        layout.row(gap.title, `${gap.score}/100`);
        layout.paragraph(gap.whyItMatters, { size: 9.5, color: MUTED });
        layout.gap(6);
      }
    }
  }

  // ---- Priority opportunities ----
  if (blueprint.opportunities.length > 0) {
    layout.gap(20);
    layout.heading("Priority opportunities");
    for (const opportunity of blueprint.opportunities) {
      layout.subheading(`${opportunity.rank}. ${opportunity.title}`);
      layout.paragraph(opportunity.rationale, { size: 9.5 });
      layout.paragraph(
        `${opportunity.categoryLabel} · Impact: ${opportunity.impact} · Effort: ${opportunity.effort}`,
        { size: 9, color: MUTED },
      );
      layout.gap(10);
    }
  }

  // ---- Quick wins ----
  if (blueprint.quickWins.length > 0) {
    layout.gap(12);
    layout.heading("Quick wins");
    for (const action of blueprint.quickWins) {
      layout.subheading(action.title);
      layout.paragraph(action.description, { size: 9.5 });
      layout.paragraph(`${action.categoryLabel} · ${action.timeframe}`, { size: 9, color: MUTED });
      layout.gap(10);
    }
  }

  // ---- Roadmap ----
  if (blueprint.roadmap.length > 0) {
    layout.gap(20);
    layout.heading("90-day roadmap");
    for (const phase of blueprint.roadmap) {
      layout.subheading(`Month ${phase.month} · ${phase.phase}`);
      layout.paragraph(phase.objective, { size: 9.5, color: MUTED });
      layout.gap(8);
      if (phase.priorities.length > 0) {
        layout.paragraph(phase.prioritiesLabel, { size: 9, style: "bold" });
        for (const priority of phase.priorities) {
          layout.bullet(`${priority.title} — ${priority.description}`, { size: 9.5 });
        }
        layout.gap(6);
        layout.paragraph("Supporting activities", { size: 9, style: "bold", color: MUTED });
      }

      for (const activity of phase.activities) layout.bullet(activity, { size: 9.5 });
      if (phase.metrics.length > 0) {
        layout.gap(6);
        layout.paragraph("Success metrics", { size: 9, style: "bold", color: MUTED });
        for (const metric of phase.metrics) layout.bullet(metric, { size: 9.5, color: MUTED });
      }
      layout.divider();
    }
  }

  // ---- Long-term moves ----
  if (blueprint.longTerm.length > 0) {
    layout.heading("Beyond 90 days");
    for (const action of blueprint.longTerm) {
      layout.subheading(action.title);
      layout.paragraph(action.description, { size: 9.5 });
      layout.paragraph(`${action.categoryLabel} · ${action.timeframe}`, { size: 9, color: MUTED });
      layout.gap(10);
    }
  }

  // ---- KPIs ----
  if (blueprint.kpis.length > 0) {
    layout.gap(12);
    layout.heading("KPIs to track");
    for (const kpi of blueprint.kpis) {
      layout.row(kpi.label, kpi.target, { emphasis: true });
      layout.paragraph(kpi.description, { size: 9.5, color: MUTED });
      layout.gap(8);
    }
  }

  // ---- Saved actions ----
  const savedActions = (options.saved ?? []).filter((item) => item.status !== "archived");
  if (savedActions.length > 0) {
    layout.gap(12);
    layout.heading("Saved actions");
    layout.paragraph("Actions you saved to your Blueprint from Publisher Copilot and the strategy library.", {
      color: MUTED,
    });
    layout.gap(10);
    for (const action of savedActions) {
      layout.row(action.title, action.status === "done" ? "Done" : "To do", { emphasis: true });
      layout.paragraph(action.body, { size: 9.5, color: MUTED });
      layout.gap(8);
    }
  }

  footers(doc);
  return doc.output("blob");
}

