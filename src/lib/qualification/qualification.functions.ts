/**
 * Qualification read + maintenance server functions.
 *
 * Tiers are never written from the browser: these expose an admin-only
 * breakdown and an explicit rescore. Users' own tiers stay internal — the
 * qualification model is a sales signal, not customer-facing copy.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  QUALIFICATION_TIERS,
  TIER_LABEL,
  type QualificationBreakdownItem,
  type QualificationTier,
} from "./tiers";

export interface QualificationBreakdown {
  tiers: { tier: QualificationTier; label: string; count: number }[];
  tracked: number;
  averageFit: number;
  averageEngagement: number;
  topAccounts: {
    userId: string;
    tier: QualificationTier;
    tierLabel: string;
    fitScore: number;
    engagementScore: number;
    totalScore: number;
    reason: string | null;
    signals: QualificationBreakdownItem[];
    scoredAt: string;
  }[];
  recentTransitions: {
    userId: string;
    from: string | null;
    to: string;
    totalScore: number | null;
    occurredAt: string;
  }[];
}

/** Qualification snapshot for the internal console. Admin role required. */
export const getQualificationBreakdown = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<QualificationBreakdown> => {
    const { assertAdmin } = await import("@/lib/admin/shared");
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [rows, transitions] = await Promise.all([
      supabaseAdmin
        .from("customer_qualification")
        .select("*")
        .order("total_score", { ascending: false }),
      supabaseAdmin
        .from("platform_events")
        .select("user_id, payload, occurred_at")
        .eq("event_type", "qualification.scored")
        .not("payload->>to", "is", null)
        .order("occurred_at", { ascending: false })
        .limit(20),
    ]);

    const data = rows.data ?? [];
    const counts = new Map<string, number>();
    for (const row of data) counts.set(row.tier, (counts.get(row.tier) ?? 0) + 1);

    const average = (key: "fit_score" | "engagement_score") =>
      data.length === 0
        ? 0
        : Math.round(data.reduce((sum, row) => sum + (row[key] ?? 0), 0) / data.length);

    return {
      tracked: data.length,
      averageFit: average("fit_score"),
      averageEngagement: average("engagement_score"),
      tiers: QUALIFICATION_TIERS.map((tier) => ({
        tier,
        label: TIER_LABEL[tier],
        count: counts.get(tier) ?? 0,
      })),
      topAccounts: data.slice(0, 10).map((row) => {
        const signals = (row.signals ?? {}) as {
          fit?: QualificationBreakdownItem[];
          engagement?: QualificationBreakdownItem[];
        };
        return {
          userId: row.user_id,
          tier: row.tier as QualificationTier,
          tierLabel: TIER_LABEL[row.tier as QualificationTier],
          fitScore: row.fit_score,
          engagementScore: row.engagement_score,
          totalScore: row.total_score,
          reason: row.tier_reason,
          signals: [...(signals.fit ?? []), ...(signals.engagement ?? [])],
          scoredAt: row.scored_at,
        };
      }),
      recentTransitions: (transitions.data ?? []).map((row) => {
        const payload = (row.payload ?? {}) as {
          from?: string | null;
          to?: string;
          totalScore?: number;
        };
        return {
          userId: row.user_id ?? "—",
          from: payload.from ?? null,
          to: payload.to ?? "—",
          totalScore: payload.totalScore ?? null,
          occurredAt: row.occurred_at,
        };
      }),
    };
  });

/** Rescores every account from current facts. Admin role required. */
export const rebuildQualifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/admin/shared");
    await assertAdmin(context as never);
    const { syncAllQualifications } = await import("./score.server");
    return syncAllQualifications();
  });
