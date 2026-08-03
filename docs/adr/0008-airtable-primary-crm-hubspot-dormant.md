# ADR 0008: Airtable as Primary CRM, HubSpot Dormant-Ready

## Status

Accepted

## Context

The founder uses Airtable for marketing operations and may adopt HubSpot in the future. The platform needs to sync platform events, lifecycle changes, and qualification updates to a CRM so that sales and marketing workflows can react. Building a custom CRM is out of scope. The decision was which CRM to wire first and how to keep the second one ready.

## Decision

We will use **Airtable** as the live CRM, with a record per organization and event-driven updates for lifecycle, qualification, and profile changes. The integration layer will be provider-agnostic: an `IntegrationAdapter` interface, a `user_integration_credentials` table for encrypted tokens, and an `integration_outbox` for rate-limited, retryable outbound calls. HubSpot will be implemented as a dormant adapter with the same interface but will not be enabled by default.

## Consequences

- **Positive**: Airtable is already in the founder's operational stack.
- **Positive**: The adapter pattern makes adding HubSpot (or another CRM) a matter of implementing one interface.
- **Positive**: Credential storage is encrypted with AES-256-GCM and scoped per user.
- **Negative**: Each CRM adapter has provider-specific rate limits and payload mapping that must be maintained.
- **Negative**: Outbox processing introduces eventual consistency; CRM records may lag behind the platform by seconds or minutes.
- **Neutral**: The `integration_outbox` can also support non-CRM destinations (e.g., Asana for task creation) without structural changes.

## Related records

- ADR 0002: TanStack Start + Supabase — credentials and outbox are stored in Supabase.
- ADR 0005: Platform Event Architecture — CRM sync is triggered by platform events.
- ADR 0007: Organization Single-Member Model — the organization is the CRM identity.

## PRD origin

PRD Phase 6 v2.0 — CRM sync (E6) and integration infrastructure.
