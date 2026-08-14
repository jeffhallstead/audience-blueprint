/**
 * Publisher Copilot — organizational context assembly.
 *
 * Server-only. Every AI request runs through `buildCopilotContext`, which reads
 * the user's assessment, Publisher Index scores, generated blueprint, roadmap,
 * and previously saved recommendations, then renders them as a compact briefing
 * the model reads before answering. This is why the user never explains their
 * business twice.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { QUESTIONS, CATEGORIES } from "@/lib/assessment/config";
import { generateBlueprint, type Blueprint } from "@/lib/blueprint/engine";

type Client = SupabaseClient<Database>;

export interface CopilotContext {
  hasAssessment: boolean;
  assessmentId: string | null;
  organizationName: string | null;
  blueprint: Blueprint | null;
  /** The rendered briefing injected into every system prompt. */
  briefing: string;
}

const PROFILE_KEYS = [
  "company_name",
  "industry",
  "business_model",
  "revenue_range",
  "company_size",
  "marketing_team_size",
  "website",
];

const GOAL_KEYS = ["growth_goals", "success_definition", "time_to_launch", "budget"];

function formatAnswer(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function labelFor(questionKey: string): string {
  return QUESTIONS.find((question) => question.id === questionKey)?.label ?? questionKey;
}

/** Resolve an option value back to the human label the user actually picked. */
function humanize(questionKey: string, raw: unknown): string {
  const question = QUESTIONS.find((item) => item.id === questionKey);
  const value = formatAnswer(raw);
  if (!question?.options || !value) return value;
  return value
    .split(", ")
    .map((entry) => question.options?.find((option) => option.value === entry)?.label ?? entry)
    .join(", ");
}

function renderList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

export async function buildCopilotContext(supabase: Client, userId: string): Promise<CopilotContext> {
  const { data: scoreRow } = await supabase
    .from("assessment_scores")
    .select(
      "assessment_id, overall_score, audience_score, content_score, distribution_score, operations_score, strategy_score, alignment_score, maturity_level, maturity_title, created_at, assessments(completed_at, organizations(name))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!scoreRow) {
    return {
      hasAssessment: false,
      assessmentId: null,
      organizationName: null,
      blueprint: null,
      briefing:
        "NO ASSESSMENT ON FILE. The user has not completed the Publisher Index assessment yet, so you have no organizational context. Say so plainly in one sentence, answer only in general terms, and direct them to complete the assessment so you can be specific.",
    };
  }

  const assessment = scoreRow.assessments as {
    completed_at: string | null;
    organizations: { name: string } | null;
  } | null;

  const blueprint = generateBlueprint({
    overall: scoreRow.overall_score,
    categories: {
      audience: scoreRow.audience_score,
      content: scoreRow.content_score,
      distribution: scoreRow.distribution_score,
      operations: scoreRow.operations_score,
      strategy: scoreRow.strategy_score,
      alignment: scoreRow.alignment_score,
    },
    maturityLevel: scoreRow.maturity_level,
    completedAt: assessment?.completed_at ?? scoreRow.created_at,
    organizationName: assessment?.organizations?.name ?? null,
  });

  const [{ data: answerRows }, { data: recommendationRows }, { data: documentRows }] = await Promise.all([
    supabase.from("assessment_answers").select("question_key, value").eq("assessment_id", scoreRow.assessment_id),
    supabase
      .from("saved_recommendations")
      .select("title, category, body, status")
      .eq("user_id", userId)
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("generated_documents")
      .select("kind, title, summary")
      .eq("user_id", userId)
      .neq("status", "archived")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const answers = new Map<string, unknown>();
  for (const row of answerRows ?? []) {
    const payload = row.value as { value?: unknown } | null;
    answers.set(row.question_key, payload?.value ?? null);
  }

  const profileLines = PROFILE_KEYS.map((key) => {
    const value = humanize(key, answers.get(key));
    return value ? `${labelFor(key)}: ${value}` : "";
  }).filter(Boolean);

  const goalLines = GOAL_KEYS.map((key) => {
    const value = humanize(key, answers.get(key));
    return value ? `${labelFor(key)}: ${value}` : "";
  }).filter(Boolean);

  const otherAnswers = QUESTIONS.filter(
    (question) => !PROFILE_KEYS.includes(question.id) && !GOAL_KEYS.includes(question.id),
  )
    .map((question) => {
      const value = humanize(question.id, answers.get(question.id));
      return value ? `${question.label}: ${value}` : "";
    })
    .filter(Boolean);

  const briefing = [
    "=== ORGANIZATION BRIEFING (authoritative — never ask the user to repeat any of this) ===",
    "",
    `Organization: ${blueprint.organizationName ?? "Unnamed organization"}`,
    profileLines.length ? renderList(profileLines) : "- No company profile detail on file.",
    "",
    "--- PUBLISHER INDEX ---",
    `Overall score: ${blueprint.overall}/100`,
    `Publisher Level: ${blueprint.maturity.level} — ${blueprint.maturity.title} (${blueprint.tier} tier)`,
    `Level meaning: ${blueprint.maturity.summary}`,
    `Strategic focus for this level: ${blueprint.maturity.strategicFocus}`,
    "",
    "Category scores (0–100):",
    renderList(
      blueprint.categories.map(
        (category) =>
          `${category.label}: ${category.score} (${category.bandLabel}) — ${category.status}. ${category.explanation}`,
      ),
    ),
    "",
    "--- PUBLISHER PATTERN (diagnostic interpretation layer) ---",
    `Pattern: ${blueprint.pattern.name} — ${blueprint.pattern.diagnosisLine}`,
    `Underlying constraint: ${blueprint.pattern.underlyingConstraint}`,
    `Strategic opportunity: ${blueprint.pattern.strategicOpportunity}`,
    `Strategic emphasis for the Blueprint: ${blueprint.pattern.strategicEmphasis}`,
    `Blueprint priority: ${blueprint.pattern.blueprintPriority}`,
    "The pattern names the dominant constraint. It frames priorities; it never replaces the dimension scores. Recommend specific interventions from the scores, under this emphasis.",
    "",
    "--- STRENGTHS ---",
    renderList(blueprint.strengths.map((item) => `${item.categoryLabel} (${item.score}): ${item.title}. ${item.implication}`)),
    "",
    "--- CAPABILITY GAPS ---",
    renderList(
      blueprint.gaps.map((item) => `${item.categoryLabel} (${item.score}): ${item.title}. ${item.whyItMatters}`),
    ),
    "",
    "--- CURRENT STRATEGIC READING ---",
    `Position: ${blueprint.summary.position}`,
    `Biggest opportunity: ${blueprint.summary.biggestOpportunity}`,
    `Biggest risk: ${blueprint.summary.biggestRisk}`,
    `Recommended focus: ${blueprint.summary.recommendedFocus}`,
    "",
    "--- RANKED OPPORTUNITIES ---",
    renderList(
      blueprint.opportunities.map(
        (item) => `#${item.rank} ${item.title} (${item.categoryLabel}, impact ${item.impact}, effort ${item.effort}): ${item.rationale}`,
      ),
    ),
    "",
    "--- EXISTING 90-DAY ROADMAP ---",
    blueprint.roadmap
      .map(
        (phase) =>
          `Month ${phase.month} — ${phase.phase}\nObjective: ${phase.objective}\n${phase.prioritiesLabel}: ${phase.priorities.map((priority) => priority.title).join("; ")}\nActivities: ${phase.activities.join("; ")}\nMetrics: ${phase.metrics.join("; ")}`,
      )
      .join("\n\n"),

    "",
    "--- RECOMMENDED KPIS AT THIS LEVEL ---",
    renderList(blueprint.kpis.map((kpi) => `${kpi.label} — target ${kpi.target}. ${kpi.description}`)),
    "",
    "--- GOALS AND CONSTRAINTS ---",
    goalLines.length ? renderList(goalLines) : "- No explicit goals recorded.",
    "",
    "--- FULL ASSESSMENT RESPONSES ---",
    otherAnswers.length ? renderList(otherAnswers) : "- No further detail recorded.",
    "",
    "--- PREVIOUSLY SAVED RECOMMENDATIONS (stay consistent with these) ---",
    recommendationRows?.length
      ? renderList(recommendationRows.map((row) => `[${row.category}] ${row.title} — ${row.body?.slice(0, 240) ?? ""}`))
      : "- None saved yet.",
    "",
    "--- DOCUMENTS ALREADY GENERATED (do not contradict) ---",
    documentRows?.length
      ? renderList(documentRows.map((row) => `[${row.kind}] ${row.title}${row.summary ? ` — ${row.summary}` : ""}`))
      : "- None yet.",
    "",
    "=== END BRIEFING ===",
  ].join("\n");

  return {
    hasAssessment: true,
    assessmentId: scoreRow.assessment_id,
    organizationName: blueprint.organizationName,
    blueprint,
    briefing,
  };
}

export const CATEGORY_LABELS = CATEGORIES.map((category) => category.label);
