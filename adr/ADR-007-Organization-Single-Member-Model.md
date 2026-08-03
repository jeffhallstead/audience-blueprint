# ADR 0007: Organization Single-Member Model with Members Table

## Status

Accepted

## Context

The product needs a clear identity for billing, CRM, and strategic output. The original schema had an `organizations` table with a 1:1 relationship to the user created at registration. As the product grew, the founder wanted to support team use in the future without re-architecting later. Options included keeping the user as the primary identity, extending the organization to support multiple users, or removing the organization concept entirely.

## Decision

We will keep the **organization** as the primary identity for strategic output, billing, and CRM, but we will enforce a **single-member model** for now. The `organization_members` table is added to support future multi-user teams, but the application logic enforces one primary member per organization. The primary user's profile (email domain, region, business model) defines the organization's identity. When a user signs up or completes the assessment, a shared organization identity is upserted and linked to the user.

## Consequences

- **Positive**: Future team functionality can be added without a painful data migration.
- **Positive**: CRM, lifecycle, and qualification all target a single organizational entity.
- **Positive**: The primary region and business model are captured at intake, enabling ICP scoring.
- **Negative**: Extra join complexity compared to a pure user-centric model.
- **Negative**: Some features (e.g., team invites, role-based access) must be explicitly disabled or gated until multi-user support is ready.
- **Neutral**: The `organization_audit` table records changes to the organization profile for traceability.

## Related records

- ADR 0005: Platform Event Architecture — organization-scoped events are a core part of the event model.
- ADR 0006: Customer Lifecycle and Qualification Engine — the organization is the target for lifecycle and qualification.
- ADR 0008: Airtable as Primary CRM — the organization is the entity synced to Airtable.

## PRD origin

PRD Phase 6 v2.0 — Epic E1 (Organization Profile Foundation) and extended organization profiles.
