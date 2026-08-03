# ADR 0005: Immutable Platform Event Store

## Status

Accepted

## Context

Analytics, lifecycle, qualification, and CRM sync were originally spread across several tables and ad-hoc calls (`assessment_events`, commerce events, and direct analytics writes). As the platform added lifecycle stages, qualification tiers, and CRM integrations, it became clear that downstream systems needed a single, authoritative event stream. We considered a time-series database, a separate events table, or direct aggregation from existing tables.

## Decision

We will introduce a single, immutable **`platform_events`** table as the central event store. All significant user, commerce, and system actions will be written as append-only events with an `event_id` (ULID), `event_type` (namespaced), `payload` (JSONB), and optional `actor_id` / `organization_id`. Events are immutable once inserted. Legacy events will be backfilled into this table, and new code will dual-write to legacy locations and `platform_events` until the legacy tables are fully deprecated.

## Consequences

- **Positive**: One source of truth for lifecycle, qualification, and analytics.
- **Positive**: Event stream is queryable with PostgreSQL JSONB and standard SQL.
- **Positive**: De-duplication and versioning are built into the schema (ULID, version, checksum).
- **Negative**: Append-only tables grow unbounded; a retention/archival strategy will be needed later.
- **Negative**: Dual-write to legacy tables increases write path complexity until legacy tables are removed.
- **Neutral**: The event catalog is defined in TypeScript (`src/lib/events/catalog.ts`) to keep producers consistent.

## Related records

- ADR 0002: TanStack Start + Supabase — the event store is implemented in PostgreSQL.
- ADR 0006: Customer Lifecycle and Qualification Engine — lifecycle and qualification derive from this event stream.
- ADR 0008: Airtable as Primary CRM — CRM sync consumes events from the platform event store.

## PRD origin

PRD Phase 6 v2.0 — Epic E2 (Platform Event Store) and Epic E3/E4 (Lifecycle and Qualification Engine).
