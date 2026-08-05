/**
 * Admin lead workbench: read qualified leads and track outreach status.
 *
 * The lead_outreach table is intentionally separate from customer_qualification:
 * qualification tiers are derived from events and rescored, while outreach status
 * is an operator-managed signal that must survive recomputation.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin, type AdminLeadFeed, type AdminLeadRow } from "@/lib/admin/shared";
import type { Database } from "@/integrations/supabase/types";

type LeadStatus = Database["public"]["Enums"]["lead_outreach_status"];

const LEAD_TIERS = ["marketing_qualified", "sales_qualified", "customer"] as const;

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  responded: "Responded",
  meeting_booked: "Meeting booked",
  no_fit: "No fit",
  nurtured: "Nurtured",
};

/** Returns every lead-qualified account plus outreach status. Admin role required. */
export const getQualifiedLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (
      input:
        | {
            tier?: string | null;
            status?: string | null;
            search?: string | null;
            limit?: number;
            offset?: number;
          }
        | undefined,
    ) => ({
      tier: input?.tier?.trim() || null,
      status: input?.status?.trim() || null,
      search: (input?.search ?? "").trim().slice(0, 120),
      limit: Math.min(Math.max(input?.limit ?? 100, 1), 250),
      offset: Math.max(input?.offset ?? 0, 0),
    }),
  )
  .handler(async ({ data, context }): Promise<AdminLeadFeed> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const leadTiers: Database["public"]["Enums"]["qualification_tier"][] = [
      "marketing_qualified",
      "sales_qualified",
      "customer",
    ];
    let request = supabaseAdmin
      .from("customer_qualification")
      .select("*")
      .in("tier", leadTiers)
      .order("total_score", { ascending: false });



    if (data.tier) request = request.eq("tier", data.tier as Database["public"]["Enums"]["qualification_tier"]);
    const { data: qualifications } = await request;


    const userIds = (qualifications ?? []).map((q) => q.user_id);
    if (userIds.length === 0) return { leads: [], count: 0 };

    const [
      { data: profiles },
      { data: orgs },
      { data: scores },
      { data: outreachRows },
      { data: lifecycleRows },
      authUsersRes,
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds),
      supabaseAdmin.from("organizations").select("id, owner_id, name, domain"),
      supabaseAdmin
        .from("assessment_scores")
        .select("user_id, overall_score, maturity_level")
        .in("user_id", userIds)
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("lead_outreach").select("*").in("user_id", userIds),
      supabaseAdmin.from("customer_lifecycle").select("user_id, stage").in("user_id", userIds),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    ]);

    const emailById = new Map((authUsersRes.data?.users ?? []).map((u) => [u.id, u.email]));
    const profileById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    const outreachById = new Map((outreachRows ?? []).map((o) => [o.user_id, o]));
    const lifecycleById = new Map((lifecycleRows ?? []).map((l) => [l.user_id, l.stage]));

    const orgById = new Map((orgs ?? []).map((o) => [o.id, o]));
    const orgByOwner = new Map((orgs ?? []).map((o) => [o.owner_id, o]));
    const latestScoreByUser = new Map<string, { overall: number; level: number }>();
    for (const row of scores ?? []) {
      if (!latestScoreByUser.has(row.user_id)) {
        latestScoreByUser.set(row.user_id, { overall: row.overall_score, level: row.maturity_level });
      }
    }

    let leads: AdminLeadRow[] = (qualifications ?? []).map((q) => {
      const org = q.organization_id ? orgById.get(q.organization_id) : orgByOwner.get(q.user_id);
      const outreach = outreachById.get(q.user_id);
      const score = latestScoreByUser.get(q.user_id);
      const signals = (q.signals ?? {}) as {
        fit?: { label: string; points: number }[];
        engagement?: { label: string; points: number }[];
      };
      return {
        userId: q.user_id,
        email: emailById.get(q.user_id) ?? null,
        fullName: profileById.get(q.user_id) ?? null,
        organizationId: org?.id ?? null,
        organizationName: org?.name ?? null,
        domain: org?.domain ?? null,
        tier: q.tier,
        fitScore: q.fit_score,
        engagementScore: q.engagement_score,
        totalScore: q.total_score,
        indexScore: score?.overall ?? null,
        maturityLevel: score?.level ?? null,
        reason: q.tier_reason,
        signals: [...(signals.fit ?? []), ...(signals.engagement ?? [])],
        outreachStatus: outreach?.status ?? "new",
        notes: outreach?.notes ?? null,
        lastContactedAt: outreach?.last_contacted_at ?? null,
        scoredAt: q.scored_at,
        lifecycleStage: lifecycleById.get(q.user_id) ?? null,
      };
    });

    if (data.status) {
      leads = leads.filter((l) => (l.outreachStatus === data.status ? true : false));
    }

    if (data.search) {
      const needle = data.search.toLowerCase();
      leads = leads.filter(
        (l) =>
          (l.email ?? "").toLowerCase().includes(needle) ||
          (l.fullName ?? "").toLowerCase().includes(needle) ||
          (l.organizationName ?? "").toLowerCase().includes(needle) ||
          (l.domain ?? "").toLowerCase().includes(needle) ||
          (l.reason ?? "").toLowerCase().includes(needle),
      );
    }

    const count = leads.length;
    const page = leads.slice(data.offset, data.offset + data.limit);
    return { leads: page, count };
  });

/** Update the outreach status and notes for a qualified lead. Admin role required. */
export const updateLeadOutreach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (
      input: {
        userId: string;
        status?: string;
        notes?: string;
        lastContactedAt?: string | null;
      } | null,
    ) => {
      if (!input?.userId) throw new Error("userId is required");
      const status = input.status?.trim() ?? "new";
      if (!Object.keys(STATUS_LABEL).includes(status)) {
        throw new Error(`Invalid outreach status: ${status}`);
      }
      return {
        userId: input.userId,
        status: status as LeadStatus,
        notes: (input.notes ?? "").slice(0, 2000),
        lastContactedAt: input.lastContactedAt ?? null,
      };
    },
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const update: {
      status: LeadStatus;
      notes: string;
      last_contacted_at?: string | null;
      updated_at: string;
    } = {
      status: data.status,
      notes: data.notes,
      updated_at: new Date().toISOString(),
    };
    if (data.lastContactedAt || data.status === "contacted" || data.status === "meeting_booked") {
      update.last_contacted_at = data.lastContactedAt ?? new Date().toISOString();
    }

    const { error } = await supabaseAdmin.from("lead_outreach").upsert(
      {
        user_id: data.userId,
        ...update,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
