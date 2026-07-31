import { supabase } from "@/integrations/supabase/client";
import { WIZARD_SECTIONS, type WizardAnswers } from "@/lib/wizard-config";
import {
  PLACEHOLDER_BLUEPRINT,
  PLACEHOLDER_RECOMMENDATIONS,
  PLACEHOLDER_ROADMAP,
} from "@/lib/placeholder-blueprint";

/**
 * Persists a completed wizard run.
 *
 * Scoring and recommendations are placeholders today; when AI generation is
 * added it should replace only the blueprint/recommendation payloads below.
 */
export async function submitAssessment(userId: string, answers: WizardAnswers) {
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      owner_id: userId,
      name: String(answers["company_name"] ?? "Untitled organization"),
      website: answers["website"] ? String(answers["website"]) : null,
      industry: answers["industry"] ? String(answers["industry"]) : null,
      revenue_range: answers["revenue_range"] ? String(answers["revenue_range"]) : null,
      team_size: answers["team_size"] ? String(answers["team_size"]) : null,
      marketer_count: answers["marketer_count"] ? Number(answers["marketer_count"]) : null,
    })
    .select("id")
    .single();
  if (orgError) throw orgError;

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .insert({
      user_id: userId,
      organization_id: org.id,
      status: "completed",
      current_step: WIZARD_SECTIONS.length,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (assessmentError) throw assessmentError;

  const rows = WIZARD_SECTIONS.flatMap((section) =>
    section.questions
      .filter((question) => answers[question.key] !== undefined && answers[question.key] !== "")
      .map((question) => ({
        assessment_id: assessment.id,
        user_id: userId,
        section: section.id,
        question_key: question.key,
        value: { value: answers[question.key] ?? null },
      })),
  );
  if (rows.length) {
    const { error } = await supabase.from("assessment_answers").insert(rows);
    if (error) throw error;
  }

  const { data: blueprint, error: blueprintError } = await supabase
    .from("blueprints")
    .insert({
      assessment_id: assessment.id,
      user_id: userId,
      publisher_level: PLACEHOLDER_BLUEPRINT.publisherLevel,
      overall_score: PLACEHOLDER_BLUEPRINT.overallScore,
      section_scores: Object.fromEntries(
        PLACEHOLDER_BLUEPRINT.sectionScores.map((item) => [item.label, item.score]),
      ),
      top_opportunity: PLACEHOLDER_BLUEPRINT.topOpportunity,
      top_risk: PLACEHOLDER_BLUEPRINT.topRisk,
      recommended_priority: PLACEHOLDER_BLUEPRINT.recommendedPriority,
      next_90_days: PLACEHOLDER_BLUEPRINT.next90Days,
      generated_by: "placeholder",
    })
    .select("id")
    .single();
  if (blueprintError) throw blueprintError;

  await supabase.from("recommendations").insert(
    PLACEHOLDER_RECOMMENDATIONS.map((item, index) => ({
      blueprint_id: blueprint.id,
      user_id: userId,
      category: item.category,
      title: item.title,
      rationale: item.rationale,
      impact: item.impact,
      effort: item.effort,
      position: index,
    })),
  );

  await supabase.from("roadmaps").insert(
    PLACEHOLDER_ROADMAP.map((item, index) => ({
      blueprint_id: blueprint.id,
      user_id: userId,
      month: item.month,
      title: item.title,
      description: item.description,
      owner: item.owner,
      status: item.status,
      position: index,
    })),
  );

  return { assessmentId: assessment.id, blueprintId: blueprint.id };
}

/** Latest blueprint for the signed-in user, or null before the first run. */
export async function fetchLatestBlueprint() {
  const { data, error } = await supabase
    .from("blueprints")
    .select("*, assessments(id, completed_at, organizations(name, industry))")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
