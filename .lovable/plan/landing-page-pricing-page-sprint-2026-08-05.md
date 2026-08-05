# Landing Page & Pricing Page Sprint

Scope: `src/routes/index.tsx`, `src/routes/pricing.tsx`, `src/components/billing/pricing-table.tsx`, plan display copy in `src/lib/commerce/plans.ts`, and the auth page's signup entry. Nothing in the dashboard, assessment, scoring, or Copilot is touched. All copy is implemented exactly as written in the PRD.

## Order of work (per the PRD's Implementation Priority)

### Step 1 — Highest-priority fixes (shipped together, shown for review)

1. **CTA routing (Epic 1, Section 1).** Add an optional `plan` search param to `/auth` (`?mode=signup&plan=test`). Both landing CTAs link to that URL. The signup form opens in create-account mode with a visible free-tier line so the free entry point is unambiguous before the click and after it.
2. **Free tier CTA (Epic 2, Section 3).** The free card's button becomes state-aware:
   - unauthenticated → "Start free — no card required", routes to the same free-tier signup URL
   - logged in, free tier → "Your current plan" (disabled, unchanged)
   - logged in, paid tier → no button rendered

### Step 2 — Epic 1: Landing page

3. **Above the fold.** Replace H1 and subhead with the PRD copy; product name stays in the nav only. CTA label: "Begin the Publisher Test — it's free". Supporting line becomes "Approximately 12 minutes · Seven sections · Confidential · by Jeff Hallstead" (merging the current two lines).
4. **Guide section (new).** New section directly below the fold, above the feature cards, with the two PRD paragraphs styled as a personal aside. No photo unless you supply one.
5. **Stakes section (new).** Between the feature cards and the closing CTA: the single PRD paragraph, typography only, no icons or card.
6. **Feature rewrites.** Three new outcome headlines; descriptions 1 and 2 updated, description 3 kept verbatim.
7. **Closing CTA.** Same label and same free-tier routing as above the fold.

### Step 3 — Epic 2: Pricing page

8. **Header.** H1 "Start with a score. Leave with a plan." and subhead "The Publisher Test is free. The Blueprint gives you the full roadmap."
9. **Tier structure.** The Publisher OS™ card is removed from the pricing page entirely — two cards remain. Blueprint shows **$49**, cadence label "Founding Member Pricing", and a visible supporting line "Price increases after launch".
10. **Consulting path (new).** Plain paragraph below the cards with the PRD copy and a "Get in touch →" text link to https://jeffhallstead.com/contact. No card, no price, no feature list.
11. **Checkout price.** The Blueprint price object is updated to $49 in the payment provider's test environment so checkout charges match the page. It syncs to live on the next publish.

## Notes and judgment calls

- Removing the OS card is a **presentation change on the pricing page**. The OS tier, its entitlements, and existing subscriber access stay intact in the backend; nothing about existing customers changes.
- The Blueprint card currently advertises "Includes one month of Publisher OS™" as a highlight and a feature bullet. Since OS is no longer shown anywhere, those two OS references are dropped from the Blueprint card copy. Bundled-OS entitlement logic itself is untouched.
- The landing page's supporting line currently sits in two places (one line plus a separate "by Jeff Hallstead"); these merge into the single line the PRD specifies.

## Technical detail

- `src/routes/auth.tsx`: extend `searchSchema` with `plan: z.enum(["test"]).optional()`; when present, force signup mode and render the free-tier line.
- `src/components/billing/pricing-table.tsx`: filter out `tier === "os"`, add an `isAuthenticated` prop driving the free-card CTA, and render the founding-member supporting line.
- `src/lib/commerce/plans.ts`: Blueprint `priceLabel: "$49"`, `cadence: "Founding Member Pricing"`, new supporting line field, OS references removed from Blueprint bullets. The `PLANS` OS entry itself remains for entitlement naming.
- Payment provider: update the existing `publisher_blueprint_onetime` price to 4900 USD (test env).
