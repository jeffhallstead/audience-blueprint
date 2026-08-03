import { supabase } from "@/integrations/supabase/client";
import {
  ORG_FIELDS,
  computeCompleteness,
  normalizeDomain,
  type OrgProfilePatch,
  type OrganizationProfile,
} from "./profile-schema";

const SELECT_COLUMNS =
  "id, name, website, industry, revenue_range, team_size, region, business_model, marketer_count, domain, profile_completeness";

/** The organization the signed-in user belongs to, or null before intake. */
export async function fetchMyOrganization(userId: string): Promise<OrganizationProfile | null> {
  const { data: membership, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (memberError) throw memberError;

  const query = supabase.from("organizations").select(SELECT_COLUMNS);
  const { data, error } = membership
    ? await query.eq("id", membership.organization_id).maybeSingle()
    : await query.eq("owner_id", userId).order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (error) throw error;
  return (data as OrganizationProfile | null) ?? null;
}

/** Creates the organization + membership on first intake. Idempotent per user. */
export async function createOrganization(userId: string, patch: OrgProfilePatch): Promise<OrganizationProfile> {
  const existing = await fetchMyOrganization(userId);
  if (existing) return updateOrganization(userId, existing, patch);

  const row = buildRow(patch);
  const { data, error } = await supabase
    .from("organizations")
    .insert({ ...row, owner_id: userId, name: String(patch.name ?? "").trim() || "Untitled organization" })
    .select(SELECT_COLUMNS)
    .single();
  if (error) throw error;

  const org = data as OrganizationProfile;
  await supabase
    .from("organization_members")
    .upsert({ organization_id: org.id, user_id: userId, role: "owner" }, { onConflict: "user_id" });
  await writeAudit(
    org.id,
    userId,
    ORG_FIELDS.filter((field) => patch[field.id] !== undefined).map((field) => ({
      field: field.id,
      oldValue: null,
      newValue: patch[field.id] ?? null,
    })),
  );
  return org;
}

/** Applies a patch and records one audit row per changed field. */
export async function updateOrganization(
  userId: string,
  current: OrganizationProfile,
  patch: OrgProfilePatch,
): Promise<OrganizationProfile> {
  const merged = { ...current, ...normalizePatch(patch) } as OrganizationProfile;
  const row = buildRow(merged);

  const { data, error } = await supabase
    .from("organizations")
    .update(row)
    .eq("id", current.id)
    .select(SELECT_COLUMNS)
    .single();
  if (error) throw error;

  const changes = ORG_FIELDS.filter((field) => patch[field.id] !== undefined)
    .map((field) => ({
      field: field.id as string,
      oldValue: current[field.id] ?? null,
      newValue: merged[field.id] ?? null,
    }))
    .filter((change) => String(change.oldValue ?? "") !== String(change.newValue ?? ""));
  await writeAudit(current.id, userId, changes);

  return data as OrganizationProfile;
}

export interface OrgAuditEntry {
  id: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export async function fetchOrganizationAudit(organizationId: string, limit = 20): Promise<OrgAuditEntry[]> {
  const { data, error } = await supabase
    .from("organization_audit")
    .select("id, field, old_value, new_value, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

function normalizePatch(patch: OrgProfilePatch): OrgProfilePatch {
  const next: OrgProfilePatch = {};
  for (const field of ORG_FIELDS) {
    if (patch[field.id] === undefined) continue;
    const raw = patch[field.id];
    if (field.type === "number") {
      const parsed = raw === null || raw === "" ? null : Number(raw);
      next[field.id] = parsed === null || Number.isNaN(parsed) ? null : parsed;
    } else {
      const value = String(raw ?? "").trim();
      next[field.id] = value === "" ? null : value;
    }
  }
  return next;
}

interface OrgRow {
  name?: string;
  website?: string | null;
  industry?: string | null;
  revenue_range?: string | null;
  team_size?: string | null;
  region?: string | null;
  business_model?: string | null;
  marketer_count?: number | null;
  domain: string | null;
  profile_completeness: number;
  updated_at: string;
}

function buildRow(profile: OrgProfilePatch): OrgRow {
  const n = normalizePatch(profile);
  const text = (value: string | number | null | undefined) =>
    value === undefined ? undefined : ((value as string | null) ?? null);

  const row: OrgRow = {
    domain: normalizeDomain(n.website as string | null),
    profile_completeness: computeCompleteness(n as Partial<OrganizationProfile>),
    updated_at: new Date().toISOString(),
  };
  if (n.name !== undefined) row.name = String(n.name ?? "").trim() || "Untitled organization";
  if (n.website !== undefined) row.website = text(n.website)!;
  if (n.industry !== undefined) row.industry = text(n.industry)!;
  if (n.revenue_range !== undefined) row.revenue_range = text(n.revenue_range)!;
  if (n.team_size !== undefined) row.team_size = text(n.team_size)!;
  if (n.region !== undefined) row.region = text(n.region)!;
  if (n.business_model !== undefined) row.business_model = text(n.business_model)!;
  if (n.marketer_count !== undefined) row.marketer_count = n.marketer_count === null ? null : Number(n.marketer_count);
  return row;
}

/** Audit writes are best-effort — they must never block a profile save. */
async function writeAudit(
  organizationId: string,
  actorId: string,
  changes: { field: string; oldValue: unknown; newValue: unknown }[],
) {
  if (!changes.length) return;
  try {
    await supabase.from("organization_audit").insert(
      changes.map((change) => ({
        organization_id: organizationId,
        actor_id: actorId,
        field: change.field,
        old_value: change.oldValue === null || change.oldValue === undefined ? null : String(change.oldValue),
        new_value: change.newValue === null || change.newValue === undefined ? null : String(change.newValue),
      })),
    );
  } catch {
    /* audit is observability, not a gate */
  }
}
