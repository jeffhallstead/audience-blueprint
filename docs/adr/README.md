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

## Numbering

Records are numbered sequentially with four leading zeros: `0001-record-architecture-decisions.md`. The number is assigned when the record is created and never reused.

## Adding a new ADR

1. Copy `0001-record-architecture-decisions.md` and rename it with the next available number.
2. Replace the title, context, decision, and consequences.
3. Set the status to `Proposed` or `Accepted`.
4. Link any related records.
5. Open a PR or commit the change to the main branch.
