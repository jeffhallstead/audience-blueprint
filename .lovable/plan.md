## What's actually happening

The button does save. I checked the database: six actions you clicked are stored (most recently "Launch Weekly Consolidated Flagship Newsletter" at 16:07 today), each linked to the document it came from.

The problem is that nothing ever displays them. The list query that reads saved actions exists in the code but is not used by a single page — the Blueprint, dashboard and roadmap never read it. So "Add to Blueprint" adds to a list nobody can see, and the button looks identical before and after clicking.

## Plan

1. **Add a "Saved from Copilot" section to the Blueprint page.** Below the recommendations/roadmap content, list every saved action with its title, category, impact/effort, source document link, and the date added. Empty state explains where they come from.

2. **Let you act on them there.** Each saved item gets: mark done, archive/remove, and a link back to the originating strategy document. Done/archived items drop out of the active list.

3. **Show the same items on the 90-day roadmap page** as an "Added from Copilot" column/section, so actions you pushed in sit alongside the generated plan rather than in a separate silo.

4. **Fix the button feedback.** In the strategy document view, an action already saved shows "Added" with a check and is disabled, instead of looking un-clicked. Clicking again on an unsaved action shows the toast plus a "View in Blueprint" link.

5. **Prevent duplicates.** Right now the same action can be added repeatedly (your data has "Launch Consolidated Flagship Newsletter Infrastructure" twice). Add a uniqueness guard per document + title so re-clicking is a no-op, and clean up the existing duplicate row.

## Technical notes

- `useSavedRecommendations` in `src/lib/copilot/queries.ts` is defined but unreferenced — wire it into `src/routes/_authenticated/blueprint.tsx` and `roadmap.tsx`.
- New presentational component `src/components/blueprint/saved-actions.tsx`; reuse `useToggleSavedStatus` for done/archive.
- `DocumentView` (`src/components/copilot/document-view.tsx`) reads the saved list to derive per-action saved state by `document_id` + `title`.
- Migration: partial unique index on `saved_recommendations (user_id, document_id, title)` where status is not archived, after removing the one duplicate row.
- Grants and RLS on `saved_recommendations` are already correct — no change needed there.

## How to test

1. Open a strategy document, click "Add to Blueprint" — the button flips to "Added".
2. Go to `/blueprint`, scroll to "Saved from Copilot" — your six existing saved actions should already be listed.
3. Mark one done and archive another; both leave the active list and the roadmap section updates.
