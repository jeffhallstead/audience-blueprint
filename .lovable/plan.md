## Goal

Let you take everything in your Blueprint — saved actions, the 90-day roadmap, blueprint recommendations, KPIs, and category scores — out of the app: download as a spreadsheet file, or push straight into Airtable or Asana as rows/tasks.

Yes, the existing code extends cleanly. The integration adapter pattern (`IntegrationAdapter` + `integration_outbox`) already used for Airtable/HubSpot contact sync is the right backbone; it just needs a second event shape for "records" rather than "contacts".

## 1. One export data model

A single builder turns the current blueprint into a flat list of export rows with stable columns:

```text
Type | Category | Title | Detail | Impact | Effort | Phase/Month | Owner | Status | Source | Created
```

Rows come from saved recommendations, roadmap phases, blueprint recommendations, KPIs, and category scores. Every destination (CSV, XLSX, Airtable, Asana) consumes this same list, so the columns stay identical everywhere.

## 2. File download (CSV + XLSX)

- An **Export** menu on `/blueprint` and `/roadmap` (and the Strategy Library) with: Download CSV, Download Excel (.xlsx), and Copy for Google Sheets.
- CSV is generated in the browser (no dependency); XLSX uses a small sheet-writing library.
- Google Sheets is covered by the CSV/clipboard path — File > Import in Sheets, no connector or OAuth needed.
- A scope picker so you can export everything or just one section.

## 3. Direct push to Airtable

- New `airtableRecordsAdapter` alongside the existing contacts adapter, writing to a separate table (default "Publisher Blueprint Actions", configurable) in your already-connected base.
- Batched creates (10 records/request, as Airtable requires), `typecast: true` so fields auto-map.
- Dedupe by a stable external key per row so re-exporting updates rather than duplicating.

## 4. Direct push to Asana

- Requires connecting the Asana connector first (one approval card during implementation).
- New `asanaAdapter` creating one task per exported row: title as task name, detail as notes, impact/effort/category as tags or custom-field-free notes, roadmap month mapped to a due date.
- You pick the target Asana project the first time; the choice is stored per user.

## 5. Wiring and reliability

- Exports queue through the existing `integration_outbox` (status, attempts, backoff, dedupe) so a failed push retries instead of silently dropping.
- Push is triggered by an authenticated server function; the UI shows queued → delivered state and links to the destination when the provider returns record/task URLs.
- A small `export_targets` table stores per-user destination config (Airtable table name, Asana project id, last export time).

## Technical notes

- New: `src/lib/export/rows.ts` (shared row builder), `src/lib/export/file.ts` (CSV/XLSX), `src/lib/export/export.functions.ts` (server fn to enqueue a push), `src/lib/integrations/airtable-records.server.ts`, `src/lib/integrations/asana.server.ts`.
- Extend `IntegrationEvent` with a discriminated `records` variant so adapters stay type-safe; `INTEGRATION_PROVIDERS` gains `airtable_records` and `asana`.
- One migration for `export_targets` (RLS scoped to `auth.uid()`, GRANTs for `authenticated` + `service_role`).
- The Asana connector must be linked before its adapter reports `isConfigured()`; until then the Asana option shows a "Connect Asana" state rather than failing.

## Testing

Export CSV from `/blueprint` and open in Excel/Sheets; push to Airtable and confirm rows appear in the new table; connect Asana, pick a project, push and confirm tasks with due dates.
