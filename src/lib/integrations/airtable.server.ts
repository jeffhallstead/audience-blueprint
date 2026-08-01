import type { IntegrationAdapter, IntegrationEvent } from "./types";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/airtable";

function config() {
  return {
    lovableKey: process.env["LOVABLE_API_KEY"],
    connectionKey: process.env["AIRTABLE_API_KEY"],
    baseId: process.env["AIRTABLE_BASE_ID"],
    tableName: process.env["AIRTABLE_TABLE_NAME"] ?? "Publisher Blueprint Contacts",
  };
}

/** Maps a normalized event onto Airtable field names. Unknown fields are dropped by Airtable
 *  only when typecast is off, so we keep the field set intentionally small and stable. */
function toFields(event: IntegrationEvent): Record<string, unknown> {
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

    const url = `${GATEWAY_URL}/v0/${c.baseId}/${encodeURIComponent(c.tableName)}`;
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
