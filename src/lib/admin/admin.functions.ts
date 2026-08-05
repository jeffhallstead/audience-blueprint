import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin, isAdminContext, MATURITY_LABELS, type AdminOverview, type AdminUserRow, type IntegrationsStatus } from "@/lib/admin/shared";

/** Internal-only operations snapshot. Admin role required. */
export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [authUsersRes, profiles, orgs, assessments, scores, purchases, subs, sessions, docs, outbox, roles] =
      await Promise.all([
        supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
        supabaseAdmin.from("profiles").select("id, full_name, created_at"),
        supabaseAdmin.from("organizations").select("owner_id, name"),
        supabaseAdmin.from("assessments").select("id, user_id, status, created_at"),
        supabaseAdmin
          .from("assessment_scores")
          .select("user_id, overall_score, maturity_level, created_at")
          .order("created_at", { ascending: false }),
        supabaseAdmin.from("purchases").select("user_id, amount_cents, status"),
        supabaseAdmin.from("subscriptions").select("user_id, status, current_period_end"),
        supabaseAdmin.from("ai_sessions").select("id"),
        supabaseAdmin.from("generated_documents").select("id"),
        supabaseAdmin
          .from("integration_outbox")
          .select("id, provider, event_name, status, attempts, last_error, next_attempt_at, created_at")
          .order("created_at", { ascending: false })
          .limit(25),
        supabaseAdmin.from("user_roles").select("user_id, role"),
      ]);

    const users = authUsersRes.data?.users ?? [];
    const profileById = new Map((profiles.data ?? []).map((p) => [p.id, p]));
    const orgByOwner = new Map((orgs.data ?? []).map((o) => [o.owner_id, o.name]));
    const adminIds = new Set((roles.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));

    const latestScoreByUser = new Map<string, { overall: number; level: number }>();
    for (const row of scores.data ?? []) {
      if (!latestScoreByUser.has(row.user_id)) {
        latestScoreByUser.set(row.user_id, { overall: row.overall_score, level: row.maturity_level });
      }
    }

    const completedPurchaseUsers = new Set(
      (purchases.data ?? []).filter((p) => p.status === "completed").map((p) => p.user_id),
    );
    const activeSubUsers = new Set(
      (subs.data ?? [])
        .filter(
          (s) =>
            ["active", "trialing", "past_due"].includes(s.status) ||
            (s.status === "canceled" && s.current_period_end && new Date(s.current_period_end) > new Date()),
        )
        .map((s) => s.user_id),
    );

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const assessmentRows = assessments.data ?? [];
    const scoreValues = [...latestScoreByUser.values()].map((s) => s.overall);

    const userRows: AdminUserRow[] = users
      .map((u) => {
        const score = latestScoreByUser.get(u.id) ?? null;
        const tier: AdminUserRow["tier"] = activeSubUsers.has(u.id)
          ? "os"
          : completedPurchaseUsers.has(u.id)
            ? "blueprint"
            : "free";
        return {
          userId: u.id,
          email: u.email ?? "—",
          fullName: profileById.get(u.id)?.full_name ?? null,
          createdAt: u.created_at,
          organization: orgByOwner.get(u.id) ?? null,
          indexScore: score?.overall ?? null,
          maturityLevel: score?.level ?? null,
          tier,
          isAdmin: adminIds.has(u.id),
        };
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    const outboxCounts: Record<string, number> = {};
    for (const row of outbox.data ?? []) {
      outboxCounts[row.status] = (outboxCounts[row.status] ?? 0) + 1;
    }

    return {
      metrics: {
        users: users.length,
        newUsers7d: users.filter((u) => new Date(u.created_at).getTime() > weekAgo).length,
        assessmentsStarted: assessmentRows.length,
        assessmentsCompleted: assessmentRows.filter((a) => a.status === "completed").length,
        avgIndexScore: scoreValues.length
          ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
          : null,
        blueprintCustomers: completedPurchaseUsers.size,
        activeSubscriptions: activeSubUsers.size,
        revenueCents: (purchases.data ?? [])
          .filter((p) => p.status === "completed")
          .reduce((sum, p) => sum + (p.amount_cents ?? 0), 0),
        aiSessions: (sessions.data ?? []).length,
        documentsGenerated: (docs.data ?? []).length,
      },
      scoreDistribution: [1, 2, 3, 4, 5].map((level) => ({
        level,
        label: MATURITY_LABELS[level] ?? `Level ${level}`,
        count: [...latestScoreByUser.values()].filter((s) => s.level === level).length,
      })),
      users: userRows,
      outbox: (outbox.data ?? []).map((row) => ({
        id: row.id,
        provider: row.provider,
        eventName: row.event_name,
        status: row.status,
        attempts: row.attempts,
        lastError: row.last_error,
        nextAttemptAt: row.next_attempt_at,
        createdAt: row.created_at,
      })),
      outboxCounts,
    };
  });

/** Requeue a failed integration event for immediate retry. */
export const retryOutboxEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => {
    if (!data?.id || typeof data.id !== "string") throw new Error("id is required");
    return { id: data.id };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("integration_outbox")
      .update({ status: "pending", attempts: 0, next_attempt_at: new Date().toISOString(), last_error: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Whether the signed-in user holds the admin role. Safe for any signed-in user to call. */
export const getIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => ({ isAdmin: await isAdminContext(context as never) }));

/** Health of the CRM pipeline: what's connected, what's queued, what last shipped. */
export const getIntegrationsStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IntegrationsStatus> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { configuredProviders } = await import("@/lib/integrations/outbox.server");
    const { CONTACT_PROVIDERS } = await import("@/lib/integrations/types");

    const [statusRows, lastDelivered, qualified] = await Promise.all([
      supabaseAdmin.from("integration_outbox").select("status"),
      supabaseAdmin
        .from("integration_outbox")
        .select("processed_at")
        .eq("status", "delivered")
        .order("processed_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("customer_qualification")
        .select("user_id")
        .in("tier", ["lead", "marketing_qualified", "sales_qualified", "customer"]),
    ]);

    const counts: Record<string, number> = {};
    for (const row of statusRows.data ?? []) counts[row.status] = (counts[row.status] ?? 0) + 1;

    return {
      contactProviders: configuredProviders(CONTACT_PROVIDERS),
      counts,
      lastDeliveredAt: lastDelivered.data?.processed_at ?? null,
      qualifiedLeads: (qualified.data ?? []).length,
    };
  });

/** Queues a current-state CRM push for every qualified account. Safe to re-run. */
export const backfillCrmContacts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ queued: number; skipped: number }> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { enqueueContactSnapshot } = await import("@/lib/integrations/crm-sync.server");

    const { data: rows } = await supabaseAdmin
      .from("customer_qualification")
      .select("user_id, organization_id")
      .in("tier", ["lead", "marketing_qualified", "sales_qualified", "customer"]);

    let queued = 0;
    let skipped = 0;
    // Sequential: a backfill must not stampede the identity reads or the queue.
    for (const row of rows ?? []) {
      const result = await enqueueContactSnapshot(row.user_id, row.organization_id ?? null);
      if (result.queued) queued += 1;
      else skipped += 1;
    }
    return { queued, skipped };
  });

/** Runs the outbox dispatcher immediately instead of waiting for the 5-minute schedule. */
export const dispatchOutboxNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { dispatchOutbox } = await import("@/lib/integrations/outbox.server");
    return await dispatchOutbox();
  });

