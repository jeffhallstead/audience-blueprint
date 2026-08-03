# Architecture Decision Records (ADRs)

This folder contains the Architecture Decision Records for the Publisher Blueprint™ application.

## What is an ADR?

An ADR is a short document that captures a significant architectural decision, the context in which it was made, and the consequences of that decision. ADRs are immutable once accepted; if a decision is later changed, a new ADR supersedes the old one rather than editing the original record.

## Format

Each record is a Markdown file in the standard structure:

- **Title**: Number + short descriptive name
- **Status**: Proposed / Accepted / Deprecated / Superseded by [link]
- **Context**: The problem, constraints, and forces that demanded a decision
- **Decision**: What we decided to do and the reasoning
- **Consequences**: The positive, negative, and neutral results of the decision
- **Related records**: Links to other ADRs that this one builds on or replaces
- **PRD origin**: The PRD phase or version that drove the decision, if applicable

## Naming convention

Records are named `ADR-XXX-Short-Title.md` with sequential three-digit numbers. Example: `ADR-003-Executive-Obsidian.md`.

## Numbering

Numbers are assigned when the record is created and never reused. The current sequence is:

- ADR-001 — Record Architecture Decisions
- ADR-002 — TanStack Start + Supabase Backend
- ADR-003 — Executive Obsidian Brand Direction
- ADR-004 — Paddle Sandbox Commerce
- ADR-005 — Event Architecture
- ADR-006 — Lifecycle and Qualification Engine
- ADR-007 — Organization Single-Member Model
- ADR-008 — Airtable as Primary CRM
- ADR-009 — Gemini AI Gateway for Copilot

## Adding a new ADR

1. Create the next numbered file following the naming convention.
2. Replace the title, context, decision, and consequences.
3. Set the status to `Proposed` or `Accepted`.
4. Link any related records.
5. Open a PR or commit the change to the main branch.

## Compliance

All ADRs must comply with `Product-Constitution-v2.0.md`, Section 3 (Naming conventions) and Section 9 (Engineering standards).
