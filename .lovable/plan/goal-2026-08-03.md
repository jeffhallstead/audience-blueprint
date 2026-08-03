Create ADR Directory and Seed Architecture Decision Records

## Goal
Capture the major architectural decisions made during the build of Publisher Blueprint™ so far in a lightweight, decision-by-decision format that future contributors and the founder can reference.

## Scope
- Create `docs/adr/` at the repo root.
- Add a short `README.md` explaining the ADR format and numbering convention.
- Seed 8 records covering the most consequential decisions across product, technology, design, and integrations.
- Keep each record in standard ADR format: title, status, context, decision, consequences, and related records.

## Records to create

1. `0001-record-architecture-decisions.md` — ADR about ADRs: why we document decisions and the Markdown format.
2. `0002-tanstack-start-supabase-backend.md` — Chose TanStack Start for full-stack React with Supabase as backend/auth/storage.
3. `0003-executive-obsidian-brand-direction.md` — Migrated from consulting website branding to Executive Obsidian product-first sub-brand.
4. `0004-paddle-sandbox-commerce.md` — Chose Paddle for one-time and subscription billing in sandbox mode.
5. `0005-platform-event-architecture.md` — Introduced immutable `platform_events` table as central event store and backfilled legacy analytics events.
6. `0006-customer-lifecycle-qualification-engine.md` — Derive lifecycle stage and qualification tier from `platform_events` instead of standalone state tables.
7. `0007-organization-single-member-model.md` — Enforce 1:1 organization-to-primary-user model with members table for future expansion.
8. `0008-airtable-primary-crm-hubspot-dormant.md` — Wire Airtable as live CRM and keep HubSpot dormant-ready via integration outbox.
9. `0009-gemini-ai-gateway-for-copilot.md` — Use Lovable AI Gateway with Gemini as the model behind Publisher Copilot™.

## Non-goals
- No code changes outside the `docs/adr/` directory.
- No new dependencies.
- No migration or schema changes.

## Acceptance criteria
- `docs/adr/` exists with 10 files total (9 ADRs + README).
- Each ADR has status `Accepted`, `Superseded`, or `Proposed` as appropriate.
- README explains the numbering and how to add new records.
- All records reference the PRD phase or PRD version where the decision originated when applicable.
