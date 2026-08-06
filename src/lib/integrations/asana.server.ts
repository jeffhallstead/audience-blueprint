import type { ExportRow } from "@/lib/export/rows";
import { getUserCredential } from "./credentials.server";
import type { IntegrationAdapter } from "./types";

const ASANA_API = "https://app.asana.com/api/1.0";

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
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

/** Creates one Asana task per exported Blueprint row, in the user's own account. */
export const asanaAdapter: IntegrationAdapter = {
  provider: "asana",

  // Credentials are per user, so availability is decided per event.
  isConfigured() {
    return true;
  },

  async isConfiguredForUser(userId) {
    const credential = await getUserCredential(userId, "asana");
    return Boolean(credential?.token);
  },

  async send(event) {
    const credential = await getUserCredential(event.userId, "asana");
    if (!credential?.token) throw new Error("This user has not connected Asana");

    const projectId = event.target?.asanaProjectId?.trim();
    if (!projectId) throw new Error("No Asana project selected for this export");

    const rows = event.records ?? [];
    for (const row of rows) {
      const response = await fetch(`${ASANA_API}/tasks`, {
        method: "POST",
        headers: authHeaders(credential.token),
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

/** Workspaces the connected Asana account belongs to. */
async function listAsanaWorkspaces(token: string): Promise<Array<{ gid: string; name: string }>> {
  const response = await fetch(`${ASANA_API}/users/me?opt_fields=workspaces.name,workspaces.gid`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error(`Asana workspace list failed [${response.status}]: ${await response.text()}`);
  }
  const json = (await response.json()) as { data?: { workspaces?: Array<{ gid: string; name: string }> } };
  return json.data?.workspaces ?? [];
}

/**
 * Projects the user's connected Asana account can write to, for the target picker.
 * Asana requires a workspace (or team) scope on /projects, so we page per workspace.
 */
export async function listAsanaProjects(
  token: string,
): Promise<Array<{ id: string; name: string; workspaceId: string; workspaceName: string }>> {
  const workspaces = await listAsanaWorkspaces(token);
  const multiple = workspaces.length > 1;
  const projects: Array<{ id: string; name: string; workspaceId: string; workspaceName: string }> = [];

  for (const workspace of workspaces) {
    const response = await fetch(
      `${ASANA_API}/workspaces/${workspace.gid}/projects?limit=100&opt_fields=gid,name&archived=false`,
      { headers: authHeaders(token) },
    );
    if (!response.ok) {
      throw new Error(`Asana project list failed [${response.status}]: ${await response.text()}`);
    }
    const json = (await response.json()) as { data?: Array<{ gid: string; name: string }> };
    for (const project of json.data ?? []) {
      projects.push({
        id: project.gid,
        name: multiple ? `${workspace.name} / ${project.name}` : project.name,
        workspaceId: workspace.gid,
        workspaceName: workspace.name,
      });
    }
  }

  return projects;
}


/** Verifies a personal access token and returns the account name. */
export async function fetchAsanaUser(token: string): Promise<{ name: string; email: string | null }> {
  const response = await fetch(`${ASANA_API}/users/me?opt_fields=name,email`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error(`Asana token check failed [${response.status}]: ${await response.text()}`);
  }
  const json = (await response.json()) as { data?: { name?: string; email?: string } };
  return { name: json.data?.name ?? "Asana account", email: json.data?.email ?? null };
}
