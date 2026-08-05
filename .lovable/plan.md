# Gate exports and connectors behind the paid tiers

Right now every download path (CSV, Excel, Copy for Sheets, PDF, email delivery) and both connectors (Airtable, Asana) are open to anyone who finishes the free assessment. Only the roadmap, AI documents, and dashboard depth are gated. That means the highest-perceived-value artifacts — the ones a buyer would pay for — leave the product for free.

## Recommended tiering

| Capability | Free (Publisher Test™) | Blueprint ($49) | OS ($49/mo) |
| --- | --- | --- | --- |
| Limited PDF (score + category readings + upgrade page) | Yes | — | — |
| Full executive PDF | No | Yes | Yes |
| Email the report to my account | No | Yes | Yes |
| CSV / Excel / Copy for Sheets export | No (preview only) | Yes | Yes |
| Airtable + Asana connections | No | No | Yes |
| Push plan rows to Airtable / Asana | No | No | Yes |

Reasoning: the one-time Blueprint should own "get my plan out of the app" (files + email). The recurring OS tier should own "keep my plan in sync with the tools my team runs on" — connectors are the strongest recurring-value story and the weakest one-time-purchase story.

## What the free user sees (the upgrade moment)

Free users keep a real, useful artifact so the value is credible, but every locked control stays visible rather than hidden:

- Export dialog still opens; scope checkboxes and the row count are visible so they can see exactly how much plan is waiting. Download buttons are replaced by a single "Unlock exports for $49" panel.
- Limited PDF still downloads, with a closing page that names what the full report adds.
- "Email me the report" shows the lock instead of sending.
- Settings → Connections shows both connectors with a blurred preview and an "Included with Publisher OS™" unlock.

## Technical notes

- Add three features to `src/lib/commerce/plans.ts`: `file_export` (blueprint), `email_report` (blueprint), `connector_export` (os); add matching bullet copy to the plan cards.
- Enforce server-side with `requireFeature` (from `entitlement.server`) in:
  - `pushExportRows`, `saveExportTarget`, `getExportDestinations`, `listExportAsanaProjects` → `connector_export`
  - `connectIntegration`, `selectAirtableBase`, `listMyAirtableBases` in `connections.functions.ts` → `connector_export`
  - `sendReportPdf` in `email/report.functions.ts` → `email_report`
- File downloads are browser-side, so gate them at the UI in `export-menu.tsx` using `useEntitlement().can("file_export")`, and additionally strip paid rows for free users: `buildExportRows` receives a `locked` flag so a free CSV can never contain roadmap/opportunity content even if the button is forced.
- Reuse the existing `LockedFeature` component for the in-dialog and connections-panel upgrade panels so checkout stays consistent.
- PDF tiering already works off the `locked` flag from `useBlueprint()` — no change needed there beyond keeping the closing upsell page.
- Track `upgrade_prompt_viewed` with the feature name at each new lock so we can measure which gate converts.

## QA

Sign in as the free UAT user and confirm: export dialog shows the unlock panel, limited PDF still downloads, email button is locked, connections panel is locked. Then as the Blueprint user: files and email work, connectors still locked. Then as the OS user: everything works. Also call the gated server functions directly as the free user to confirm they reject rather than relying on UI alone.
