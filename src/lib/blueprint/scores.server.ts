import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type StoredScores = {
  assessmentId: string;
  overall: number;
  categories: Record<string, number>;
  maturityLevel: number;
  maturityTitle: string;
  completedAt: string | null;
  organizationName: string | null;
};

/**
 * Server-side read of the caller's latest Publisher Index™ scores.
 * Uses the RLS-scoped client, so it can only ever return the caller's rows.
 */
export async function fetchLatestScoresFor(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<StoredScores | null> {
  const { data, error } = await supabase
    .from("assessment_scores")
    .select(
      "assessment_id, overall_score, audience_score, content_score, distribution_score, operations_score, strategy_score, alignment_score, maturity_level, maturity_title, created_at, assessments(completed_at, organizations(name))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const assessment = data.assessments as
    | { completed_at: string | null; organizations: { name: string } | null }
    | null;

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
