import { supabase } from "@/integrations/supabase/client";

import {
  EMPTY_EXTENDED_STATE,
  EXTENDED_PROFILE_GROUPS,
  type ExtendedProfileGroup,
  type ExtendedProfileState,
  type ExtendedProfileValues,
} from "./extended-profiles";

const NON_COLUMN_KEYS = new Set(["id", "organization_id", "version", "created_at", "updated_at"]);

/** Loads all three extended profiles for an organization. Missing rows are empty. */
export async function fetchExtendedProfiles(organizationId: string): Promise<ExtendedProfileState> {
  const state: ExtendedProfileState = {
    audience: {},
    marketing: {},
    content_ops: {},
  };

  await Promise.all(
    EXTENDED_PROFILE_GROUPS.map(async (group) => {
      const { data, error } = await supabase
        .from(group.table)
        .select("*")
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return;
      const row = data as Record<string, unknown>;
      const values: ExtendedProfileValues = {};
      for (const field of group.fields) {
        const raw = row[field.id];
        if (raw === null || raw === undefined) continue;
        values[field.id] = raw as string | number | string[];
      }
      state[group.key] = values;
    }),
  );

  return state;
}

/** Upserts one extended profile group. Values are normalized to column types. */
export async function saveExtendedProfile(
  organizationId: string,
  group: ExtendedProfileGroup,
  values: ExtendedProfileValues,
): Promise<void> {
  const row: Record<string, unknown> = { organization_id: organizationId };

  for (const field of group.fields) {
    if (NON_COLUMN_KEYS.has(field.id)) continue;
    const raw = values[field.id];
    if (field.type === "multiselect") {
      row[field.id] = Array.isArray(raw) ? raw : [];
    } else if (field.type === "number") {
      const parsed = raw === null || raw === undefined || raw === "" ? null : Number(raw);
      row[field.id] = parsed === null || Number.isNaN(parsed) ? null : parsed;
    } else {
      const text = raw === null || raw === undefined ? "" : String(raw).trim();
      row[field.id] = text === "" ? null : text;
    }
  }

  const { error } = await supabase
    .from(group.table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(row as any, { onConflict: "organization_id" });
  if (error) throw error;
}

export { EMPTY_EXTENDED_STATE };
