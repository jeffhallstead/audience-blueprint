import type { IntegrationAdapter, IntegrationEvent } from "./types";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/hubspot";

function config() {
  return {
    lovableKey: process.env["LOVABLE_API_KEY"],
    connectionKey: process.env["HUBSPOT_API_KEY"],
  };
}

function headers(lovableKey: string, connectionKey: string) {
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
    "Content-Type": "application/json",
  };
}

/** HubSpot contact properties. Only default properties are used so no custom
 *  schema setup is required before the first sync. */
function toProperties(event: IntegrationEvent): Record<string, string> {
  const props: Record<string, string> = {};
  if (event.email) props["email"] = event.email;
  if (event.fullName) {
    const [first, ...rest] = event.fullName.trim().split(/\s+/);
    if (first) props["firstname"] = first;
    if (rest.length) props["lastname"] = rest.join(" ");
  }
  if (event.organization) props["company"] = event.organization;
  const notes = [
    `Event: ${event.eventName}`,
    typeof event.score === "number" ? `Publisher Index: ${event.score}` : null,
    event.maturityLevel ? `Maturity: ${event.maturityLevel}` : null,
    event.tier ? `Tier: ${event.tier}` : null,
  ].filter(Boolean);
  props["hs_content_membership_notes"] = notes.join(" | ");
  return props;
}

async function findContactId(
  email: string,
  lovableKey: string,
  connectionKey: string,
): Promise<string | null> {
  const response = await fetch(`${GATEWAY_URL}/crm/v3/objects/contacts/search`, {
    method: "POST",
    headers: headers(lovableKey, connectionKey),
    body: JSON.stringify({
      filterGroups: [
        { filters: [{ propertyName: "email", operator: "EQ", value: email }] },
      ],
      properties: ["email"],
      limit: 1,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HubSpot search failed [${response.status}]: ${body}`);
  }
  const json = (await response.json()) as { results?: Array<{ id: string }> };
  return json.results?.[0]?.id ?? null;
}

export const hubspotAdapter: IntegrationAdapter = {
  provider: "hubspot",

  isConfigured() {
    const c = config();
    return Boolean(c.lovableKey && c.connectionKey);
  },

  async send(event) {
    const c = config();
    if (!c.lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
    if (!c.connectionKey) throw new Error("HUBSPOT_API_KEY is not configured");
    if (!event.email) throw new Error("HubSpot sync requires an email address");

    const properties = toProperties(event);
    const existingId = await findContactId(event.email, c.lovableKey, c.connectionKey);

    const url = existingId
      ? `${GATEWAY_URL}/crm/v3/objects/contacts/${existingId}`
      : `${GATEWAY_URL}/crm/v3/objects/contacts`;

    const response = await fetch(url, {
      method: existingId ? "PATCH" : "POST",
      headers: headers(c.lovableKey, c.connectionKey),
      body: JSON.stringify({ properties }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HubSpot upsert failed [${response.status}]: ${body}`);
    }
  },
};
