/**
 * Lifecycle read + maintenance server functions.
 *
 * Stage data is never written from the browser: these expose reads for the
 * signed-in user and admin-only aggregates plus an explicit rebuild.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  LIFECYCLE_STAGES,
  STAGE_LABEL,
  type LifecycleStage,
} from "./stages";

export interface MyLifecycle {
  stage: LifecycleStage;
  stageLabel: string;
  previousStage: LifecycleStage | null;
  highestStage: LifecycleStage;
  stageEnteredAt: string;
  reason: string | null;
}

/** The signed-in user's own stage, computed on demand if not yet stored. */
export const getMyLifecycle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyLifecycle | null> => {
    const { data } = await context.supabase
      .from("customer_lifecycle")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!data) {
      const { syncLifecycle } = await import("./sync.server");
      const result = await syncLifecycle(context.userId);
      if (!result) return null;
      return {
        stage: result.stage,
        stageLabel: STAGE_LABEL[result.stage],
        previousStage: result.previousStage,
        highestStage: result.stage,
        stageEnteredAt: new Date().toISOString(),
        reason: null,
      };
    }

    const stage = data.stage as LifecycleStage;
    return {
      stage,
      stageLabel: STAGE_LABEL[stage],
      previousStage: (data.previous_stage as LifecycleStage | null) ?? null,
      highestStage: data.highest_stage as LifecycleStage,
      stageEnteredAt: data.stage_entered_at,
      reason: data.stage_reason,
    };
  });

export interface LifecycleBreakdown {
  stages: { stage: LifecycleStage; label: string; count: number }[];
  tracked: number;
  recentTransitions: {
    userId: string;
    from: string | null;
    to: string;
    occurredAt: string;
  }[];
}

/** Funnel snapshot for the internal console. Admin role required. */
export const getLifecycleBreakdown = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LifecycleBreakdown> => {
    const { assertAdmin } = await import("@/lib/admin/shared");
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [rows, transitions] = await Promise.all([
      supabaseAdmin.from("customer_lifecycle").select("stage"),
      supabaseAdmin
        .from("platform_events")
        .select("user_id, payload, occurred_at")
        .eq("event_type", "lifecycle.stage_changed")
        .order("occurred_at", { ascending: false })
        .limit(20),
    ]);

    const counts = new Map<string, number>();
    for (const row of rows.data ?? []) {
      counts.set(row.stage, (counts.get(row.stage) ?? 0) + 1);
    }

    return {
      tracked: rows.data?.length ?? 0,
      stages: LIFECYCLE_STAGES.map((stage) => ({
        stage,
        label: STAGE_LABEL[stage],
        count: counts.get(stage) ?? 0,
      })),
      recentTransitions: (transitions.data ?? []).map((row) => {
        const payload = (row.payload ?? {}) as { from?: string | null; to?: string };
        return {
          userId: row.user_id ?? "—",
          from: payload.from ?? null,
          to: payload.to ?? "—",
          occurredAt: row.occurred_at,
        };
      }),
    };
  });

/** Rebuilds every stage from current facts. Admin role required. */
export const rebuildLifecycles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/admin/shared");
    await assertAdmin(context as never);
    const { syncAllLifecycles } = await import("./sync.server");
    return syncAllLifecycles();
  });
