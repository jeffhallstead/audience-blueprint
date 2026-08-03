Based on your answers, Publisher Blueprint™ should become a **distinct sub-brand** under your personal umbrella — close enough to borrow credibility, separate enough to raise, spin out, or sell without a full rebrand later.

## Strategic recommendation

**Architecture:** Product sub-brand with founder endorsement.

- The product's primary identity is **Publisher Blueprint™** (and Publisher OS™ / Publisher Copilot™ as feature names).
- Your name appears as an endorsement, not as the headline: e.g., "by Jeff Hallstead" or "from the team at Jeff Hallstead" in small type, not as the logo subtitle.
- Keep the legal entity, support email, and terms tied to you for now; the commercial surface can be product-first.
- This gives you the hybrid upside today (credibility + leads) while preserving the option to spin out or raise tomorrow without a jarring rebrand.

**Why this is the right middle ground for your answers:**
- *Hybrid intent* means the tool still needs to feel like it came from you, but it should also feel like a real product someone would pay $99–$588/year for.
- *Spin-out/raise* makes a personal-name lock-in risky; if you ever want to bring on a co-founder or investor, "Publisher Blueprint" is an asset, "Jeff Hallstead" is not.
- A sub-brand is the cheapest path to future optionality: you can strengthen or weaken the founder link over time without redesigning the product from scratch.

## What changes in the product

### 1. Brand hierarchy
- **Primary logo:** "Publisher Blueprint™" wordmark only; remove the "Jeff Hallstead" subtitle from the app logo and public header.
- **Founder endorsement:** Add a small, secondary "by Jeff Hallstead" line on the landing page, pricing page, and in the footer / legal area.
- **Email domain:** You already own `notify.jeffhallstead.com`. That is fine for transactional email, but consider acquiring `publisherblueprint.com` for marketing sends and the product's canonical URL if you want true separation.
- **Legal entity:** Keep seller identity as Jeff Hallstead for now; the terms/privacy already support this. No legal change needed until you incorporate a product entity.

### 2. Visual identity
You want to explore a new direction. The current palette (deep navy #040c1b, cyan #22d4f5, orange #e84c2b) is tied to jeffhallstead.com. For a product sub-brand, I recommend a **retained structure but refreshed expression**:
- Keep the dark-mode-first, executive aesthetic (it signals consulting-grade quality).
- Shift the accent from cyan to a more distinctive product color — e.g., a warm brass/gold, a deep amber, or an electric violet — to differentiate from the consulting site while keeping premium connotations.
- Replace the Rajdhani wordmark with a typeface that is still strong but more "product" than "consultant portfolio": e.g., Sora, Space Grotesk, or Plus Jakarta Sans.
- Remove the `/* brand pulled from jeffhallstead.com */` comment in the design system and replace it with a Publisher Blueprint product rationale.

### 3. Code changes required

| Area | Current state | Change |
| --- | --- | --- |
| `src/components/brand/logo.tsx` | "Publisher Blueprint" with "Jeff Hallstead" subtitle | Remove subtitle; keep product wordmark |
| `src/styles.css` | Navy/cyan palette, Rajdhani wordmark | Define new semantic tokens; swap font imports |
| `src/routes/__root.tsx` | Font loading | Update Google Fonts to new typeface |
| `src/routes/index.tsx` | Landing page | Add founder endorsement line; update hero copy |
| `src/routes/pricing.tsx` | Pricing page | Add "by Jeff Hallstead" endorsement; keep product-first |
| Legal pages | Terms/privacy/refund | No change needed; already use `SELLER` constants |
| `PRODUCT-SPEC.md` | Brand references | Update Part 1 to reflect sub-brand positioning |

### 4. Phases

**Phase A — Brand decision (this task)**
- Confirm the sub-brand direction and new color/type direction.
- I will produce 3 visual directions for you to choose from.

**Phase B — Core rebrand in code**
- Update logo, color tokens, typography, and landing/pricing copy.
- Keep all changes inside the design system; do not hardcode colors in components.

**Phase C — Touch-point cleanup**
- Audit remaining "Jeff Hallstead" references in user-facing UI (not legal terms).
- Update email templates and transactional copy to match product-first tone.

**Phase D — Optional domain/legal**
- If you acquire `publisherblueprint.com`, update canonical URLs and marketing email sender.

## Risks and mitigations

- **Risk:** Users who found you through your consulting site feel a disconnect.
  - *Mitigation:* Keep the founder endorsement visible on entry pages and maintain the same dark premium feel.
- **Risk:** Rebranding now delays other features.
  - *Mitigation:* Scope Phase B to logo + tokens + two public pages only; defer full copy rewrite.
- **Risk:** You later decide to go fully independent and have to rebrand again.
  - *Mitigation:* The sub-brand path already decouples product identity from personal name; the second step would just be removing the endorsement line, not redesigning the product.

## How to decide on the visual direction

Before I implement, I will generate three rendered design directions for the landing page and app chrome. Each direction will keep the executive dark-mode structure but explore a different accent color and typography treatment. You pick one, and I build it into the codebase exactly.

## Next step

Approve this plan, then I will:
1. Capture the current landing page and app chrome for reference.
2. Generate 3 visual directions.
3. Ask you to pick one.
4. Implement the chosen direction across the codebase.

**Note:** The preview is currently showing a hydration mismatch on the `/auth` route. That is unrelated to branding but should be fixed before any public rebrand goes live. I will include the auth fix in the build phase once you approve the plan.