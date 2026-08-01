import type { ExportRow } from "@/lib/export/rows";
import type { IntegrationAdapter, IntegrationEvent } from "./types";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/airtable";

const DEFAULT_TABLE = "Publisher Blueprint Actions";

function parseBaseRef(raw: string | undefined) {
  if (!raw) return { baseId: undefined as string | undefined };
  return { baseId: raw.match(/app[A-Za-z0-9]{14}/)?.[0] };
}

function config() {
  return {
    lovableKey: process.env["LOVABLE_API_KEY"],
    connectionKey: process.env["AIRTABLE_API_KEY"],
    baseId: parseBaseRef(process.env["AIRTABLE_BASE_ID"]).baseId,
  };
}

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

/**
 * Pushes exported Blueprint rows into an Airtable table (separate from the
 * contacts sync). Upserts on the stable `Key` field so re-exporting a plan
 * updates the existing rows instead of duplicating them.
 */
export const airtableRecordsAdapter: IntegrationAdapter = {
  provider: "airtable_records",

  isConfigured() {
    const c = config();
    return Boolean(c.lovableKey && c.connectionKey && c.baseId);
  },

  async send(event) {
    const c = config();
    if (!c.lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
    if (!c.connectionKey) throw new Error("AIRTABLE_API_KEY is not configured");
    if (!c.baseId) throw new Error("AIRTABLE_BASE_ID is not configured");

    const rows = event.records ?? [];
    if (rows.length === 0) return;

    const table = event.target?.airtableTable?.trim() || DEFAULT_TABLE;
    const url = `${GATEWAY_URL}/v0/${c.baseId}/${encodeURIComponent(table)}`;

    for (const batch of chunk(rows, 10)) {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${c.lovableKey}`,
          "X-Connection-Api-Key": c.connectionKey,
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
