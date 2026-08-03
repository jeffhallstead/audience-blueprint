# ADR 0001: Record Architecture Decisions

## Status

Accepted

## Context

Publisher Blueprint™ is a multi-phase product that has moved from a simple lead-magnet concept to a full-stack SaaS application with commerce, AI, CRM integrations, and an internal admin console. As the surface area grows, the rationale behind earlier choices becomes harder to reconstruct from code and pull requests alone. We need a lightweight, durable record of the decisions that shaped the product so that future contributors, the founder, and potential acquirers can understand why the system is built the way it is.

## Decision

We will maintain a collection of Architecture Decision Records in `docs/adr/` at the repo root. Each record will be a standalone Markdown file describing one consequential decision, the forces that led to it, and the resulting trade-offs. Records will be immutable once accepted; if a decision changes, a new ADR will supersede the old one.

## Consequences

- **Positive**: Decisions are discoverable, searchable, and documented in version control alongside the code.
- **Positive**: Future changes can be evaluated against the original reasoning rather than guessed from implementation.
- **Positive**: Onboarding new contributors becomes easier because the "why" is recorded.
- **Negative**: Maintaining ADRs requires discipline; short-sighted changes can be made without updating records.
- **Neutral**: ADRs are not a substitute for in-code documentation or a full product specification. They complement the existing `PRODUCT-SPEC.md` and `ARCHITECTURE.md`.

## Related records

- All subsequent ADRs.

## PRD origin

Phase 6 v2.0 — Organization Intelligence Platform and ongoing operational maturity.
