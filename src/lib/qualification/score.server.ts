/**
 * Server-only qualification scoring.
 *
 * Reads the same canonical `platform_events` stream the lifecycle engine uses,
 * joins it to organization profile + entitlement facts, and writes the derived
 * tier. Idempotent: rescoring with unchanged inputs produces no event.
 */

import {
  QUALIFICATION_TRIGGERS,
  deriveQualification,
  nextHighestTier,
  type QualificationFacts,
  type QualificationTier,
} from "./tiers";

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

function subscriptionIsLive(row: { status: string; current_period_end: string | null }) {
  const endsInFuture = !row.current_period_end || new Date(row.current_period_end) > new Date();
  if (["active", "trialing", "past_due"].includes(row.status)) return endsInFuture;
  if (row.status === "canceled") return endsInFuture && !!row.current_period_end;
  return false;
}

const EXTENDED_PROFILE_TABLES = [
  "organization_audience_profile",
  "organization_marketing_profile",
  "organization_content_ops_profile",
] as const;

/**
 * 0–100 depth across the three extended profiles. Each table counts equally and
 * scores by the share of its non-note columns that carry a value.
 */
async function extendedDepthFor(organizationId: string): Promise<number> {
  const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
  const ignored = new Set(["id", "organization_id", "version", "created_at", "updated_at", "notes"]);

  const scores = await Promise.all(
    EXTENDED_PROFILE_TABLES.map(async (table) => {
      const { data } = await admin
        .from(table)
        .select("*")
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (!data) return 0;
      const entries = Object.entries(data as Record<string, unknown>).filter(
        ([key]) => !ignored.has(key),
      );
      if (entries.length === 0) return 0;
      const filled = entries.filter(([, value]) =>
        Array.isArray(value) ? value.length > 0 : value !== null && value !== "",
      ).length;
      return Math.round((filled / entries.length) * 100);
    }),
  );

  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

/** Gathers the facts a tier is derived from, for one user. */
export async function collectQualificationFacts(
  admin: Admin,
  userId: string,
): Promise<{ facts: QualificationFacts; organizationId: string | null }> {
  const [events, member, purchases, subscriptions, scores] = await Promise.all([
    admin
      .from("platform_events")
      .select("event_type")
      .eq("user_id", userId)
      .in("event_type", [...QUALIFICATION_TRIGGERS]),
    admin.from("organization_members").select("organization_id").eq("user_id", userId).maybeSingle(),
    admin.from("purchases").select("status, included_os_access_until").eq("user_id", userId),
    admin.from("subscriptions").select("status, current_period_end").eq("user_id", userId),
    admin
      .from("assessment_scores")
      .select("overall_score, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const eventCounts: Record<string, number> = {};
  for (const row of events.data ?? []) {
    eventCounts[row.event_type] = (eventCounts[row.event_type] ?? 0) + 1;
  }

  const organizationId = member.data?.organization_id ?? null;
  let organization: QualificationFacts["organization"] = null;
  if (organizationId) {
    const { data: org } = await admin
      .from("organizations")
      .select("industry, revenue_range, team_size, business_model, marketer_count, profile_completeness")
      .eq("id", organizationId)
      .maybeSingle();
    if (org) {
      organization = {
        industry: org.industry,
        revenueRange: org.revenue_range,
        teamSize: org.team_size,
        businessModel: org.business_model,
        marketerCount: org.marketer_count,
        profileCompleteness: org.profile_completeness ?? 0,
        extendedDepth: await extendedDepthFor(organizationId),
      };
    }
  }


  const purchaseRows = purchases.data ?? [];
  const completedPurchases = purchaseRows.filter((row) => row.status === "completed");
  const includedOsLive = completedPurchases.some(
    (row) => row.included_os_access_until && new Date(row.included_os_access_until) > new Date(),
  );

  return {
    organizationId,
    facts: {
      organization,
      eventCounts,
      assessmentCompleted:
        (eventCounts["assessment.completed"] ?? 0) > 0 || (scores.data?.length ?? 0) > 0,
      indexScore: scores.data?.[0]?.overall_score ?? null,
      isPaying:
        completedPurchases.length > 0 ||
        includedOsLive ||
        (subscriptions.data ?? []).some(subscriptionIsLive),
    },
  };
}

export interface QualificationSyncResult {
  userId: string;
  tier: QualificationTier;
  previousTier: QualificationTier | null;
  totalScore: number;
  changed: boolean;
}

/**
 * Rescores one user and persists the result. `qualification.scored` is emitted
 * only when the tier actually moves, keeping the event stream a history of
 * transitions rather than a log of recomputes.
 */
export async function syncQualification(
  userId: string,
  options: { organizationId?: string | null; occurredAt?: string } = {},
): Promise<QualificationSyncResult | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin;

    const [{ data: existing }, collected] = await Promise.all([
      admin.from("customer_qualification").select("*").eq("user_id", userId).maybeSingle(),
      collectQualificationFacts(admin, userId),
    ]);

    const derived = deriveQualification(collected.facts);
    const previousTier = (existing?.tier as QualificationTier | undefined) ?? null;
    const changed = previousTier !== derived.tier;
    const now = options.occurredAt ?? new Date().toISOString();
    const organizationId =
      options.organizationId ?? collected.organizationId ?? existing?.organization_id ?? null;

    const highest = nextHighestTier(
      (existing?.highest_tier as QualificationTier | undefined) ?? "unqualified",
      derived.tier,
    );

    const { error } = await admin.from("customer_qualification").upsert(
      {
        user_id: userId,
        organization_id: organizationId,
        tier: derived.tier,
        previous_tier: changed ? previousTier : (existing?.previous_tier ?? null),
        highest_tier: highest,
        fit_score: derived.fitScore,
        engagement_score: derived.engagementScore,
        total_score: derived.totalScore,
        tier_reason: derived.reason,
        signals: derived.signals as never,
        tier_entered_at: changed ? now : (existing?.tier_entered_at ?? now),
        scored_at: now,
      },
      { onConflict: "user_id" },
    );
    if (error) {
      console.error(`qualification sync failed for ${userId}: ${error.message}`);
      return null;
    }

    if (changed) {
      const { emitPlatformEvent } = await import("@/lib/events/emit.server");
      await emitPlatformEvent({
        type: "qualification.scored",
        userId,
        organizationId,
        source: "server",
        occurredAt: now,
        context: { reason: derived.reason },
        payload: {
          from: previousTier,
          to: derived.tier,
          highestTier: highest,
          fitScore: derived.fitScore,
          engagementScore: derived.engagementScore,
          totalScore: derived.totalScore,
        },
        dedupeKey: `qualification.scored:${userId}:${derived.tier}:${now}`,
      });
    }

    return {
      userId,
      tier: derived.tier,
      previousTier,
      totalScore: derived.totalScore,
      changed,
    };
  } catch (error) {
    console.error(
      `qualification sync threw for ${userId}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

/** Rescores every known account. Safe to re-run. */
export async function syncAllQualifications(): Promise<{ processed: number; changed: number }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: profiles } = await supabaseAdmin.from("profiles").select("id");
  const ids = (profiles ?? []).map((row) => row.id);

  let changed = 0;
  // Sequential on purpose: a backfill must not stampede the connection pool.
  for (const id of ids) {
    const result = await syncQualification(id);
    if (result?.changed) changed += 1;
  }
  return { processed: ids.length, changed };
}
