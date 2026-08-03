/**
 * Server-only lifecycle recomputation.
 *
 * Stages are derived, never asserted: every recompute reads the current facts
 * (assessments + entitlements, cross-checked against `platform_events`) and
 * writes the result. That makes the job idempotent and safe to run on every
 * triggering event, on demand, or as a full backfill.
 */

import {
  deriveStage,
  nextHighestStage,
  type LifecycleFacts,
  type LifecycleStage,
} from "./stages";

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

function subscriptionIsLive(row: { status: string; current_period_end: string | null }) {
  const endsInFuture = !row.current_period_end || new Date(row.current_period_end) > new Date();
  if (["active", "trialing", "past_due"].includes(row.status)) return endsInFuture;
  // A canceled subscription keeps access until the paid period runs out.
  if (row.status === "canceled") return endsInFuture && !!row.current_period_end;
  return false;
}

/** Gathers the facts a stage is derived from, for one user. */
export async function collectFacts(admin: Admin, userId: string): Promise<LifecycleFacts> {
  const [assessments, purchases, subscriptions] = await Promise.all([
    admin.from("assessments").select("status, completed_at").eq("user_id", userId),
    admin.from("purchases").select("status, included_os_access_until").eq("user_id", userId),
    admin.from("subscriptions").select("status, current_period_end").eq("user_id", userId),
  ]);

  const assessmentRows = assessments.data ?? [];
  const purchaseRows = purchases.data ?? [];
  const subRows = subscriptions.data ?? [];

  const completedPurchases = purchaseRows.filter((row) => row.status === "completed");
  const includedOsLive = completedPurchases.some(
    (row) => row.included_os_access_until && new Date(row.included_os_access_until) > new Date(),
  );

  return {
    hasAccount: true,
    assessmentStarted: assessmentRows.length > 0,
    assessmentCompleted: assessmentRows.some(
      (row) => row.status === "completed" || !!row.completed_at,
    ),
    hasPurchase: completedPurchases.length > 0,
    hasActiveSubscription: includedOsLive || subRows.some(subscriptionIsLive),
    // Refunded purchases and expired subscriptions both mean "used to pay".
    hadPaidRelationship:
      purchaseRows.some((row) => row.status !== "completed") || subRows.length > 0,
  };
}

export interface LifecycleSyncResult {
  userId: string;
  stage: LifecycleStage;
  previousStage: LifecycleStage | null;
  changed: boolean;
}

/**
 * Recomputes and persists one user's stage. Emits `lifecycle.stage_changed`
 * only on an actual transition, so the event stream stays a clean history of
 * movements rather than a log of recomputes.
 */
export async function syncLifecycle(
  userId: string,
  options: { organizationId?: string | null; occurredAt?: string } = {},
): Promise<LifecycleSyncResult | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin;

    const [{ data: existing }, facts] = await Promise.all([
      admin.from("customer_lifecycle").select("*").eq("user_id", userId).maybeSingle(),
      collectFacts(admin, userId),
    ]);

    const { stage, reason } = deriveStage(facts);
    const previousStage = (existing?.stage as LifecycleStage | undefined) ?? null;
    const changed = previousStage !== stage;
    const now = options.occurredAt ?? new Date().toISOString();

    let organizationId = options.organizationId ?? existing?.organization_id ?? null;
    if (!organizationId) {
      const { data: member } = await admin
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .maybeSingle();
      organizationId = member?.organization_id ?? null;
    }

    const highest = nextHighestStage(
      (existing?.highest_stage as LifecycleStage | undefined) ?? "registered",
      stage,
    );

    const { error } = await admin.from("customer_lifecycle").upsert(
      {
        user_id: userId,
        organization_id: organizationId,
        stage,
        previous_stage: changed ? previousStage : (existing?.previous_stage ?? null),
        highest_stage: highest,
        stage_entered_at: changed ? now : (existing?.stage_entered_at ?? now),
        first_seen_at: existing?.first_seen_at ?? now,
        last_active_at: now,
        churned_at: stage === "churned" ? (existing?.churned_at ?? now) : null,
        stage_reason: reason,
      },
      { onConflict: "user_id" },
    );
    if (error) {
      console.error(`lifecycle sync failed for ${userId}: ${error.message}`);
      return null;
    }

    if (changed) {
      const { emitPlatformEvent } = await import("@/lib/events/emit.server");
      await emitPlatformEvent({
        type: "lifecycle.stage_changed",
        userId,
        organizationId,
        source: "server",
        occurredAt: now,
        context: { reason },
        payload: { from: previousStage, to: stage, highestStage: highest },
        // One transition record per user per stage entry.
        dedupeKey: `lifecycle.stage_changed:${userId}:${stage}:${now}`,
      });
    }

    return { userId, stage, previousStage, changed };
  } catch (error) {
    console.error(
      `lifecycle sync threw for ${userId}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

/**
 * Rebuilds stages for every known user. Safe to re-run: recomputation is
 * idempotent and only real transitions produce events.
 */
export async function syncAllLifecycles(): Promise<{ processed: number; changed: number }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profiles } = await supabaseAdmin.from("profiles").select("id");
  const ids = (profiles ?? []).map((row) => row.id);

  let changed = 0;
  // Sequential on purpose: a backfill must not stampede the connection pool.
  for (const id of ids) {
    const result = await syncLifecycle(id);
    if (result?.changed) changed += 1;
  }
  return { processed: ids.length, changed };
}
