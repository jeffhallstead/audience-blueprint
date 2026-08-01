## Problem

On `/copilot`, every strategy card always shows "Generate", even after a report exists. The page already loads all generated documents (`useDocuments()`), but never checks whether one matches the card's objective.

## Plan

1. **Match documents to objectives.** On the Copilot home page, build a lookup of the most recent non-archived document per `kind` from the documents already loaded. Each objective card's `id` equals the document `kind` (`strategy`, `roadmap`, `pillars`, `franchises`, `score`, `presentation`).

2. **Change the card action when a report exists.**
   - Primary button becomes "View my report" and links to `/copilot/documents/$documentId` for the latest matching document.
   - A secondary, quieter "Regenerate" action sits next to it so a new version can still be produced.
   - Cards with no document keep today's single "Generate" button. The "Ask Publisher Copilot™" card is unchanged.

3. **Show when it was generated.** Under the buttons, a small line like "Generated Aug 1, 2026" so it's obvious the report is existing work, not new.

4. **Same treatment for the secondary cards** (Executive Presentation) in the lower grid, so behavior is consistent.

## Technical notes

- Single file: `src/routes/_authenticated/copilot.index.tsx`. No schema, server function, or query changes — `useDocuments()` already returns everything needed, ordered by `created_at` desc.
- Guard rendering while documents are still loading so the button doesn't flip from "Generate" to "View my report" after paint; treat undefined data as "no report yet" but disable the generate action until loaded.
- Regenerate reuses the existing `runObjective` mutation and its navigate-on-success behavior.

## How to test

1. Go to `/copilot` — cards for objectives you've already run show "View my report" plus "Regenerate".
2. Click "View my report" — opens the existing document, no new AI generation.
3. Click "Regenerate" on one — a new document is created and opened; returning to `/copilot` shows the new date.
