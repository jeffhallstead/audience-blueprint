# Phase 6 — Organization Intelligence Platform

Extends Phases 1–5. No changes to Publisher Index scoring, Publisher Levels, assessment methodology, or the rules engine. All work is additive.

## Your decisions (locked)

- Intake: minimal required gate before the test, full profile prompted after the score reveal.
- Events: one new canonical `platform_events` store, legacy rows backfilled.
- Orgs: `organization_members` table, one member enforced in app logic.
- CRM: Airtable live; HubSpot extended but dormant until connected.

## 1. Capability map

**Already implemented (extend, don't rebuild)**
- `organizations` table + owner model; created at assessment completion.
- Assessment engine, autosave, scoring, maturity levels, `assessment_scores`.
- Rules-based blueprint + roadmap + recommendations (`blueprint/engine.ts`, `rules.ts`).
- Commerce: purchases, subscriptions, computed entitlement tiers, Paddle webhook.
- Integration outbox with dedupe, exponential backoff, retry cap, dispatch endpoint, admin retry.
- Airtable / HubSpot / Asana adapters, per-user encrypted credentials (AES-256-GCM).
- Admin Console behind `has_role` security-definer RPC.
- Executive Obsidian tokens and app shell.

**Partially implemented**
- Org profile: only 6 fields, written once, never editable. Needs full profile + edit + completeness.
- Events: three uncoordinated emitters writing two incompatible tables; no version, no org id, no context, no replay.
- CRM sync: contact-level only, fired on assessment completion. Needs org-level, lifecycle, qualification, conflict rules, monitoring.
- Admin: aggregate metrics only. No org search, no org detail, no lifecycle/qualification views, no audit log.
- Analytics: raw event inserts, no attribution or executive dashboards.
- Personalization: Copilot reads profile answers; the rules engine and report do not.

**Not implemented**
- Audience Intelligence, Marketing Organization, Content Operations entities.
- Qualification engine, qualification history, admin override.
- Lifecycle stages, transitions, history, inactivity detection.
- Newsletter / marketing-automation sync and segmentation.
- Product ownership normalization, integration reference table, audit log, benchmark dimensions.

**Deferred / out of scope (PRD §4)**
- Customer-facing benchmarking, enterprise collaboration and permissions, new AI models, revenue intelligence, consulting workflow, native marketing automation, public API, event replay UI beyond admin-triggered redispatch.

## 2. Conflicts, risks, decisions

| Item | Resolution |
| --- | --- |
| PRD wants org fields collected at intake; existing wizard collects them as scored *answers* | Keep the assessment answers untouched (scoring integrity). Add a separate pre-wizard intake that writes to the org profile, and prefill assessment company questions from it. Two writes, one source of truth. |
| PRD Section A implies a long intake | Your choice: 6 required fields only, remainder post-score. |
| `organizations` currently created *after* completion | Move creation to intake time; make completion an upsert. Backfill leaves history intact. |
| Two event tables with different shapes | New `platform_events`; legacy tables kept read-only, backfilled, existing writers rewired. No table drops in Phase 6. |
| `entitlement_tier` is computed, PRD wants stored product ownership | Keep computed tier authoritative; `product_ownership` becomes a derived projection maintained by event consumers, never a gate. |
| Lifecycle vs. entitlement | Lifecycle is reporting/automation only. It must never gate a paid feature. |
| `wizard-config.ts` is dead code | Delete in the first slice to avoid two competing config files. |
| Migration risk | Every new table is additive; every backfill is idempotent and re-runnable; no destructive statements. |
| Dispatch throughput | Outbox dispatch is pull-based via a single endpoint. Adding lifecycle+qualification+marketing consumers multiplies rows; add per-provider limits and a claim window. |

## 3. Epics (dependency order)

### E1 — Organization Profile foundation
Outcome: an organization is a persistent record a customer can view and edit.
Tables: extend `organizations` (region, business_model, company_size, domain normalized+unique, profile_completeness, archived_at); new `organization_members` (org, user, role, unique on user); `organization_audit`.
Files: `src/lib/organization/*.functions.ts`, `profile-schema.ts`, new `/settings` Organization tab, `assessment/persistence.ts` (upsert instead of insert).
Migration: backfill one org per existing owner, one member row each, derive domain from website; assessments keep their existing `organization_id`.
RLS: members read/write their own org; admins via `has_role`. GRANTs for authenticated + service_role.
Tests: backfill idempotency; a Phase 1–5 user sees their existing org with history intact.
Rollback: new columns nullable; feature reads fall back to legacy fields.

### E2 — Platform event store
Outcome: one canonical, versioned, immutable business-event stream.
Tables: `platform_events` (id, event_type, event_version, org_id, user_id, product, environment, occurred_at, processed_at, context jsonb, payload jsonb, dedupe_key unique).
Files: new `src/lib/events/emit.server.ts` + `catalog.ts`; rewire `assessment/persistence.ts`, `blueprint/analytics.ts`, `commerce/analytics.ts`, `payments/webhook.ts`.
Migration: backfill `assessment_events` + `customer_events` into the store with `event_version: 0`; legacy tables remain for existing reads.
RLS: no client insert path — emission is server-side only; admins read.
Events: organization.*, assessment.*, commerce.*, lifecycle.*, qualification.*, copilot.*.
Tests: duplicate emit produces one row; a failed consumer never blocks the user action.
Rollback: legacy writers kept behind a flag for one release.

### E3 — Lifecycle infrastructure
Outcome: every org has a current stage and a full transition history.
Tables: `lifecycle_transitions` (append-only), `organizations.lifecycle_stage` cached column.
Files: `src/lib/lifecycle/rules.ts` (event→transition map), consumer in the outbox dispatcher.
Stages: registered, assessment_in_progress, assessment_completed, blueprint_customer, os_subscriber, returning, inactive.
Migration: derive current stage for every existing org from its assessments/purchases/subscriptions; write one synthetic backfill transition per org.
Tests: replaying the same event twice does not create a duplicate transition; inactivity job is idempotent.

### E4 — Extended intelligence profiles
Outcome: audience, marketing-org, and content-ops intelligence captured post-score.
Tables: `organization_audience_profile`, `organization_marketing_profile`, `organization_content_ops_profile` (all 1:1 with org, versioned, updated_at trigger).
Files: config-driven `src/lib/organization/profile-sections.ts`, a post-results "Complete your profile" flow, Settings editing, completeness recalculation.
Constraint: none of these fields touch scoring. Enforced by a test asserting Publisher Index is unchanged when they are populated.

### E5 — Qualification engine (internal only)
Outcome: admins see a qualification tier per org with history and override.
Tables: `qualification_assessments` (append-only, model_version, tier, factors jsonb, source: engine|override, actor).
Files: `src/lib/qualification/model.ts` (weighted, multi-factor, config-driven tiers), server fns admin-gated.
Security: never exposed to customer-facing fns or the client bundle; verified by a route-graph test.

### E6 — CRM + marketing sync on canonical events
Outcome: Airtable receives orgs, contacts, lifecycle and qualification updates reliably.
Files: extend `integrations/types.ts` event names, `outbox.server.ts` consumers, `airtable.server.ts` (org table + contact table), `hubspot.server.ts` (parity, `isConfigured()` false until connected).
Tables: `integration_references` (org/user ↔ external id per provider).
Adds: conflict rule (platform wins on owned fields, external wins on CRM-owned fields), per-provider dispatch limits, dead-letter status.

### E7 — Admin console expansion
Outcome: an operational command center.
Files: `admin.functions.ts` + `/admin` — org search & filter, org detail (profile, assessments, lifecycle, qualification, products, events, sync status), lifecycle & qualification dashboards, event monitor with redispatch, audit log view.
All new views use existing Executive Obsidian tokens and components — no new palette.

### E8 — Analytics, attribution, personalization metadata
Outcome: executive metrics derived from the event stream; recommendations carry provenance.
Tables: `organizations` acquisition columns (source, campaign, first_touch_at); `recommendation_metadata` (version, source, personalization inputs, generated_at).
Files: `blueprint/blueprint.functions.ts` records metadata; admin analytics views read `platform_events`.
Constraint: the rules engine output itself is unchanged; only metadata is added.

## 4. Smallest safe first milestone

**E1 slice: Organization Profile foundation, read-only elsewhere.**

1. Migration: additive columns, `organization_members`, `organization_audit`, GRANTs, RLS, idempotent backfill.
2. Pre-wizard intake step capturing name, website, industry, revenue, company size, region — writes the org profile; assessment company questions prefill from it.
3. Organization tab in Settings for viewing and editing, with an audit row per change.
4. `completeAssessment()` switches from insert to upsert.
5. Delete unused `wizard-config.ts`.

Independently testable, ships value on its own, and touches no scoring, commerce, or event code. Everything after it depends on a stable organization entity.

## 5. Verification for the milestone

- Existing user with a completed assessment: dashboard, blueprint, roadmap, Copilot, billing all unchanged.
- New user: intake → wizard → score reveal produces one org, one member, correct completeness.
- Re-running the backfill creates no duplicates.
- Publisher Index for a fixed answer set matches the pre-change value exactly.
