## Goal

Produce **Publisher Blueprint™ — Product Specification v1.0**, documenting everything built across Phases 1–6, in two synchronized outputs:

1. `PRODUCT-SPEC.md` committed at the repo root (single source of truth, versioned alongside code)
2. A formatted Word document delivered as a downloadable artifact

Both use the same content, sectioned so an executive can read Parts 1–4 and stop, while engineering continues into Parts 5–8.

## Method

Before writing, I'll verify the spec against the live system rather than from memory:
- Read the assessment config, scoring, blueprint rule engine, copilot, commerce, and integration modules to state real weights, thresholds, entitlements, and provider behavior
- Query the live database schema to list actual tables, columns, and RLS posture
- Enumerate the actual route tree so the surface inventory matches what ships

Any item I can't confirm goes in the doc as an explicit open question rather than an assertion.

## Document outline

**Part 1 — Executive summary**
Product definition, the problem it solves, who it's for, the value proposition, and a one-page "what exists today" snapshot.

**Part 2 — Product surface**
Every user-facing surface: landing, auth, wizard, results, dashboard, blueprint, roadmap, Copilot (chat, documents, simulator, prompts), strategy library, settings, pricing, legal pages, admin console. Each with purpose, entry point, and gating state.

**Part 3 — The Publisher Index™**
The seven assessment sections, question types, the six scoring categories with their weights, how 0–100 rolls up, and the five maturity levels with thresholds and strategic framing.

**Part 4 — Commercial model**
Publisher Blueprint™ $99 one-time and Publisher OS™ $49/month, what each unlocks, the entitlement boundary (what's free vs. gated), refunds, and the customer account lifecycle.

**Part 5 — Architecture (technical)**
Stack, routing model, server-function boundaries, the SSR/edge runtime constraints, and the design-token system.

**Part 6 — Data model (technical)**
Table-by-table reference: profiles, organizations, assessments, answers, scores, events, blueprints, roadmaps, recommendations, copilot sessions/messages/documents, entitlements/transactions, user roles, integration credentials and outbox. Ownership, RLS posture, and grants.

**Part 7 — Integrations & AI (technical)**
The AI gateway and Copilot context-assembly pipeline; payments webhook flow and its fallback path; email infrastructure on notify.jeffhallstead.com; per-user Airtable / Asana / HubSpot credentials with encryption; CSV/XLSX export.

**Part 8 — Known gaps and roadmap**
A candid open-items table (each with impact and suggested priority) covering the areas we've hit in practice — mobile OAuth handoff in embedded previews, PDF export still being a stub, HubSpot wired but unused, benchmarking and team collaboration not yet built — followed by proposed Phase 7+ direction.

**Appendix** — glossary, version history, document control.

## Formatting

The Word document uses US Letter, Arial throughout, styled headings with an outline level so the table of contents works, and real tables (not text grids) for the data model, entitlement matrix, and gaps register. Colors pull from the existing brand — navy surfaces with the cyan/orange accents already in `src/styles.css` — so it reads as a Publisher Blueprint™ artifact rather than a generic export.

## Quality check

After generating the .docx I'll convert every page to an image and inspect each one for clipped text, broken tables, overflow, and bad page breaks, fix and re-render until clean, then report what I verified.

## Note

There's an unrelated hydration warning on the auth page in the current preview. It doesn't affect this document; say the word and I'll fold the fix into this run or handle it separately.
