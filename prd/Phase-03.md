# Phase 03 — Strategic Dashboard and 90-Day Roadmap

## Status

Shipped

## Goal

Transform the raw assessment score into a consulting-quality strategic assessment: an executive dashboard, opportunity matrix, KPI framework, and editable 90-day roadmap.

## Scope

### In scope

- Executive dashboard with Publisher Level, Overall Score, Top Opportunity, Top Risk, Recommended Priority, and Next 90 Days.
- Opportunity matrix (impact × effort) for recommendations.
- KPI grid with category-specific metrics.
- Full narrative blueprint (`/blueprint`) with recommendations, saved actions, and exportable sections.
- Editable 90-day roadmap with Month 1, Month 2, Month 3 phases, owners, status, and position.
- Rule engine (`src/lib/blueprint/rules.ts`, version `rules-v1`) that selects and ranks narrative copy based on category score bands.
- Score bands: Strong (70+), Developing (45–69), Critical (<45).
- `blueprints`, `recommendations`, and `roadmaps` tables.

### Out of scope

- AI-generated narrative (still uses rule-selected copy).
- PDF export.
- Progress tracking against roadmap.
- Roadmap templates.

## Success criteria

- A completed assessment generates a unique blueprint and roadmap.
- The dashboard and blueprint are visually consistent with the design system.
- Recommendations can be saved from the strategy library or Copilot documents.
- The roadmap is editable in place.

## Technical notes

- The rule engine keeps copy out of components; the engine selects and ranks entries.
- Recommendations are ranked by category score, impact, and effort.
- The blueprint is the AI seam: the rules-generated payload can be replaced by AI-generated content without UI changes.
- Roadmap items are tied to a `blueprint_id` and owned by `user_id`.

## Non-goals

- No automated project management integrations yet.
- No reassessment or blueprint versioning.
- No custom KPIs.

## Compliance

- Product taxonomy: Section 4.
- Design system: Section 2 (semantic tokens, no hardcoded colors).
- Engineering standards: Section 9.
- Event naming: Section 7 (`blueprint.*`).
