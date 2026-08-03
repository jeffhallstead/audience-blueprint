# Phase 07 — Maturity, Export, and Platform Expansion

## Status

Planned

## Goal

Extend the product from a single-user strategy tool to a mature platform with team collaboration, reliable PDF export, mobile parity, and data-driven differentiation.

## Scope

### In scope

- PDF export of the full blueprint and roadmap (server-side rendering).
- Mobile OAuth stability: reliable sign-in in embedded and standalone mobile browsers.
- Reassessment flow for Publisher OS™ subscribers with blueprint history.
- Progress tracking against the 90-day roadmap.
- Admin console hardening: organization detail view, event monitor, audit log browser.
- HubSpot adapter activation (move from dormant-ready to live).
- Improved onboarding and first-value delivery for free users.

### Out of scope

- Team plans and multi-member organizations (tentatively Later).
- Peer benchmarking (tentatively Later).
- White-label API (tentatively Later).
- Mobile native app.

## Success criteria

- "Export PDF" produces a downloadable PDF.
- Mobile sign-in success rate matches desktop.
- OS subscribers can reassess and compare blueprint history.
- Admin can inspect any organization, event stream, or audit trail.
- HubSpot can be connected and receive the same CRM events as Airtable.

## Technical notes

- PDF export should reuse the existing blueprint and roadmap components or a print-safe renderer.
- Reassessment creates a new `assessments` row and a new `blueprints` row, linked to the same organization.
- Progress tracking updates roadmap item statuses and emits `blueprint.*` events.
- HubSpot adapter follows the same `IntegrationAdapter` interface as Airtable.

## Non-goals

- No new assessment instrument version.
- No new pricing tier.
- No public REST API.

## Compliance

- Product Constitution v2.0: Sections 4, 6, 7, 8, 9.
- Related ADRs: ADR 004 (Paddle Commerce), ADR 008 (CRM), ADR 009 (AI Gateway).
