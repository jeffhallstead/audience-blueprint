/**
 * Admin visibility surfaces (E7): organization browser, platform event monitor
 * and audit log. Read-only, admin-gated, service-role reads.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  assertAdmin,
  type AdminAuditRow,
  type AdminEventFeed,
  type AdminOrgDetail,
  type AdminOrgRow,
} from "@/lib/admin/shared";

/** Maps auth user ids to emails for the ids we actually render. */
async function emailMap(ids: (string | null)[]): Promise<Map<string, string>> {
  const wanted = new Set(ids.filter((id): id is string => Boolean(id)));
  if (wanted.size === 0) return new Map();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const map = new Map<string, string>();
  for (const user of data?.users ?? []) {
    if (user.email && wanted.has(user.id)) map.set(user.id, user.email);
  }
  return map;
}

/** Organization browser with a name / domain / owner-email search. */
export const searchOrganizations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { query?: string } | undefined) => ({
    query: (input?.query ?? "").trim().slice(0, 120),
  }))
  .handler(async ({ data, context }): Promise<AdminOrgRow[]> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let request = supabaseAdmin
      .from("organizations")
      .select(
        "id, name, owner_id, domain, industry, region, business_model, revenue_range, team_size, profile_completeness, archived_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (data.query) {
      const term = `%${data.query}%`;
      request = request.or(`name.ilike.${term},domain.ilike.${term},website.ilike.${term}`);
    }

    const [{ data: orgs }, { data: members }] = await Promise.all([
      request,
      supabaseAdmin.from("organization_members").select("organization_id"),
    ]);

    const memberCounts = new Map<string, number>();
    for (const row of members ?? []) {
      memberCounts.set(row.organization_id, (memberCounts.get(row.organization_id) ?? 0) + 1);
    }
    const emails = await emailMap((orgs ?? []).map((o) => o.owner_id));

    const rows: AdminOrgRow[] = (orgs ?? []).map((o) => ({
      id: o.id,
      name: o.name,
      ownerId: o.owner_id,
      ownerEmail: emails.get(o.owner_id) ?? null,
      domain: o.domain,
      industry: o.industry,
      region: o.region,
      businessModel: o.business_model,
      revenueRange: o.revenue_range,
      teamSize: o.team_size,
      completeness: o.profile_completeness ?? 0,
      memberCount: memberCounts.get(o.id) ?? 0,
      archivedAt: o.archived_at,
      createdAt: o.created_at,
    }));

    // Owner email isn't searchable in SQL (it lives in auth), so filter here.
    if (!data.query) return rows;
    const needle = data.query.toLowerCase();
    const matched = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(needle) ||
        (r.domain ?? "").toLowerCase().includes(needle) ||
        (r.ownerEmail ?? "").toLowerCase().includes(needle),
    );
    return matched.length > 0 ? matched : rows;
  });

/** Full profile, members, audit trail and assessments for one organization. */
export const getOrganizationDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { organizationId: string }) => {
    if (!input?.organizationId) throw new Error("organizationId is required");
    return { organizationId: input.organizationId };
  })
  .handler(async ({ data, context }): Promise<AdminOrgDetail> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: org }, { data: members }, { data: audit }, { data: assessments }] =
      await Promise.all([
        supabaseAdmin
          .from("organizations")
          .select(
            "id, name, owner_id, domain, industry, region, business_model, revenue_range, team_size, profile_completeness, archived_at, created_at",
          )
          .eq("id", data.organizationId)
          .maybeSingle(),
        supabaseAdmin
          .from("organization_members")
          .select("user_id, role, created_at")
          .eq("organization_id", data.organizationId),
        supabaseAdmin
          .from("organization_audit")
          .select("id, organization_id, actor_id, field, old_value, new_value, created_at")
          .eq("organization_id", data.organizationId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabaseAdmin
          .from("assessments")
          .select("id, status, created_at, completed_at")
          .eq("organization_id", data.organizationId)
          .order("created_at", { ascending: false })
          .limit(25),
      ]);

    if (!org) throw new Error("Organization not found");

    const scoreRes = await supabaseAdmin
      .from("assessment_scores")
      .select("assessment_id, overall_score, maturity_level")
      .in("assessment_id", (assessments ?? []).map((a) => a.id));
    const scoreByAssessment = new Map(
      (scoreRes.data ?? []).map((s) => [s.assessment_id, s]),
    );

    const emails = await emailMap([
      org.owner_id,
      ...(members ?? []).map((m) => m.user_id),
      ...(audit ?? []).map((a) => a.actor_id),
    ]);

    return {
      organization: {
        id: org.id,
        name: org.name,
        ownerId: org.owner_id,
        ownerEmail: emails.get(org.owner_id) ?? null,
        domain: org.domain,
        industry: org.industry,
        region: org.region,
        businessModel: org.business_model,
        revenueRange: org.revenue_range,
        teamSize: org.team_size,
        completeness: org.profile_completeness ?? 0,
        memberCount: (members ?? []).length,
        archivedAt: org.archived_at,
        createdAt: org.created_at,
      },
      members: (members ?? []).map((m) => ({
        userId: m.user_id,
        email: emails.get(m.user_id) ?? null,
        role: m.role,
        createdAt: m.created_at,
      })),
      audit: (audit ?? []).map((a) => ({
        id: a.id,
        organizationId: a.organization_id,
        organizationName: org.name,
        actorId: a.actor_id,
        actorEmail: a.actor_id ? (emails.get(a.actor_id) ?? null) : null,
        field: a.field,
        oldValue: a.old_value,
        newValue: a.new_value,
        createdAt: a.created_at,
      })),
      assessments: (assessments ?? []).map((a) => ({
        id: a.id,
        status: a.status,
        overallScore: scoreByAssessment.get(a.id)?.overall_score ?? null,
        maturityLevel: scoreByAssessment.get(a.id)?.maturity_level ?? null,
        createdAt: a.created_at,
        completedAt: a.completed_at,
      })),
    };
  });

/** Live monitor over the canonical event stream. */
export const listPlatformEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { eventType?: string | undefined; search?: string | undefined; hours?: number | undefined } | undefined) => ({
      eventType: input?.eventType?.trim() || null,
      search: (input?.search ?? "").trim().slice(0, 120),
      hours: Math.min(Math.max(input?.hours ?? 168, 1), 24 * 90),
    }),
  )
  .handler(async ({ data, context }): Promise<AdminEventFeed> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date(Date.now() - data.hours * 3_600_000).toISOString();
    let request = supabaseAdmin
      .from("platform_events")
      .select("id, event_type, user_id, organization_id, source, environment, occurred_at, payload")
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
      .limit(150);
    if (data.eventType) request = request.eq("event_type", data.eventType);

    const [{ data: events }, { data: typeRows }] = await Promise.all([
      request,
      supabaseAdmin.from("platform_events").select("event_type").gte("occurred_at", since).limit(5000),
    ]);

    const counts = new Map<string, number>();
    for (const row of typeRows ?? []) {
      counts.set(row.event_type, (counts.get(row.event_type) ?? 0) + 1);
    }

    const emails = await emailMap((events ?? []).map((e) => e.user_id));
    let rows = (events ?? []).map((e) => ({
      id: e.id,
      eventType: e.event_type,
      userId: e.user_id,
      userEmail: e.user_id ? (emails.get(e.user_id) ?? null) : null,
      organizationId: e.organization_id,
      source: e.source,
      environment: e.environment,
      occurredAt: e.occurred_at,
      payloadJson: JSON.stringify(e.payload ?? {}),
    }));

    if (data.search) {
      const needle = data.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.eventType.toLowerCase().includes(needle) ||
          (r.userEmail ?? "").toLowerCase().includes(needle),
      );
    }

    return {
      events: rows,
      types: [...counts.entries()]
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
    };
  });

/** Cross-organization audit trail. */
export const listOrganizationAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string } | undefined) => ({
    search: (input?.search ?? "").trim().slice(0, 120),
  }))
  .handler(async ({ data, context }): Promise<AdminAuditRow[]> => {
    await assertAdmin(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: audit }, { data: orgs }] = await Promise.all([
      supabaseAdmin
        .from("organization_audit")
        .select("id, organization_id, actor_id, field, old_value, new_value, created_at")
        .order("created_at", { ascending: false })
        .limit(150),
      supabaseAdmin.from("organizations").select("id, name"),
    ]);

    const orgNames = new Map((orgs ?? []).map((o) => [o.id, o.name]));
    const emails = await emailMap((audit ?? []).map((a) => a.actor_id));

    const rows: AdminAuditRow[] = (audit ?? []).map((a) => ({
      id: a.id,
      organizationId: a.organization_id,
      organizationName: orgNames.get(a.organization_id) ?? null,
      actorId: a.actor_id,
      actorEmail: a.actor_id ? (emails.get(a.actor_id) ?? null) : null,
      field: a.field,
      oldValue: a.old_value,
      newValue: a.new_value,
      createdAt: a.created_at,
    }));

    if (!data.search) return rows;
    const needle = data.search.toLowerCase();
    return rows.filter(
      (r) =>
        (r.organizationName ?? "").toLowerCase().includes(needle) ||
        r.field.toLowerCase().includes(needle) ||
        (r.actorEmail ?? "").toLowerCase().includes(needle),
    );
  });
