# Publisher Blueprint™ Airtable Template

This template defines the two Airtable tables used by the Publisher Blueprint™ platform.

- **Publisher Blueprint Contacts** — receives lifecycle and qualification events from the platform outbox.
- **Publisher Blueprint Actions** — receives exported plan rows from the dashboard and Publisher Copilot™.

The machine-readable schema is in [`airtable-template.json`](./airtable-template.json).

## Public Airtable base link

<!-- Replace with the actual public share URL once the base is created in Airtable and shared publicly -->
**Public template:** *To be added after manual creation in the Airtable UI.*

If you need the template now, create a new Airtable base using the schema and sample records below, then share it publicly and paste the link here.

## Why two tables?

| Table | What it holds | When it is written |
|---|---|---|
| `Publisher Blueprint Contacts` | One row per user/organization event | Whenever a lifecycle event fires: sign-up, assessment completed, purchase, subscription change, qualification change, etc. |
| `Publisher Blueprint Actions` | One row per action, recommendation, KPI, roadmap item, or score | Whenever a user exports a plan from the Blueprint dashboard or Publisher Copilot™. |

The actions table upserts on the `Key` field, so re-exporting the same plan updates existing rows instead of duplicating them.

## Table 1 — Publisher Blueprint Contacts

### Fields

| Field | Airtable type | Required | Notes |
|---|---|---|---|
| Name | Single line text | No | Full name from the user profile. |
| Email | Email | No | User email. |
| Event | Single select | Yes | `user.signed_up`, `assessment.completed`, `purchase.completed`, `subscription.changed`, `lifecycle.stage_changed`, `qualification.tier_changed`, `organization.updated` |
| Occurred At | Date and time (ISO, UTC) | Yes | Timestamp of the event. |
| Organization | Single line text | No | Organization name, when known. |
| Publisher Index | Number (0-100) | No | Overall assessment score. |
| Maturity Level | Single line text | No | `Observer`, `Contributor`, `Publisher`, `Platform`, `Monetizer` |
| Tier | Single line text | No | Entitlement or qualification tier: `free`, `blueprint`, `os`, `lead`, `marketing_qualified`, `sales_qualified`, `customer` |
| Amount | Currency | No | Purchase or subscription amount in dollars. |
| Currency | Single line text | No | ISO 4217 code, e.g. `USD`. |

### Sample records

See [`airtable-template.json`](./airtable-template.json) under `tables[0].sample_records` for six example rows covering sign-up, assessment completion, purchase, subscription change, qualification change, and lifecycle stage change.

## Table 2 — Publisher Blueprint Actions

### Fields

| Field | Airtable type | Required | Notes |
|---|---|---|---|
| Key | Single line text (primary) | Yes | Stable upsert key. Must be unique per row. |
| Type | Single select | Yes | `Saved action`, `Opportunity`, `Quick win`, `Long-term move`, `Roadmap activity`, `Roadmap metric`, `KPI`, `Score` |
| Category | Single line text | No | Category or phase label. |
| Title | Single line text | Yes | Short title of the item. |
| Detail | Long text | No | Full description or rationale. |
| Impact | Single select | No | `High`, `Medium`, `Low`, `Track`, `Measure` |
| Effort | Single select | No | `High`, `Medium`, `Low` |
| Phase | Single line text | No | Priority rank, roadmap month, or KPI target. |
| Owner | Single line text | No | Assign in Airtable. |
| Status | Single select | No | `To do`, `Done`, `Measure`, `Track`, `Strength` |
| Source | Single line text | No | `Publisher Blueprint` or `Publisher Copilot`. |
| Created | Date | No | Date the row was created (`YYYY-MM-DD`). |

### Sample records

See [`airtable-template.json`](./airtable-template.json) under `tables[1].sample_records` for nine example rows covering scores, opportunities, quick wins, long-term moves, roadmap activities, metrics, KPIs, and saved Copilot actions.

## How to create a public template from this spec

1. **Create a new Airtable base** in the Airtable UI.
2. **Rename the default table** to `Publisher Blueprint Contacts` and add the fields listed above with the exact names and types.
3. **Add a second table** named `Publisher Blueprint Actions` and add its fields.
4. **Paste the sample records** from [`airtable-template.json`](./airtable-template.json) into each table.
5. **Share the base publicly**:
   - In Airtable, click **Share** in the top-right.
   - Turn on **Create a shareable link to this base**.
   - Set permissions to **Allow viewers to copy the base** so it works as a template.
   - Copy the public URL and paste it into this document under **Public Airtable base link**.

## How users connect the template in the app

1. Create a personal access token at [airtable.com/create/tokens](https://airtable.com/create/tokens) with:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
2. In the app, go to **Settings → Connections** and paste the token under Airtable.
3. Select the base created from this template.
4. Exported plans and lifecycle events will write to the tables above.

## Important integration details

- Field names are **case-sensitive** and must match exactly.
- The Contacts table receives one row per event. The same user may appear multiple times with different `Event` values.
- The Actions table uses `PATCH` with `performUpsert: { fieldsToMergeOn: ["Key"] }`. Re-exporting a plan updates existing rows rather than creating duplicates.
- The default table names in the code are `Publisher Blueprint Contacts` and `Publisher Blueprint Actions`. The actions table can be overridden per export in the app UI.
- Currency amounts in the Actions table are not used; the `Amount` field only appears in the Contacts table for purchase and subscription events.
- Date/time fields should be in ISO 8601 UTC format to avoid ambiguity.

## Schema changelog

| Version | Date | Changes |
|---|---|---|
| 1.0.0 | 2026-08-03 | Initial template for Contacts and Actions tables. |
