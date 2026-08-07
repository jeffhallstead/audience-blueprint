# Pause live push and rewrite homepage copy

## Goal
Roll back the homepage to the pre-persona version so the user can rewrite the copy without the recent sales-material changes being live or visible in the preview. No further implementation of persona-driven website copy will happen until the user supplies the revised text.

## Plan

1. **Revert the homepage to the previous version** using the chat History tab — revert the AI message that introduced the persona cards, pricing-page selector, and dashboard persona banner. This restores the homepage copy that existed before the sales-material kit was wired into the site.

2. **Hold on implementing the remaining sales-material website changes** — the persona cards, pricing selector, and dashboard banner stay out of the code until the user is ready.

3. **User rewrites homepage copy** — the user drafts the new hero text, supporting lines, and any persona-aware section copy they want.

4. **After the copy is ready, implement the approved copy** into:
   - `src/routes/index.tsx` (hero, guide, stakes, feature cards, closing CTA, and any persona section)
   - `src/routes/pricing.tsx` (pricing-header copy, if changed)
   - `src/routes/_authenticated/dashboard.tsx` (persona banner copy, if kept)

## Out of scope for this plan
- No live publish or deploy.
- No changes to the backend, assessment engine, entitlements, or commerce.
- No new components or data models.

## Success criteria
- The homepage shows the pre-persona version.
- The preview does not contain the new sales-material copy the user wants to rewrite.
- The next build/publish only happens after the user has approved the new copy.
