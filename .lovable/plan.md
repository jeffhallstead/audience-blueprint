# Generate Airtable Template for Publisher Blueprint™

## Goal

Create a reusable Airtable template that supports the two destinations already wired into the app:

1. **Publisher Blueprint Contacts** — lifecycle/CRM events (sign-up, assessment completed, purchase, subscription changes, qualification/lifecycle stage changes).
2. **Publisher Blueprint Actions** — exported plan rows (opportunities, quick wins, roadmap activities, KPIs, scores, saved Copilot actions).

Output: a public Airtable base link plus a JSON schema file committed to the repo.

## Constraints

- The Airtable REST API cannot create new bases or generate public share/template URLs programmatically. Those steps must be done manually in the Airtable UI.
- The Airtable API can read bases/tables/fields and create/update/delete records within an existing base.
- The workspace already has a linked Airtable connection (`Jeff's Airtable`) that can be used for verification and record-level setup.

## Deliverables

### 1. JSON schema file in the repo

Path: `/api/airtable-template.json` (or `api/integrations/airtable-template.json` if that fits the repo structure).

Content:

- Schema version and metadata (product name, description, date).
- Two tables with full field definitions:
  - Field name, type, description, required/optional, and sample values.
  - Select-field options where applicable (e.g., Event, Type, Impact, Effort, Status, Tier).
- Sample records for each table (10-15 rows) so the base is useful immediately after import.
- Mappings back to the code fields used in `airtable.server.ts` and `airtable-records.server.ts`.

**Publisher Blueprint Contacts fields**

| Field | Type | Purpose |
|-------|------|---------|
| Email | Email | User email |
| Name | Single line text | Full name from profile |
| Event | Single select | `user.signed_up`, `assessment.completed`, `purchase.completed`, `subscription.changed`, `lifecycle.stage_changed`, `qualification.tier_changed`, `organization.updated` |
| Occurred At | Date/time (ISO, GMT) | Event timestamp |
| Organization | Single line text | Organization name |
| Publisher Index | Number (0-100) | Assessment score |
| Maturity Level | Single line text | Maturity title |
| Tier | Single line text | Entitlement/qualification tier |
| Amount | Currency | Purchase/subscription amount |
| Currency | Single line text | `USD` etc. |

**Publisher Blueprint Actions fields**

| Field | Type | Purpose |
|-------|------|---------|
| Key | Single line text (primary) | Stable upsert key (`saved:...`, `opportunity:...`, `roadmap:...`, `kpi:...`, `score:...`) |
| Type | Single select | Saved action, Opportunity, Quick win, Long-term move, Roadmap activity, Roadmap metric, KPI, Score |
| Category | Single line text | Category or phase label |
| Title | Single line text | Item title |
| Detail | Long text | Description/rationale |
| Impact | Single select | High / Medium / Low / Track / Measure |
| Effort | Single select | High / Medium / Low |
| Phase | Single line text | Priority, month, or target |
| Owner | Single line text | Assigned owner |
| Status | Single select | To do / Done / Measure / Track / Strength |
| Source | Single line text | Publisher Blueprint / Publisher Copilot |
| Created | Date | Creation date |

### 2. Markdown documentation

Path: `/api/airtable-template.md` or `/api/README.md` section.

Contents:

- Purpose of each table.
- Step-by-step manual setup instructions in Airtable UI (duplicate a base, create tables, create fields with the listed types, paste sample records).
- How to get a personal access token and connect it in the app (Settings → Connections).
- How exports use the `Key` field to upsert instead of duplicate.
- Link to the JSON schema file.

### 3. Public Airtable base link

Create the actual template base in the linked Airtable workspace:

- Use the Airtable UI to create a new base named **Publisher Blueprint™ Template**.
- Add the two tables above with the exact field names and types.
- Paste the sample records from the JSON schema file.
- Enable public sharing (read-only template or "copy base" link).
- Add the resulting public URL to `api/airtable-template.md` and the repo README.

Because this is a manual UI step, the plan includes a verification step after the base is created.

### 4. Verification (manual + automated)

Automated:

- Use the linked Airtable connection via the gateway to read the base metadata and confirm the fields match the schema.
- Record a JSON snapshot of the verified base schema.

Manual:

- Open the public share link in an incognito window to confirm it loads and can be copied.
- Confirm the app's Settings → Connections panel exports into the base correctly.

## Steps

1. **Read the existing integration code** to confirm the exact field names the app sends (already completed: `airtable.server.ts`, `airtable-records.server.ts`, `types.ts`, `rows.ts`).
2. **Write the JSON schema** (`/api/airtable-template.json`) with field definitions, types, select options, and sample records for both tables.
3. **Write the markdown documentation** (`/api/airtable-template.md`) with setup instructions and public-link placeholder.
4. **Create the template base in Airtable UI**:
   - Add tables and fields exactly as documented.
   - Paste sample records.
   - Generate a public share/copy link.
5. **Update the markdown file** with the real public link.
6. **Verify the schema against the live base** using the gateway connection (list bases/tables/fields, compare to JSON schema).
7. **Run a test export** from the app to confirm rows upsert correctly into the "Publisher Blueprint Actions" table.
8. **Update the repo README** to mention the Airtable template.

## Risks and fallbacks

- If Airtable UI sharing is not available for the workspace, the deliverable becomes the JSON schema + markdown setup guide only; no public link.
- If the linked connection lacks permissions to read metadata, verification is done by manual UI inspection instead.

## Success criteria

- JSON schema file is committed and contains both tables, correct field types, and sample records.
- Markdown guide is committed and includes a real public Airtable base link (if UI sharing succeeds).
- The app can export a test plan into a base created from the template without errors.
