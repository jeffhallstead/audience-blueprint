import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { PaddleEnv } from "@/lib/paddle.server";
import type { Tier } from "@/lib/commerce/plans";
import { generateBlueprint, type Blueprint } from "@/lib/blueprint/engine";

const isEnv = (value: unknown): PaddleEnv => (value === "live" ? "live" : "sandbox");

export type BlueprintPayload = {
  tier: Tier;
  /** True when the paid sections were stripped before leaving the server. */
  locked: boolean;
  blueprint: Blueprint | null;
};

/**
 * The single read path for every blueprint screen.
 *
 * Paid analysis (executive summary, opportunities, strengths, gaps, roadmap,
 * quick wins, KPIs, resources) is removed on the server for free users, so
 * locked content never reaches the browser.
 */
export const getBlueprintPayload = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => ({ environment: isEnv(data.environment) }))
  .handler(async ({ data, context }): Promise<BlueprintPayload> => {
    const { fetchLatestScoresFor } = await import("@/lib/blueprint/scores.server");
    const { resolveEntitlement, tierMeets } = await import("@/lib/commerce/entitlement.server");

    const [scores, entitlement] = await Promise.all([
      fetchLatestScoresFor(context.supabase, context.userId),
      resolveEntitlement(context.supabase, context.userId, data.environment),
    ]);

    const tier = entitlement.tier;
    if (!scores) return { tier, locked: !tierMeets(tier, "full_dashboard"), blueprint: null };

    const full = generateBlueprint({
      overall: scores.overall,
      categories: scores.categories,
      maturityLevel: scores.maturityLevel,
      completedAt: scores.completedAt,
      organizationName: scores.organizationName,
    });

    if (tierMeets(tier, "full_dashboard")) return { tier, locked: false, blueprint: full };

    // Free tier keeps the Publisher Index™ score, maturity level and the
    // six category readings. Everything else is stripped server-side.
    const preview: Blueprint = {
      ...full,
      summary: {
        position: "",
        biggestOpportunity: "",
        biggestRisk: "",
        recommendedFocus: "",
      },
      opportunities: [],
      strengths: [],
      gaps: [],
      roadmap: [],
      quickWins: [],
      longTerm: [],
      kpis: [],
      resources: [],
    };

    return { tier, locked: true, blueprint: preview };
  });
