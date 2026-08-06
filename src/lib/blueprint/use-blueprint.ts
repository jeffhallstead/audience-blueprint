import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { getBlueprintPayload, type BlueprintPayload } from "./blueprint.functions";
import type { Blueprint } from "./engine";

export const blueprintQueryKey = ["blueprint", "payload"] as const;

/**
 * The single read path every Publisher Blueprint screen uses.
 * `locked` means the server withheld the paid analysis for this tier.
 */
export function useBlueprint() {
  const query = useQuery<BlueprintPayload>({
    queryKey: blueprintQueryKey,
    queryFn: () => getBlueprintPayload({ data: { environment: getStripeEnvironment() } }),
    staleTime: 60_000,
  });

  const blueprint: Blueprint | null = query.data?.blueprint ?? null;

  return {
    ...query,
    data: blueprint,
    blueprint,
    locked: query.data?.locked ?? true,
    tier: query.data?.tier ?? "free",
  };
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
