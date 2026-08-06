# Plan: Improve Asana onboarding and add a create-project helper

## Goal
Remove the dead-end empty state when a user connects Asana but has no projects yet. Keep the user inside the Publisher Blueprint UI while still using their own Asana account.

## Current state
- Asana is connected with a personal access token pasted in Settings → Connections.
- After the token is saved, the project picker lists projects from each Asana workspace the user belongs to.
- If no projects exist, the picker is empty and the message only says: “No projects found in your Asana workspaces. Create one in Asana, then reload/reopen.”
- The project does not need any pre-existing format or structure; the export creates one Asana task per Blueprint row.

## Proposed changes

### 1. Clearer onboarding copy (always)
Update the Asana token card and the export dialog to explain the project requirement up front, so the user never enters a token without knowing they need a project.

- Add a short “Before you connect” bullet in the Asana token card:
  - “You need at least one project in Asana.”
  - “The project can be empty — we create tasks in it.”
- Add a help link to Asana’s project creation page: https://app.asana.com/
- In the empty project picker, replace the generic text with a guided empty state that includes a primary action.

### 2. “Create project in Asana” helper (preferred path)
When the picker is empty, show a button that creates a default project directly in the user’s Asana workspace, then refreshes the list and selects it.

**Server-side**
- Add a new server function `createAsanaProject` in `src/lib/integrations/connections.functions.ts`.
- It accepts a workspace ID and a project name (default: “Publisher Blueprint Actions”).
- It calls Asana’s `POST /projects` endpoint with the user’s stored token.
- On success, it saves the new project ID as the default export target and returns the project details.
- On failure, it surfaces the provider error message to the UI.

**UI-side**
- In `src/components/settings/connections-panel.tsx`, when the Asana project picker has no projects and is not loading, render a new empty state:
  - Heading: “No projects found in your Asana workspace.”
  - Subtext: “Create a project now and we will start writing tasks there.”
  - Button: “Create default project” with a loading state.
  - If the user has multiple workspaces, show a small workspace selector first.
- In `src/components/blueprint/export-menu.tsx`, apply the same empty-state pattern when the export dialog is opened but no projects are available.
- After creation, invalidate the project list query and pre-select the new project.

### 3. Scope limits
- No schema changes are required.
- No entitlement changes are required; the feature remains gated by the existing `connector_export` entitlement.
- No changes to the task export format or the Airtable flow.
- The created project is a normal Asana project owned by the user; no custom fields or templates are needed.

## Out of scope
- Pre-populating Asana tasks with custom fields, sections, or milestones.
- Creating a workspace for the user.
- A separate “Asana onboarding” wizard.

## Testing plan
1. **Connect Asana with an empty workspace.**
   - Verify the empty state appears and the “Create default project” button is visible.
2. **Click the create button.**
   - Verify the project is created in Asana, the picker refreshes, and the new project is selected.
3. **Export a Blueprint.**
   - Verify tasks are written into the newly created project.
4. **Disconnect and reconnect Asana with a workspace that already has projects.**
   - Verify the existing project list loads normally and the helper does not appear.
5. **Error cases.**
   - Revoke the Asana token after connection; verify the empty state shows a useful error instead of a silent failure.
   - Try creating a project with a name that already exists; verify the Asana error is surfaced.
