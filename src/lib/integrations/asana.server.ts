import type { ExportRow } from "@/lib/export/rows";
import type { IntegrationAdapter } from "./types";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/asana";

function config() {
  return {
    lovableKey: process.env["LOVABLE_API_KEY"],
    connectionKey: process.env["ASANA_API_KEY"],
  };
}

function headers(lovableKey: string, connectionKey: string) {
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
    "Content-Type": "application/json",
  };
}

/** Month N in the roadmap maps to a due date N months out. */
function dueOn(row: ExportRow): string | undefined {
  const month = row.Phase.match(/Month\s*(\d)/i)?.[1];
  if (!month) return undefined;
  const date = new Date();
  date.setMonth(date.getMonth() + Number(month));
  return date.toISOString().slice(0, 10);
}

function notes(row: ExportRow): string {
  return [
    row.Detail,
    "",
    `Type: ${row.Type}`,
    row.Category ? `Category: ${row.Category}` : null,
    row.Impact ? `Impact: ${row.Impact}` : null,
    row.Effort ? `Effort: ${row.Effort}` : null,
    row.Phase ? `Phase: ${row.Phase}` : null,
    `Source: ${row.Source} (${row.Key})`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

/** Creates one Asana task per exported Blueprint row. */
export const asanaAdapter: IntegrationAdapter = {
  provider: "asana",

  isConfigured() {
    const c = config();
    return Boolean(c.lovableKey && c.connectionKey);
  },

  async send(event) {
    const c = config();
    if (!c.lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
    if (!c.connectionKey) throw new Error("ASANA_API_KEY is not configured");

    const projectId = event.target?.asanaProjectId?.trim();
    if (!projectId) throw new Error("No Asana project selected for this export");

    const rows = event.records ?? [];
    for (const row of rows) {
      const response = await fetch(`${GATEWAY_URL}/api/1.0/tasks`, {
        method: "POST",
        headers: headers(c.lovableKey, c.connectionKey),
        body: JSON.stringify({
          data: {
            name: row.Title.slice(0, 250),
            notes: notes(row),
            projects: [projectId],
            ...(dueOn(row) ? { due_on: dueOn(row) } : {}),
            completed: row.Status === "Done",
          },
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Asana task create failed [${response.status}]: ${body}`);
      }
    }
  },
};

/** Projects the connected Asana account can write to, for the target picker. */
export async function listAsanaProjects(): Promise<Array<{ id: string; name: string }>> {
  const c = config();
  if (!c.lovableKey || !c.connectionKey) return [];

  const response = await fetch(`${GATEWAY_URL}/api/1.0/projects?limit=100&opt_fields=gid,name`, {
    headers: headers(c.lovableKey, c.connectionKey),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Asana project list failed [${response.status}]: ${body}`);
  }
  const json = (await response.json()) as { data?: Array<{ gid: string; name: string }> };
  return (json.data ?? []).map((project) => ({ id: project.gid, name: project.name }));
}
