# Reposition Publisher Blueprint as a consultative lead magnet

## Goal

Turn the product-led funnel (free Publisher Test → $49 Blueprint → OS) into a sales-led funnel. The Publisher Test stays free and public and is the only thing a visitor can complete on their own. The full Blueprint becomes the deliverable Jeff or a sales rep presents on a booked call. Publisher OS disappears from public messaging and remains an internal-only possibility for later.

## The new funnel

```text
Visitor  →  Free Publisher Test  →  Score + category readings
                                        ↓
                              "Book a call" → jeffhallstead.com/contact
                                        ↓
                    Jeff/analyst opens the full Blueprint internally
                          and walks the prospect through it
```

## Decisions locked in

- No existing paid customers, so no refunds or grandfathering are needed.
- Internal role is named **analyst**. Every current non-admin account that needs Blueprint access gets it; admins already have full access.
- Publisher OS is removed from all public messaging but stays in the codebase for internal use later.
- The pricing page is deprecated.
- Clicking "Book a call" emits a tracked event so leads can be attributed to persona and assessment source.
- Admins can delete user accounts from the admin console.

## What changes

### 1. Access model

- Add `analyst` to the `app_role` enum.
- Assign the `analyst` role to existing non-admin accounts so the internal team retains Blueprint access.
- Entitlement resolution changes so Blueprint and OS tiers are reachable only by `admin` or `analyst` roles. Purchases and subscriptions no longer grant access on their own (rows stay for record-keeping).
- Everything Blueprint-gated stays locked for ordinary users: full dashboard, roadmap, Copilot, AI documents, PDF export, file exports, email report, connectors.

### 2. Pricing page deprecated

- `/pricing` no longer sells anything. It redirects to the homepage, and the "Pricing" links in the header and footer are replaced with "Book a call".
- The route is kept as a redirect so existing links and search results do not 404. Its structured-data offers and pricing metadata are removed.
- `PersonalizationProof` and `PersonaSelector`, currently on the pricing page, move to the homepage so that content is not lost.

### 3. Public messaging

- **Homepage**: primary CTA stays "Begin the Publisher Test — it's free". A secondary "Book a call" CTA is added to the hero and the closing section. Closing copy explains the Blueprint is delivered live on a call.
- **Persona cards**: consulting-fit personas (Paid Media Plateau, Campaign Factory, Orphaned Audience, Stalled Studio) lead with "Book a call". Funded Builder and Curious Observer keep the free-test CTA.
- **Persona data** in `src/lib/personas.ts`: offer lines that mention "$49 Blueprint" or "OS" are rewritten to consulting language.
- No mention of Publisher OS, $49, tiers, or upgrades anywhere public.

### 4. Post-assessment experience

- **Results page**: shows the free score, maturity level, category breakdown, radar, strengths and gaps. Bottom CTA becomes "Book a call to get your full Blueprint".
- **Dashboard**: free users keep the score ring, maturity ladder, and six category cards. Download PDF and Email report buttons are removed for them. The locked sections show a "Book a call" panel instead of an upgrade CTA.
- **Persona banner**: CTA routes to the contact page for consulting-fit personas.
- Checkout entry points are removed from every user-facing surface.

### 5. Book-a-call tracking

- A shared `BookACallButton` component fires a platform event before opening `https://jeffhallstead.com/contact` in a new tab.
- The event records where the click came from (homepage hero, persona card, dashboard banner, results page), the persona id when known, and the user's maturity level and weakest category when signed in.
- The event is added to the event catalog so it flows into the admin lead workbench and the existing Airtable sync, letting you see which persona produced each booking intent.

### 6. Admin console

- New **Delete user** action per account row, behind a confirmation dialog that requires typing the email. It cancels any Stripe subscription first, then removes the auth user; owned rows cascade.
- Admin-triggered account deletion is recorded as a platform event for auditability.
- The existing grant dialog is extended so an admin can assign or remove the `analyst` role, replacing "grant a paid tier" as the everyday internal-access mechanism.
- Revenue and subscription metrics stay on the console but are relabeled as historical.

### 7. Internal Blueprint delivery

- Admin and analyst accounts see the complete Blueprint, roadmap, Copilot, exports and PDF exactly as today.
- The admin console gets a "View Blueprint" action per account so Jeff or an analyst can open a prospect's full report before or during the call.

### 8. Legal and SEO

- Refund policy and terms are updated to reflect that nothing is sold on the site.
- Sitemap drops `/pricing`.
- Homepage and dashboard metadata drop price and tier language.

## Technical notes

- Migration: extend the `app_role` enum with `analyst`; role rows are inserted separately as a data operation.
- `resolveEntitlement` in `src/lib/commerce/entitlement.server.ts` gains a role lookup and gates non-free tiers behind `admin`/`analyst`.
- `src/lib/commerce/plans.ts` keeps the tier and feature model intact (internal users still resolve to `blueprint`/`os`), but the public `PLANS` array is no longer rendered anywhere.
- Stripe code, webhook, and checkout components stay in place, unreferenced by public UI, so the OS launch does not need a rebuild.
- `useIsAdmin` is joined by a `useIsInternal` hook covering admin or analyst.
- Account deletion reuses the subscription-cancel logic already in `src/lib/commerce/account.functions.ts`, invoked with admin privileges.

## Testing checklist

- [ ] Free user completes the test, sees score and categories, and the only forward action is "Book a call".
- [ ] Free user cannot reach roadmap, Copilot, PDF, email report, or exports.
- [ ] `/pricing` redirects; no pricing or OS language appears on any public page.
- [ ] "Book a call" clicks produce events visible in the admin Events and Leads panels.
- [ ] An admin can assign the analyst role and that user immediately sees the full Blueprint.
- [ ] An admin can open any account's full Blueprint from the console.
- [ ] An admin can delete an account after confirmation, and the deletion is logged.
- [ ] No checkout dialog is reachable from any user-facing route.
