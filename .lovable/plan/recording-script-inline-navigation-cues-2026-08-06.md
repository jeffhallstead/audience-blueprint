# Recording Script: Inline Navigation Cues

## Goal
Rework `docs/screen-recording-script-publisher-blueprint-launch-share.md` so navigation actions live inside the narration flow, letting you read straight down the page while clicking through the app.

## What changes
- Replace the split "narration" + "shot list" structure with a single teleprompter-style script.
- Each beat becomes a block:
  - `[timecode]` + **DO:** one-line navigation action (what to click/scroll/show)
  - **SAY:** the exact word-for-word narration
- Keep all existing narration copy unchanged; only reposition and pair it with the matching on-screen action from the current shot list.
- Keep the recording brief at the top and the backup talking points + optional closing CTA at the bottom.
- Drop the separate shot-list table, since its content is now inline. Add a short "Before you hit record" checklist (tabs to pre-open, signed-in account, admin console access, browser zoom) so you're not navigating cold on camera.

## Technical detail
Single file edit: `docs/screen-recording-script-publisher-blueprint-launch-share.md`. No app code touched.
