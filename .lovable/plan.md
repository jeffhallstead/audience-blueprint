## Goal
Make the Publisher Copilot page read as an ordered walkthrough by numbering its sections.

## What the page has today
Five unnumbered section headings in this order, all styled as small brass mono labels:
1. Strategy actions (primary objective cards)
2. Ask your strategist (suggested questions)
3. Secondary tools grid (simulator, prompts, extra deliverables) — currently has **no heading at all**
4. Recent deliverables
5. Recent conversations

## Changes

**Numbered section headings**
- Introduce a small shared `SectionHeading` component in the Copilot route (numbered badge + label + optional right-side action) so all sections are consistent.
- The badge is a circular/rounded brass-outlined chip containing the step number, followed by the existing mono uppercase label.
- Apply in order:
  - 1 — Start here: Strategy actions
  - 2 — Go deeper: more tools (new heading for the currently unlabeled secondary grid)
  - 3 — Ask your strategist
  - 4 — Your deliverables (Recent deliverables + Recent conversations sit side by side under one numbered heading, each keeping its own sub-label)
- Reorder so the secondary tools grid sits directly after strategy actions, keeping "generate → explore → ask → review" as a logical progression.

**Supporting copy**
- Add a one-line helper sentence under each numbered heading explaining what to do at that step (e.g. step 1: "Generate your core deliverables from your Publisher Index™ results").

**Accessibility / semantics**
- Numbers are decorative chips; headings stay real `h2` elements with the full text ("1. Start here: Strategy actions") available to screen readers via the heading text itself.

## Technical notes
- Single file touched: `src/routes/_authenticated/copilot.index.tsx`.
- Presentation-only — no changes to objectives config, document queries, generation logic, or entitlements.
- Uses existing tokens (`text-brass`, `border-brass/30`, `font-mono` label style); no new colors.
