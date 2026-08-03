# ADR 0003: Executive Obsidian Product-First Brand Direction

## Status

Accepted

## Context

The product originally borrowed the visual identity of the founder's consulting website (jeffhallstead.com), which used navy surfaces, cyan and orange accents, and a Rajdhani wordmark. As Publisher Blueprint™ matured from a lead magnet into a full SaaS platform, the consulting-site aesthetic felt too generic and no longer communicated the product's premium, executive positioning. We had to decide whether to keep the original branding or migrate the application to its own distinctive identity.

## Decision

We will migrate the application to a dedicated **Executive Obsidian** product-first brand identity: near-black surfaces (`#09090b`), indigo-violet accent, and **Plus Jakarta Sans** / **Outfit** typography. The logo and copy will shift from "owned-audience readiness" language to "publishing maturity" language. The consulting website remains the founder's personal brand, but the SaaS application gets its own premium visual system.

## Consequences

- **Positive**: The product looks and feels like a standalone SaaS rather than an extension of a services site.
- **Positive**: The dark, minimal palette differentiates the app from typical bright SaaS tools.
- **Positive**: Clear brand hierarchy: Publisher Blueprint™ is the product identity; "by Jeff Hallstead" is a secondary endorsement line.
- **Negative**: Initial rollout required updating `src/styles.css`, the logo component, and all marketing copy.
- **Negative**: Any future marketing assets (landing page, emails, pitch decks) must follow the new system rather than the website style.
- **Neutral**: Brand tokens are centralized in `src/styles.css` and component variants; no hardcoded color utilities are allowed in components.

## Related records

- ADR 0002: TanStack Start + Supabase — the design system is implemented in Tailwind CSS v4 within the same stack.

## PRD origin

Brand-direction conversation during Phase 6 — migrating from a lead-magnet tool to a mature SaaS product.
