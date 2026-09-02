# Rebrand: adopt the Content Strategy Hub editorial identity

Replace the current dark "Executive Obsidian" look with the light editorial system used by Content Strategy Hub: white paper background, near-black ink, black serif headlines, quiet sans body, and near-zero decorative color.

## What changes visually

- Background flips from near-black (#09090b) to white; text becomes near-black (#111111).
- Headings switch to an editorial serif (Georgia stack); body/UI switches to a neutral sans (Helvetica/Arial stack). The current Outfit / Plus Jakarta Sans / DM Mono web fonts are dropped.
- Primary action color becomes black with white text instead of indigo-violet.
- Panels become white cards with a hairline rule and a very soft shadow instead of dark elevated cards.
- Status colors move to muted editorial tones: green #15803d, amber #b45309, red #b91c1c.

## Files to change

1. `src/styles.css` — the main work. Port the Content Strategy Hub token block: `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--border`, `--input`, `--ring`, status colors, `--radius: 0.375rem`, `--shadow-card`, and the serif/sans font stacks. Keep the project's extra tokens that components already depend on so nothing breaks: `--surface`, `--brass` (remapped to the new ink/accent), chart colors, and the full sidebar token set. Rewrite `.dark` to mirror the light values (the app is single-theme) and update `surface-panel`, `text-display`, `text-eyebrow`, and `text-wordmark` utilities to the new editorial definitions.
2. `src/routes/__root.tsx` — remove the Google Fonts `<link>` for Outfit / Plus Jakarta Sans / DM Mono, since the new system uses system fonts.
3. `src/components/brand/logo.tsx` — restyle the wordmark for a light surface: black icon tile with white glyph, serif or tight-tracked wordmark in ink.
4. Small cleanups where a component assumes a dark surface — `src/components/copilot/simulation-view.tsx`, `src/components/copilot/document-view.tsx`, `src/components/blueprint/roadmap-phase-card.tsx`, `src/components/billing/pricing-table.tsx`, `src/components/billing/billing-panel.tsx` — swap any hardcoded white/black utility for the matching semantic token.
5. `design/Design-System.md` and a new ADR (`adr/ADR-010-...`) documenting the switch away from Executive Obsidian.

## Technical notes

Nearly all components already consume semantic tokens rather than raw colors, so the flip is driven from `src/styles.css`. `--brass` is used in ~20 files as the premium accent; rather than removing it, it gets remapped to the editorial ink/accent value so those call sites keep working without edits.

## Out of scope (unless you want it included)

Generated marketing assets — the newsletter ad PNGs, the LinkedIn thumbnails, and the PDF guide / offer deck scripts — still render in Executive Obsidian. They can be regenerated in the new identity as a follow-up.

## Verification

Walk the light theme across the landing page, the free Publisher Test, the wizard, the dashboard, the roadmap, Copilot, pricing, and admin — checking contrast, focus rings, and that no panel is left with dark-on-dark or white-on-white text.
