/**
 * Publisher Blueprint™ — export row model.
 *
 * Every destination (CSV, Excel, Google Sheets, Airtable, Asana) consumes this
 * same flat list, so the columns stay identical no matter where a plan lands.
 */

import type { Blueprint } from "@/lib/blueprint/engine";
import type { SavedRecommendationRow } from "@/lib/copilot/queries";

export const EXPORT_COLUMNS = [
  "Type",
  "Category",
  "Title",
  "Detail",
  "Impact",
  "Effort",
  "Phase",
  "Owner",
  "Status",
  "Source",
  "Created",
  "Key",
] as const;

export type ExportColumn = (typeof EXPORT_COLUMNS)[number];

export interface ExportRow {
  Type: string;
  Category: string;
  Title: string;
  Detail: string;
  Impact: string;
  Effort: string;
  Phase: string;
  Owner: string;
  Status: string;
  Source: string;
  Created: string;
  /** Stable identity for the row, used to upsert instead of duplicate. */
  Key: string;
}

export const EXPORT_SCOPES = [
  { id: "saved", label: "Saved actions" },
  { id: "roadmap", label: "90-day roadmap" },
  { id: "recommendations", label: "Recommendations" },
  { id: "kpis", label: "KPIs" },
  { id: "scores", label: "Category scores" },
] as const;

export type ExportScope = (typeof EXPORT_SCOPES)[number]["id"];

export const ALL_SCOPES: ExportScope[] = EXPORT_SCOPES.map((scope) => scope.id);

function row(partial: Partial<ExportRow> & { Type: string; Title: string; Key: string }): ExportRow {
  return {
    Category: "",
    Detail: "",
    Impact: "",
    Effort: "",
    Phase: "",
    Owner: "",
    Status: "",
    Source: "Publisher Blueprint",
    Created: new Date().toISOString().slice(0, 10),
    ...partial,
  } as ExportRow;
}

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

export interface ExportSources {
  blueprint: Blueprint | null;
  saved?: SavedRecommendationRow[] | null;
}

/** Flattens the blueprint (and saved Copilot actions) into export rows. */
export function buildExportRows(
  sources: ExportSources,
  scopes: ExportScope[] = ALL_SCOPES,
  options: { locked?: boolean } = {},
): ExportRow[] {
  const { blueprint, saved } = sources;
  const rows: ExportRow[] = [];
  // Free accounts can only ever export their own saved actions — paid plan
  // content (opportunities, roadmap, KPIs) never leaves the app unpurchased.
  const wants = (scope: ExportScope) =>
    scopes.includes(scope) && (!options.locked || scope === "saved");

  if (wants("saved")) {
    for (const item of saved ?? []) {
      if (item.status === "archived") continue;
      rows.push(
        row({
          Type: "Saved action",
          Category: titleCase(item.category),
          Title: item.title,
          Detail: item.body,
          Impact: titleCase(item.impact),
          Effort: titleCase(item.effort),
          Status: item.status === "done" ? "Done" : "To do",
          Source: item.source === "copilot" ? "Publisher Copilot" : "Publisher Blueprint",
          Created: item.created_at.slice(0, 10),
          Key: `saved:${item.id}`,
        }),
      );
    }
  }

  if (!blueprint) return rows;

  if (wants("recommendations")) {
    for (const opportunity of blueprint.opportunities) {
      rows.push(
        row({
          Type: "Opportunity",
          Category: opportunity.categoryLabel,
          Title: opportunity.title,
          Detail: opportunity.rationale,
          Impact: opportunity.impact,
          Effort: opportunity.effort,
          Phase: `Priority ${opportunity.rank}`,
          Status: "To do",
          Key: `opportunity:${opportunity.id}`,
        }),
      );
    }
    for (const action of blueprint.quickWins) {
      rows.push(
        row({
          Type: "Quick win",
          Category: action.categoryLabel,
          Title: action.title,
          Detail: action.description,
          Impact: "High",
          Effort: "Low",
          Phase: action.timeframe,
          Status: "To do",
          Key: `quick-win:${action.id}`,
        }),
      );
    }
    for (const action of blueprint.longTerm) {
      rows.push(
        row({
          Type: "Long-term move",
          Category: action.categoryLabel,
          Title: action.title,
          Detail: action.description,
          Impact: "High",
          Effort: "High",
          Phase: action.timeframe,
          Status: "To do",
          Key: `long-term:${action.id}`,
        }),
      );
    }
  }

  if (wants("roadmap")) {
    for (const phase of blueprint.roadmap) {
      for (const [index, activity] of phase.activities.entries()) {
        rows.push(
          row({
            Type: "Roadmap activity",
            Category: phase.phase,
            Title: activity,
            Detail: phase.objective,
            Phase: `Month ${phase.month}`,
            Status: "To do",
            Key: `roadmap:${phase.id}:${index}`,
          }),
        );
      }
      for (const [index, metric] of phase.metrics.entries()) {
        rows.push(
          row({
            Type: "Roadmap metric",
            Category: phase.phase,
            Title: metric,
            Detail: `Success metric for ${phase.phase}.`,
            Phase: `Month ${phase.month}`,
            Status: "Measure",
            Key: `roadmap-metric:${phase.id}:${index}`,
          }),
        );
      }
    }
  }

  if (wants("kpis")) {
    for (const kpi of blueprint.kpis) {
      rows.push(
        row({
          Type: "KPI",
          Category: "Measurement",
          Title: kpi.label,
          Detail: kpi.description,
          Phase: `Target: ${kpi.target}`,
          Status: "Track",
          Key: `kpi:${kpi.id}`,
        }),
      );
    }
  }

  if (wants("scores")) {
    rows.push(
      row({
        Type: "Score",
        Category: "Publisher Index",
        Title: "Overall Publisher Index™",
        Detail: `${blueprint.overall}/100 — ${blueprint.maturity.title}`,
        Status: blueprint.maturity.title,
        Key: "score:overall",
      }),
    );
    for (const category of blueprint.categories) {
      rows.push(
        row({
          Type: "Score",
          Category: category.label,
          Title: `${category.label} score`,
          Detail: `${category.score}/100 — ${category.status}`,
          Status: category.bandLabel,
          Phase: category.priority ? `Priority ${category.priority}` : "Strength",
          Key: `score:${category.id}`,
        }),
      );
    }
  }

  return rows;
}

/** Filename stem, e.g. `publisher-blueprint-2026-08-01`. */
export function exportFilename(blueprint: Blueprint | null) {
  const org = blueprint?.organizationName?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return [org || "publisher-blueprint", date].join("-");
}
