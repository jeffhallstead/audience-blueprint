# Phase 02 — Publisher Index™ Assessment Engine

## Status

Shipped

## Goal

Transform the wizard into a config-driven assessment engine that produces a 0–100 Publisher Index™ score, six category scores, and maps the user to one of five maturity levels.

## Scope

### In scope

- Config-driven instrument in `src/lib/assessment/config.ts` (version v1).
- Seven sections: Company Profile, Audience Ownership, Content Capability, Distribution, Operations, Business Alignment, Growth Goals.
- Eight answer types: `single`, `multi`, `likert`, `number`, `select`, `text`, `url`.
- Normalized scoring (0–1) mapped to category scores (0–100) and overall Publisher Index (0–100).
- Six weighted categories: Audience (1.2), Content (1.1), Distribution (1.0), Operations (1.0), Strategy (0.8), Alignment (0.9).
- Five maturity levels: Observer (0), Publisher (35), Studio (55), Media Brand (72), Category Leader (86).
- Radar chart visualization of category scores.
- Autosave per answer and section-level progression telemetry.
- `assessment_scores` and `assessment_events` tables.

### Out of scope

- Peer benchmarking.
- Adaptive questioning.
- AI-generated interpretation.

## Success criteria

- Completing the wizard produces a deterministic score for any set of answers.
- Scores are persisted and retrievable.
- The radar chart renders accurately.
- Section drop-off is observable in `assessment_events`.

## Technical notes

- Scoring is deterministic and versioned (`config_version`).
- Likert maps to 0, 0.25, 0.5, 0.75, 1.0.
- Numeric answers use descending bands (e.g., email list size).
- Multi-select uses `maxScoredSelections` to define a full score.
- Single-select options carry explicit per-option scores.
- Text and URL questions are profile-only and do not affect scoring.

## Non-goals

- No AI augmentation.
- No A/B testing of question weights.
- No comparison against peer data.

## Compliance

- Product taxonomy: Section 4.
- Design system: Section 2.
- Engineering standards: Section 9.
- Event naming: Section 7 (`assessment.*`).
