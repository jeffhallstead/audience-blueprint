# ADR 0006: Customer Lifecycle and Qualification Derived from Platform Events

## Status

Accepted

## Context

Tracking whether a visitor is a subscriber, lead, customer, or churned subscriber is essential for sales and marketing operations. The qualification engine also needs to know who is a good fit (ICP) and who is engaged. We could store these states as columns on a user or organization table, but that would require updating state in many places and would make history opaque. The alternative is to derive the current stage and tier from the immutable event stream.

## Decision

We will store derived lifecycle and qualification state in a `customer_lifecycle` table, but the values will be **computed from `platform_events`** rather than being updated directly by business logic. Whenever a qualifying event (signup, assessment completion, purchase, cancellation, churn, etc.) is emitted, the emission pipeline will call `syncDerivedFor` to recompute the lifecycle stage and qualification tier for the affected organization. The fit portion of qualification will also incorporate organization profile completeness and deep-profile signals.

## Consequences

- **Positive**: State is reconstructable from the event log; history is preserved.
- **Positive**: Adding a new lifecycle or qualification rule does not require changing every write path.
- **Positive**: Admin tooling can rebuild all derived state from a single command.
- **Negative**: Derivation is slightly more compute-intensive than updating a column on every action.
- **Negative**: A bug in the event stream or derivation logic can corrupt the derived state for many users.
- **Neutral**: The `customer_lifecycle` table caches the latest derived state so reads remain fast.

## Related records

- ADR 0005: Platform Event Architecture — the source of truth for derivation.
- ADR 0007: Organization Single-Member Model — the organization is the primary entity for lifecycle and qualification.

## PRD origin

PRD Phase 6 v2.0 — Epic E3 (Lifecycle Infrastructure) and Epic E4 (Qualification Infrastructure).
