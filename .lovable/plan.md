Restructure Documentation into v2.0 Product Knowledge Repository

## Goal

Move the project from a flat, ad-hoc docs layout to a layered v2.0 knowledge repository. Every future PRD will be able to state: "This phase must comply with the Product Constitution v2.0."

## Target structure

```text
/
  Product-Constitution-v2.0.md
  Product-Specification-v2.0.md
  Product-Roadmap.md
  /prd
    Phase-01.md
    Phase-02.md
    Phase-03.md
    Phase-04.md
    Phase-05.md
    Phase-06-v2.0.md
    Phase-07.md
  /adr
    ADR-001-Record-Architecture-Decisions.md
    ADR-002-TanStack-Start-Supabase-Backend.md
    ADR-003-Executive-Obsidian.md
    ADR-004-Paddle-Sandbox-Commerce.md
    ADR-005-Event-Architecture.md
    ADR-006-Lifecycle-Qualification-Engine.md
    ADR-007-Organization-Single-Member-Model.md
    ADR-008-Airtable-Primary-CRM.md
    ADR-009-Gemini-AI-Gateway.md
  /design
    Design-System.md
  /api
    Event-Schema.md
    Data-Model.md
```

## Content mapping

### Product-Constitution-v2.0.md
Draft a new document from existing sources. It will contain:

1. **Brand architecture** — identity hierarchy (Publisher Blueprint™ vs. Jeff Hallstead consulting), voice, and product-first positioning.
2. **Design system** — Executive Obsidian palette, tokens, typography, and component rules; reference to `/design/Design-System.md` for full detail.
3. **Naming conventions** — file naming, route naming, component naming, and PRD/ADR numbering.
4. **Product taxonomy** — definitions for Publisher Blueprint™, Publisher OS™, Publisher Index™, Publisher Copilot™, etc.
5. **Messaging principles** — copy tone, naming rules, and no-hype/assumptions rules.
6. **Database naming standards** — table, enum, function, and column conventions (e.g., snake_case, `public.*`, `auth.*` reserved).
7. **Event naming conventions** — namespace convention from `src/lib/events/catalog.ts` (e.g., `lifecycle.*`, `commerce.*`, `assessment.*`).
8. **AI design principles** — honesty rules, no invented figures, grounded context, no outcome guarantees.
9. **Engineering standards** — Tailwind v4 semantic tokens, RLS-first access, server-function patterns, no hardcoded colors, no secrets in client bundles.

### Product-Specification-v2.0.md
Create a new v2.0 spec based on the existing `PRODUCT-SPEC.md` (434 lines). It will be updated to:

- Reflect the current shipped state after Phases 1–6.
- Rename the product surface to match the v2.0 taxonomy.
- Add the new platform capabilities (organization profile, lifecycle, qualification, CRM sync, admin console).
- Keep the same dual-audience structure (executive + engineering).

### Product-Roadmap.md
Draft a concise roadmap document from:

- `PRODUCT-SPEC.md` Part 8 (gaps and roadmap).
- `.lovable/plan/phase-6-prd-v2-0-what-s-left-2026-08-03.md`.
- Known next phase (Phase 7) placeholder.

Format: horizon-based (Shipped / Now / Next / Later) with one-pager milestones.

### /prd/Phase-01.md through Phase-07.md
Draft each phase as a standalone PRD-lite using:

- **Phase 1** — MVP build (assessment, scoring, blueprint, roadmap). Source: `PRODUCT-SPEC.md` Part 1–2 and build history.
- **Phase 2** — Assessment engine (Publisher Index, radar, maturity). Source: `PRODUCT-SPEC.md` and `src/lib/assessment/`.
- **Phase 3** — Dashboard, opportunity matrix, strategic roadmap. Source: `PRODUCT-SPEC.md` and `src/lib/blueprint/`.
- **Phase 4** — AI Strategy Engine / Publisher Copilot. Source: `ARCHITECTURE.md` Phase 4, `src/lib/copilot/`, `src/lib/ai-gateway.server.ts`.
- **Phase 5** — Commercialization, payments, customer portal. Source: `PRODUCT-SPEC.md`, `src/lib/commerce/`, Paddle setup.
- **Phase 6 v2.0** — Organization Intelligence Platform (intake, org profiles, event store, lifecycle, qualification, CRM sync, admin console). Source: `.lovable/plan/phase-6-prd-v2-0-what-s-left-2026-08-03.md` and existing implementation.
- **Phase 7** — Placeholder next phase covering PDF export, team collaboration, and peer benchmarking based on `PRODUCT-SPEC.md` Part 8 and known gaps.

Each phase file will contain: Goal, Scope, Success criteria, Non-goals, Technical notes, and Status (Shipped / In Progress / Planned).

### /adr
Move the existing `docs/adr/` directory to `/adr/`, rename each file to `ADR-XXX-Short-Name.md`, and update the README to match the new numbering convention. The content of each ADR remains the same; only file paths and titles are updated.

### /design/Design-System.md
Extract from `src/styles.css` and the brand direction memory into a full design-system document: tokens, surfaces, typography, elevation, spacing, semantic components, and dark mode rules.

### /api/Event-Schema.md
Extract from `src/lib/events/catalog.ts` and the `platform_events` migration into a reference document: event categories, naming, payload shapes, immutability, and version rules.

### /api/Data-Model.md
Extract from the existing migrations, `src/integrations/supabase/types.ts`, and `PRODUCT-SPEC.md` into a canonical data model document: entity-relationship overview, table purposes, key relationships, and RLS boundary.

## Legacy file handling

- `PRODUCT-SPEC.md` will be replaced by `Product-Specification-v2.0.md` and then removed.
- `docs/adr/` will be moved to `/adr/` and `docs/` will be removed if empty.
- `ARCHITECTURE.md` and `AGENTS.md` will remain at the root as companion files but will be referenced from the new v2.0 docs.
- `README.md` remains at the root and will be updated to reference the new docs hierarchy.

## Non-goals

- No application code changes.
- No database changes.
- No new dependencies.
- No design-token changes.

## Acceptance criteria

- [ ] The target directory structure exists at the repo root.
- [ ] `Product-Constitution-v2.0.md` includes all 9 sections listed above.
- [ ] `Product-Specification-v2.0.md` is a faithful v2.0 update of the current shipped state.
- [ ] `Product-Roadmap.md` exists with horizon-based milestones.
- [ ] `/prd` contains `Phase-01.md` through `Phase-07.md` with Goal/Scope/Status.
- [ ] `/adr` contains 9 renamed ADRs using the `ADR-XXX-Name.md` convention and a README.
- [ ] `/design/Design-System.md` exists with token definitions and component rules.
- [ ] `/api/Event-Schema.md` and `/api/Data-Model.md` exist as technical references.
- [ ] `README.md` is updated to link to the new v2.0 docs.
- [ ] Old `PRODUCT-SPEC.md` and empty `docs/` directory are removed.
