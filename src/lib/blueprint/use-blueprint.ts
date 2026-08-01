import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchLatestScores } from "@/lib/assessment/persistence";
import { generateBlueprint, type Blueprint } from "./engine";

/** The single read path every Publisher Blueprint™ screen uses. */
export function useBlueprint() {
  return useQuery<Blueprint | null>({
    queryKey: ["blueprint", "generated"],
    queryFn: async () => {
      const scores = await fetchLatestScores();
      if (!scores) return null;
      return generateBlueprint({
        overall: scores.overall,
        categories: scores.categories,
        maturityLevel: scores.maturityLevel,
        completedAt: scores.completedAt,
        organizationName: scores.organizationName,
      });
    },
    staleTime: 60_000,
  });
}

export interface AssessmentHistoryEntry {
  assessmentId: string;
  overall: number;
  maturityTitle: string;
  maturityLevel: number;
  completedAt: string;
  delta: number | null;
}

/** Previous assessments, newest first, with a score delta against the prior run. */
export async function fetchAssessmentHistory(): Promise<AssessmentHistoryEntry[]> {
  const { data, error } = await supabase
    .from("assessment_scores")
    .select("assessment_id, overall_score, maturity_level, maturity_title, created_at")
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) throw error;

  const rows = data ?? [];
  return rows.map((row, index) => {
    const previous = rows[index + 1];
    return {
      assessmentId: row.assessment_id,
      overall: row.overall_score,
      maturityTitle: row.maturity_title,
      maturityLevel: row.maturity_level,
      completedAt: row.created_at,
      delta: previous ? row.overall_score - previous.overall_score : null,
    };
  });
}

export function formatAssessmentDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
