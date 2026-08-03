# Phase 6 PRD v2.0 — What's Left

## Where things stand

The original Phase 6 plan had eight epics. Naming has drifted since (lifecycle shipped as "E3", qualification shipped as "E4"), so this uses the original plan's numbering and states what is verified as built.

Shipped and verified in the codebase:

- **E1 — Organization profile foundation.** `organizations` extended (region, business model, domain, completeness), `organization_members` and `organization_audit` tables live, `src/lib/organization/` with intake step and Settings panel.
- **E2 — Platform event store.** `platform_events` table, `src/lib/events/` catalog + emitters + browser tracking, legacy backfill done.
- **E3 — Lifecycle.** `customer_lifecycle` table, `src/lib/lifecycle/`, admin Lifecycle tab, Settings journey card.
- **Qualification** (was E5 in the original plan). `customer_qualification` table, `src/lib/qualification/` fit + engagement scoring, admin Qualification tab.

Note: the original plan called `src/lib/wizard-config.ts` dead code and slated it for deletion. It is still imported by `src/lib/assessments.ts`, `src/routes/_authenticated/welcome.tsx`, and `src/components/blueprint/question-card.tsx`, so it is not dead and should stay.

## Remaining work

### 1. Extended organization profiles (original E4)

Three tables that do not exist yet: `organization_audience_profile`, `organization_marketing_profile`, `organization_content_ops_profile`. Each 1:1 with an organization, versioned, with `updated_at`. Plus the Settings UI to fill them in and feed richer facts into qualification fit scoring.

### 2. CRM sync driven by canonical events (original E6)

Today CRM pushes are enqueued ad hoc from scattered call sites (welcome email, manual sync, exports, the payments webhook). Nothing pushes lifecycle or qualification changes.

The remaining work is to make the outbox a consumer of `platform_events`: a single mapping layer that turns canonical event types into Airtable upserts (live) and HubSpot payloads (dormant-ready), covering lifecycle stage changes and qualification tier changes, with per-provider throughput limits on dispatch.

### 3. Admin console expansion (original E7)

`/admin` currently has Accounts, Lifecycle, Qualification, Maturity mix, and Integrations. Still missing:

- Organization search and an organization detail view (profile, members, audit history, linked assessments)
- Event monitor over `platform_events` (filter by type, user, org, time)
- Audit log browser over `organization_audit`

### 4. Analytics metadata (original E8)

- Acquisition columns (first-touch source, medium, campaign, referrer, landing path) captured on first visit and attached to the organization/profile record
- `recommendation_metadata` to track which recommendations get viewed, saved, exported, and completed

## Technical notes

- Every new table follows the established pattern: create, GRANT to `authenticated`/`service_role`, enable RLS, then owner-scoped policies plus admin read via `has_role`.
- New profile tables extend the organization identity rather than duplicating assessment answers; the Publisher Index score stays untouched.
- Event-driven CRM sync hooks into `emitPlatformEvent`/`emitPlatformEvents` alongside the existing lifecycle and qualification recompute, so there is one place where derived work fans out.
- All backfills stay idempotent and re-runnable from the admin console.

## Suggested order

E6 CRM sync first (it makes the lifecycle and qualification work already shipped commercially useful), then E7 admin visibility, then E4 profiles, then E8 analytics metadata.
