# Fix the empty Asana project picker

## What's wrong

When you export to Asana, the project dropdown is empty even though your token works.

The app asks Asana for "all projects" without telling it which workspace to look in. Asana rejects that request, and the code quietly swallows the error and returns an empty list — so the dropdown shows nothing and you get no explanation.

There is also no project picker in Settings, so the only place to choose a project is the export dialog, which is currently empty.

## What to change

1. **List projects per workspace.** First read the connected account's workspaces, then request projects for each workspace and combine them (labelled `Workspace / Project` when there is more than one workspace). This is what Asana's API requires.
2. **Stop hiding failures.** If Asana returns an error, surface the status and message to the dropdown instead of returning an empty list, so a scope or permission problem is visible.
3. **Add a project picker to Settings.** Next to the Asana connection in the Connections panel, add a "Default project to export into" select, mirroring the existing Airtable base picker. The choice is saved as the user's Asana export target and pre-selects in the export dialog.
4. **Better empty state.** If the account genuinely has no projects, the dropdown says so ("No projects found in your Asana workspaces") rather than looking broken.

## Technical detail

- `src/lib/integrations/asana.server.ts`: rewrite `listAsanaProjects` to call `/users/me?opt_fields=workspaces.name,workspaces.gid`, then `/workspaces/{gid}/projects?limit=100&opt_fields=gid,name&archived=false` for each workspace; return `{ id, name, workspaceId, workspaceName }`; throw on non-OK with status + body.
- `src/lib/export/export.functions.ts`: `listExportAsanaProjects` returns `{ connected, projects, error }` instead of swallowing the error; keep the existing `requireFeature("connector_export")` gate.
- `src/lib/integrations/connections.functions.ts`: add `listMyAsanaProjects` and `selectAsanaProject` (writes `asana_project_id` / `asana_project_name` to `export_targets` for provider `asana`), mirroring the Airtable base functions and the same entitlement gate.
- `src/components/settings/connections-panel.tsx`: add the Asana project `Select` under the connected Asana block.
- `src/components/blueprint/export-menu.tsx`: default `asanaProject` state from the saved target, and show the error/empty message under the select.

No database or schema changes — `export_targets` already has `asana_project_id` and `asana_project_name`.
