# Phase 01 — MVP Foundation

## Status

Shipped

## Goal

Build the first production-ready version of the Publisher Blueprint™ web application: a premium executive strategy platform that lets a marketing leader complete a structured intake and receive a placeholder strategic dashboard and roadmap.

## Scope

### In scope

- Responsive web application with a premium executive aesthetic.
- Authentication via email/password and Google sign-in.
- Supabase backend with PostgreSQL, normalized schema, and RLS.
- TanStack Start + React 19 + Tailwind CSS v4.
- Sidebar navigation with Dashboard, My Blueprint, Roadmap, AI Toolkit, Resources, and Settings.
- Multi-step wizard with progress tracking (7 sections: Company Profile, Audience, Content, Distribution, Operations, Goals, Constraints).
- Processing screen and executive dashboard with placeholder cards.
- Editable 90-day roadmap (Month 1, Month 2, Month 3).
- Settings page with basic profile.
- Reusable UI components: Progress Bar, Question Card, Score Card, Dashboard Card, Metric Tile, Timeline, Roadmap Card, Recommendation Card.

### Out of scope

- AI generation.
- Real scoring engine.
- Payments.
- PDF export.
- CRM integrations.
- Team collaboration.

## Success criteria

- A new user can sign up, complete the wizard, and see a dashboard.
- All pages are responsive and use the design tokens.
- Database schema supports future phases without re-architecture.

## Technical notes

- Tables: `profiles`, `organizations`, `assessments`, `assessment_answers`, `blueprints`, `roadmaps`, `recommendations`.
- Trigger creates a `profiles` row on auth signup.
- All data access is scoped through RLS.
- `src/lib/placeholder-blueprint.ts` is the AI seam: it will be replaced by generated content in later phases.

## Non-goals

- No real payments or entitlements.
- No AI recommendation logic.
- No outbound integrations.

## Compliance

This phase predates the Product Constitution v2.0 but was later aligned with the Executive Obsidian brand direction in ADR 003.
