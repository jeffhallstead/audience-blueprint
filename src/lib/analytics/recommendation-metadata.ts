/**
 * Recommendation engagement metadata (browser-side, RLS-scoped to the user).
 *
 * A recommendation is only valuable if it gets used, so we track the lifecycle
 * of each one — viewed, saved, exported, completed — keyed by a stable slug so
 * the same action stays one row across regenerations.
 */

import { supabase } from "@/integrations/supabase/client";

export type RecommendationAction = "viewed" | "saved" | "exported" | "completed";

export interface RecommendationTrackInput {
  title: string;
  action: RecommendationAction;
  category?: string | null;
  source?: string;
  savedRecommendationId?: string | null;
  exportProvider?: string | null;
}

/** Stable key for a recommendation title — regeneration-proof, case-insensitive. */
export function recommendationKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

/**
 * Records one interaction. Best-effort: analytics must never break the action
 * the user actually asked for.
 */
export async function trackRecommendation(input: RecommendationTrackInput): Promise<void> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;

    const key = recommendationKey(input.title);
    if (!key) return;
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from("recommendation_metadata")
      .select("id, view_count, export_count, first_viewed_at, saved_at, exported_at, completed_at")
      .eq("user_id", userId)
      .eq("recommendation_key", key)
      .maybeSingle();

    const row: Record<string, unknown> = {
      user_id: userId,
      recommendation_key: key,
      title: input.title.slice(0, 300),
      category: input.category ?? null,
      source: input.source ?? "copilot",
    };
    if (input.savedRecommendationId) row["saved_recommendation_id"] = input.savedRecommendationId;

    if (input.action === "viewed") {
      row["view_count"] = (existing?.view_count ?? 0) + 1;
      row["first_viewed_at"] = existing?.first_viewed_at ?? now;
      row["last_viewed_at"] = now;
    }
    if (input.action === "saved") row["saved_at"] = existing?.saved_at ?? now;
    if (input.action === "exported") {
      row["export_count"] = (existing?.export_count ?? 0) + 1;
      row["exported_at"] = now;
      row["last_export_provider"] = input.exportProvider ?? null;
    }
    if (input.action === "completed") row["completed_at"] = now;

    await supabase
      .from("recommendation_metadata")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(row as any, { onConflict: "user_id,recommendation_key" });
  } catch {
    /* engagement telemetry is observability, not a gate */
  }
}

/** Convenience for bulk exports: one row per exported recommendation. */
export async function trackRecommendationExport(
  titles: string[],
  provider: string,
): Promise<void> {
  await Promise.all(
    titles
      .filter((title) => title && title.trim().length > 0)
      .slice(0, 200)
      .map((title) =>
        trackRecommendation({ title, action: "exported", exportProvider: provider, source: "blueprint" }),
      ),
  );
}
