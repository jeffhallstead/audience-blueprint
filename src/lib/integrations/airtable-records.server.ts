import type { ExportRow } from "@/lib/export/rows";
import { getUserCredential } from "./credentials.server";
import type { IntegrationAdapter, IntegrationEvent } from "./types";

const AIRTABLE_API = "https://api.airtable.com";

const DEFAULT_TABLE = "Publisher Blueprint Actions";

function toFields(row: ExportRow): Record<string, unknown> {
  return {
    Key: row.Key,
    Type: row.Type,
    Category: row.Category,
    Title: row.Title,
    Detail: row.Detail,
    Impact: row.Impact,
    Effort: row.Effort,
    Phase: row.Phase,
    Owner: row.Owner,
    Status: row.Status,
    Source: row.Source,
    Created: row.Created,
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Bases the user's own personal access token can reach. */
export async function listAirtableBases(token: string): Promise<Array<{ id: string; name: string }>> {
  const response = await fetch(`${AIRTABLE_API}/v0/meta/bases`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Airtable base list failed [${response.status}]: ${await response.text()}`);
  }
  const json = (await response.json()) as { bases?: Array<{ id: string; name: string }> };
  return (json.bases ?? []).map((base) => ({ id: base.id, name: base.name }));
}

/**
 * Pushes exported Blueprint rows into the user's own Airtable base, using the
 * personal access token they connected. Upserts on the stable `Key` field so
 * re-exporting a plan updates the existing rows instead of duplicating them.
 */
export const airtableRecordsAdapter: IntegrationAdapter = {
  provider: "airtable_records",

  // Credentials are per user, so availability is decided per event.
  isConfigured() {
    return true;
  },

  async isConfiguredForUser(userId) {
    const credential = await getUserCredential(userId, "airtable");
    return Boolean(credential?.token && credential.airtableBaseId);
  },

  async send(event) {
    const credential = await getUserCredential(event.userId, "airtable");
    if (!credential?.token) throw new Error("This user has not connected Airtable");
    const baseId = credential.airtableBaseId;
    if (!baseId) throw new Error("No Airtable base selected");

    const rows = event.records ?? [];
    if (rows.length === 0) return;

    const table = event.target?.airtableTable?.trim() || DEFAULT_TABLE;
    const url = `${AIRTABLE_API}/v0/${baseId}/${encodeURIComponent(table)}`;

    for (const batch of chunk(rows, 10)) {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${credential.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          performUpsert: { fieldsToMergeOn: ["Key"] },
          records: batch.map((row) => ({ fields: toFields(row) })),
          typecast: true,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Airtable export failed [${response.status}]: ${body}`);
      }
    }
  },
};

export type { IntegrationEvent };
