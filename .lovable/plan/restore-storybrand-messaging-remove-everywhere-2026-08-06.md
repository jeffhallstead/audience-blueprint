# Restore StoryBrand messaging + remove ™ everywhere

Two changes: bring back benefit-led messaging under the SEO-optimized homepage heading, and strip the ™ symbol from the entire product.

## 1. Homepage: keep the short H1, add StoryBrand back underneath

The H1 stays exactly as optimized for search:

> Publisher Blueprint: Strategy OS for Publishers

Directly below it, a new benefit-led block (styled as a large lead paragraph, not a heading, so it can't compete with the H1 in search):

> **Most brands rent their audience. The ones that win, own it.**
>
> You're spending to reach people who disappear the moment the budget stops. The Publisher Test scores your content operation across seven dimensions, shows you exactly where you're leaking audience, and hands you a prioritized 90-day plan to fix it.

The existing supporting line ("Approximately 12 minutes · Seven sections · Confidential · by Jeff Hallstead") and both CTAs stay as they are.

The bolded line renders as a `<p>` with display-weight styling — visually it reads like a subheading, structurally it's body copy, so the single H1 and heading hierarchy stay clean for Google.

Everything else on the page (guide section, three pillars, personalization proof, stakes paragraph, closing CTA) is untouched — that StoryBrand structure is still intact; only the above-the-fold promise was lost.

## 2. Remove ™ from the product

The symbol currently appears in ~70 files. Remove every occurrence of ™ from user-facing text: marketing pages, page titles and meta descriptions, JSON-LD, the logo wordmark, dashboard, assessment, Copilot, admin, PDF exports, email templates, legal pages, and AI prompt text.

Names themselves are unchanged — "Publisher Blueprint", "Publisher Test", "Publisher Index", "Publisher OS" all stay, just without the symbol.

Note: `src/lib/legal.ts` lists the trading name as "Publisher Blueprint™"; that becomes "Publisher Blueprint" and flows through Terms, Privacy, and Refund Policy automatically.

## Technical detail

- `src/routes/index.tsx`: insert the lead block between the `<h1>` and the existing muted subhead; replace the current subhead paragraph's first sentence so the two don't repeat the same claim.
- Site-wide ™ removal via a scripted replace across `src/`, then a typecheck and a visual pass on `/`, `/pricing`, and the dashboard.
- No schema, entitlement, or pricing logic changes.
