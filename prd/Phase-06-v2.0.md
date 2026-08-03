# Phase 06 v2.0 — Organization Intelligence Platform

## Status

Shipped

## Goal

Move the product from a user-centric assessment tool to an organization-centric platform with a shared identity, immutable event store, derived lifecycle, qualification engine, CRM sync, and internal admin console.

## Scope

### In scope

- Organization profile foundation: extended `organizations` table, `organization_members`, `organization_audit`, intake step, and settings panel.
- Platform event store: immutable `platform_events` table with versioning, deduplication, and backfill from legacy events.
- Customer lifecycle: `customer_lifecycle` table derived from `platform_events` (visitor → registered → assessment_started → assessment_completed → blueprint_owner → os_subscriber → churned).
- Qualification engine: `customer_qualification` table with fit score (organization profile) + engagement score (event counts) mapping to five tiers.
- Extended organization profiles: `organization_audience_profile`, `organization_marketing_profile`, `organization_content_ops_profile` with versioned 1:1 relationships.
- CRM sync driven by canonical events: Airtable live, HubSpot dormant-ready, via `integration_outbox`.
- Admin console expansion: customer lifecycle, qualification, organizations, event monitor, and integrations tabs.
- Acquisition tracking: first-touch UTM/referrer/landing path captured on first visit and flushed to the profile once authenticated.
- Recommendation engagement telemetry: `recommendation_metadata` tracking view/save/export/complete.

### Out of scope

- Team invites (single-member orgs remain enforced).
- Peer benchmarking.
- PDF export.
- Public API.

## Success criteria

- Every significant user, commerce, and system action is recorded as a `platform_event`.
- Lifecycle and qualification are automatically recomputed when qualifying events land.
- Airtable receives lifecycle and qualification changes via the outbox.
- Admins can search organizations, view event streams, and audit profile changes.
- Acquisition data persists to the user's profile after sign-up.

## Technical notes

- `platform_events` is append-only; immutability is enforced by application convention.
- Event catalog is defined in `src/lib/events/catalog.ts`.
- Derived state is cached in `customer_lifecycle` and `customer_qualification` but computed from events.
- RLS pattern: owner-scoped for users, admin read via `has_role`.
- CRM sync is rate-limited and retryable via `integration_outbox`.

## Non-goals

- No historical data deletion or GDPR erasure workflow.
- No real-time analytics warehouse.
- No multi-currency expansion.

## Compliance

- Product Constitution v2.0: Sections 4 (taxonomy), 6 (database), 7 (events), 8 (AI), 9 (engineering).
- Related ADRs: ADR 005 (Event Architecture), ADR 006 (Lifecycle/Qualification), ADR 007 (Organization Model), ADR 008 (CRM).
