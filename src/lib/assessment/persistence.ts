import { supabase } from "@/integrations/supabase/client";
import { ASSESSMENT_VERSION, QUESTIONS, type AssessmentAnswers, type AnswerValue } from "./config";
import { computePublisherIndex } from "./scoring";
import { createOrganization, fetchMyOrganization, updateOrganization } from "@/lib/organization/store";

export type AssessmentEventName =
  | "assessment_started"
  | "section_completed"
  | "question_answered"
  | "assessment_completed"
  | "assessment_abandoned";

/** Fire-and-forget analytics. Never blocks or breaks the wizard. */
export async function logEvent(
  userId: string,
  eventName: AssessmentEventName,
  assessmentId: string | null,
  section?: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    await supabase.from("assessment_events").insert({
      user_id: userId,
      assessment_id: assessmentId,
      event_name: eventName,
      section: section ?? null,
      metadata: metadata as never,
    });
  } catch {
    /* analytics must never interrupt the assessment */
  }
}

export interface ActiveAssessment {
  id: string;
  currentStep: number;
  answers: AssessmentAnswers;
  resumed: boolean;
}

/** Returns the in-progress assessment for the user, creating one if needed. */
export async function getOrCreateAssessment(userId: string): Promise<ActiveAssessment> {
  const { data: existing, error } = await supabase
    .from("assessments")
    .select("id, current_step")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  if (existing) {
    const answers = await loadAnswers(existing.id);
    return { id: existing.id, currentStep: existing.current_step ?? 0, answers, resumed: true };
  }

  const { data: created, error: createError } = await supabase
    .from("assessments")
    .insert({ user_id: userId, status: "in_progress", current_step: 0, version: ASSESSMENT_VERSION })
    .select("id")
    .single();
  if (createError) throw createError;

  void logEvent(userId, "assessment_started", created.id);
  return { id: created.id, currentStep: 0, answers: {}, resumed: false };
}

export async function loadAnswers(assessmentId: string): Promise<AssessmentAnswers> {
  const { data, error } = await supabase
    .from("assessment_answers")
    .select("question_key, value")
    .eq("assessment_id", assessmentId);
  if (error) throw error;

  const answers: AssessmentAnswers = {};
  for (const row of data ?? []) {
    const payload = row.value as { value?: AnswerValue } | null;
    answers[row.question_key] = payload?.value ?? null;
  }
  return answers;
}

/** Auto-save a single answer. Idempotent per (assessment, question). */
export async function saveAnswer(
  assessmentId: string,
  userId: string,
  questionId: string,
  value: AnswerValue,
) {
  const question = QUESTIONS.find((item) => item.id === questionId);
  const { error } = await supabase.from("assessment_answers").upsert(
    {
      assessment_id: assessmentId,
      user_id: userId,
      section: question?.section ?? "unknown",
      question_key: questionId,
      value: { value } as never,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "assessment_id,question_key" },
  );
  if (error) throw error;
}

export async function saveStep(assessmentId: string, step: number) {
  await supabase.from("assessments").update({ current_step: step }).eq("id", assessmentId);
}

/** Scores, persists, and closes out the assessment. Returns the assessment id. */
export async function completeAssessment(userId: string, assessmentId: string, answers: AssessmentAnswers) {
  const index = computePublisherIndex(answers);

  // The organization is created at intake; completion only refreshes it.
  const companyName = String(answers["company_name"] ?? "").trim() || "Untitled organization";
  const patch = {
    name: companyName,
    website: answers["website"] ? String(answers["website"]) : null,
    industry: answers["industry"] ? String(answers["industry"]) : null,
    revenue_range: answers["revenue_range"] ? String(answers["revenue_range"]) : null,
    team_size: answers["company_size"] ? String(answers["company_size"]) : null,
    business_model: answers["business_model"] ? String(answers["business_model"]) : null,
    marketer_count: answers["marketing_team_size"] ? Number(answers["marketing_team_size"]) : null,
  };
  const existingOrg = await fetchMyOrganization(userId).catch(() => null);
  const org = existingOrg
    ? await updateOrganization(userId, existingOrg, patch)
    : await createOrganization(userId, patch);

  const score = (id: string) => index.categories.find((item) => item.id === id)?.score ?? 0;

  const { error: scoreError } = await supabase.from("assessment_scores").upsert(
    {
      assessment_id: assessmentId,
      user_id: userId,
      overall_score: index.overall,
      audience_score: score("audience"),
      content_score: score("content"),
      distribution_score: score("distribution"),
      operations_score: score("operations"),
      strategy_score: score("strategy"),
      alignment_score: score("alignment"),
      maturity_level: index.maturity.level,
      maturity_title: index.maturity.title,
      config_version: ASSESSMENT_VERSION,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "assessment_id" },
  );
  if (scoreError) throw scoreError;

  const { error: updateError } = await supabase
    .from("assessments")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      ...(org?.id ? { organization_id: org.id } : {}),
    })
    .eq("id", assessmentId);
  if (updateError) throw updateError;

  void logEvent(userId, "assessment_completed", assessmentId, undefined, {
    overall_score: index.overall,
    maturity_level: index.maturity.level,
  });

  return assessmentId;
}

export interface StoredScores {
  assessmentId: string;
  overall: number;
  categories: Record<string, number>;
  maturityLevel: number;
  maturityTitle: string;
  completedAt: string | null;
  organizationName: string | null;
}

/** Most recent completed assessment for the signed-in user. */
export async function fetchLatestScores(): Promise<StoredScores | null> {
  const { data, error } = await supabase
    .from("assessment_scores")
    .select(
      "assessment_id, overall_score, audience_score, content_score, distribution_score, operations_score, strategy_score, alignment_score, maturity_level, maturity_title, created_at, assessments(completed_at, organizations(name))",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const assessment = data.assessments as { completed_at: string | null; organizations: { name: string } | null } | null;

  return {
    assessmentId: data.assessment_id,
    overall: data.overall_score,
    categories: {
      audience: data.audience_score,
      content: data.content_score,
      distribution: data.distribution_score,
      operations: data.operations_score,
      strategy: data.strategy_score,
      alignment: data.alignment_score,
    },
    maturityLevel: data.maturity_level,
    maturityTitle: data.maturity_title,
    completedAt: assessment?.completed_at ?? data.created_at,
    organizationName: assessment?.organizations?.name ?? null,
  };
}
