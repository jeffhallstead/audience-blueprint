Remove the persona sections from the homepage

## Goal
Remove the two persona-driven sections from the landing page so the homepage returns to the pre-persona version while the user rewrites the copy.

## Changes

1. Edit `src/routes/index.tsx`:
   - Remove the `PersonaCards` import and its rendered `<PersonaCards />` element (the "Which of these sounds like you?" section).
   - Remove the `PersonaSelector` import and its rendered `<PersonaSelector />` element (the "Not sure which path fits you?" section).
   - Remove the `PersonalizationProof` import if it was only introduced as part of the persona section and the user wants it gone; otherwise leave it.

2. Verify the homepage builds and renders cleanly without the persona sections.

## Out of scope
- No copy rewrites or new homepage copy.
- No changes to pricing, dashboard, or other routes.
- No backend or commerce changes.
- No publishing.

## Success criteria
- The homepage no longer displays the "Which of these sounds like you?" card grid.
- The homepage no longer displays the "Not sure which path fits you?" selector/FAQ.
- The remaining homepage sections (hero, Jeff's statement, pillars, personalization proof, closing CTA, footer) remain intact.
