import type { IntegrationAdapter, IntegrationEvent } from "./types";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/airtable";

/** Accepts a bare base id, a "baseId/tableId" pair, or a full Airtable URL. */
function parseBaseRef(raw: string | undefined) {
  if (!raw) return { baseId: undefined as string | undefined, tableId: undefined as string | undefined };
  return {
    baseId: raw.match(/app[A-Za-z0-9]{14}/)?.[0],
    tableId: raw.match(/tbl[A-Za-z0-9]{14}/)?.[0],
  };
}

function config() {
  const ref = parseBaseRef(process.env["AIRTABLE_BASE_ID"]);
  const rawTable = process.env["AIRTABLE_TABLE_NAME"]?.trim();
  return {
    lovableKey: process.env["LOVABLE_API_KEY"],
    connectionKey: process.env["AIRTABLE_API_KEY"],
    baseId: ref.baseId,
    // A table id from the base ref wins only when no explicit table name is set.
    tableName: rawTable || ref.tableId || "Publisher Blueprint Contacts",
  };
}


/** Feedback lands in its own table so the free-text comment has a home. */
const FEEDBACK_TABLE = "Publisher Blueprint Feedback";

function tableFor(event: IntegrationEvent, defaultTable: string) {
  return event.eventName === "feedback.submitted" ? FEEDBACK_TABLE : defaultTable;
}

/** Maps a normalized event onto Airtable field names. Unknown fields are dropped by Airtable
 *  only when typecast is off, so we keep the field set intentionally small and stable. */
function toFields(event: IntegrationEvent): Record<string, unknown> {
  if (event.eventName === "feedback.submitted") {
    const meta = (event.metadata ?? {}) as { sentiment?: string; comment?: string; page?: string | null };
    return {
      Email: event.email ?? "",
      Name: event.fullName ?? "",
      Sentiment: meta.sentiment ?? "",
      Comment: meta.comment ?? "",
      Page: meta.page ?? "",
      "Occurred At": event.occurredAt,
    };
  }
  const fields: Record<string, unknown> = {
    Email: event.email ?? "",
    Name: event.fullName ?? "",
    Event: event.eventName,
    "Occurred At": event.occurredAt,
  };
  if (event.organization) fields["Organization"] = event.organization;
  if (typeof event.score === "number") fields["Publisher Index"] = event.score;
  if (event.maturityLevel) fields["Maturity Level"] = event.maturityLevel;
  if (event.tier) fields["Tier"] = event.tier;
  if (typeof event.amount === "number") fields["Amount"] = event.amount;
  if (event.currency) fields["Currency"] = event.currency;
  return fields;
}

export const airtableAdapter: IntegrationAdapter = {
  provider: "airtable",

  isConfigured() {
    const c = config();
    return Boolean(c.lovableKey && c.connectionKey && c.baseId);
  },

  async send(event) {
    const c = config();
    if (!c.lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
    if (!c.connectionKey) throw new Error("AIRTABLE_API_KEY is not configured");
    if (!c.baseId) throw new Error("AIRTABLE_BASE_ID is not configured");

    const url = `${GATEWAY_URL}/v0/${c.baseId}/${encodeURIComponent(tableFor(event, c.tableName))}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.lovableKey}`,
        "X-Connection-Api-Key": c.connectionKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [{ fields: toFields(event) }],
        typecast: true,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Airtable request failed [${response.status}]: ${body}`);
    }
  },
};
