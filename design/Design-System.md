# Design System — Executive Obsidian

**Status:** Active  
**Owner:** Jeff Hallstead  
**Purpose:** Single source of truth for visual design tokens, typography, components, and layout rules for the Publisher Blueprint™ application.

---

## Philosophy

Executive Obsidian is a premium, product-first identity for the SaaS application. It is intentionally distinct from the founder's consulting website aesthetic. The system is dark-first, minimal, high-contrast, and information-dense without clutter.

- Near-black surfaces.
- Indigo-violet as the primary product accent.
- Generous whitespace.
- Subtle elevation and borders.
- No playful illustrations.
- Card-driven dashboards.

## Brand tokens

### Color palette

| Token | Value | Usage |
| --- | --- | --- |
| `--background` | `#09090b` | Page background |
| `--surface` | `#0a0a0b` | Cards, panels, elevated surfaces |
| `--card` | `#111113` | Card backgrounds |
| `--foreground` | `#ffffff` | Primary text |
| `--primary` | `#6366f1` | Buttons, links, focus rings, accent |
| `--secondary` | `#18181b` | Secondary buttons, muted backgrounds |
| `--accent` | `#18181b` | Accent surface |
| `--accent-foreground` | `#a78bfa` | Accent text |
| `--brass` | `#6366f1` | Premium/product accent |
| `--success` | `#22c55e` | Positive states |
| `--warning` | `#f59e0b` | Warnings, caution |
| `--destructive` | `#ef4444` | Errors, destructive actions |
| `--border` | `rgba(255,255,255,0.1)` | Dividers, card borders |
| `--input` | `rgba(255,255,255,0.16)` | Input borders |
| `--ring` | `rgba(99,102,241,0.7)` | Focus rings |
| `--muted-foreground` | `rgba(255,255,255,0.6)` | Secondary text |

All colors are defined as OKLCH-friendly CSS variables in `src/styles.css` and exposed through Tailwind v4 `@theme` tokens.

### Typography

| Token | Font | Usage |
| --- | --- | --- |
| `--font-sans` | Plus Jakarta Sans | Body text, UI, labels |
| `--font-display` | Outfit | Headings, large numbers, hero text |
| `--font-mono` | DM Mono | Eyebrows, technical labels, code |
| `--font-wordmark` | Outfit | Logo wordmark, brand text |

#### Heading treatment

- `h1`, `h2`, `h3`: `letter-spacing: -0.02em` for a tighter, editorial feel.
- Wordmark: uppercase, `letter-spacing: 0.18em`, `font-weight: 700`.
- Eyebrow: uppercase, `letter-spacing: 0.16em`, `font-size: 0.6875rem`, `font-weight: 500`, muted foreground.

### Radii

| Token | Value |
| --- | --- |
| `--radius-sm` | `calc(var(--radius) - 4px)` |
| `--radius-md` | `calc(var(--radius) - 2px)` |
| `--radius-lg` | `var(--radius)` |
| `--radius-xl` | `calc(var(--radius) + 4px)` |
| `--radius-2xl` | `calc(var(--radius) + 8px)` |
| `--radius-3xl` | `calc(var(--radius) + 12px)` |

Base `--radius`: `0.5rem`.

### Elevation

| Token | Value |
| --- | --- |
| `--shadow-card` | `0 1px 2px rgb(0 0 0 / 30%), 0 8px 24px -12px rgb(0 0 0 / 45%)` |
| `--shadow-elevated` | `0 1px 2px rgb(0 0 0 / 35%), 0 24px 48px -24px rgb(0 0 0 / 60%)` |

## Semantic components

### Surface panel

```css
.surface-panel {
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
}
```

Use for cards, modals, and dashboard panels.

### Text display

```css
.text-display {
  font-family: var(--font-display);
  font-weight: 400;
  letter-spacing: -0.02em;
}
```

Use for page titles, large metric numbers, and hero copy.

### Text wordmark

```css
.text-wordmark {
  font-family: var(--font-wordmark);
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
```

Use for the logo and brand lockup.

### Text eyebrow

```css
.text-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  line-height: 1rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-muted-foreground);
}
```

Use for section labels, status tags, and technical metadata.

## Layout

- **App shell:** sidebar on desktop, sheet on mobile, with a top-level page header.
- **Page padding:** generous, responsive padding (`px-4 sm:px-6 lg:px-8`).
- **Card grid:** responsive grids with consistent gap (`gap-4` or `gap-6`).
- **Max content width:** constrain wide dashboards to a readable max-width (`max-w-7xl` or `max-w-8xl`).

## Dark mode

The system is dark-first. Dark mode tokens are defined and mirror the base tokens. A user-facing toggle is not shipped in v1; dark mode is the default.

## Component rules

1. **Never hardcode a color.** Always use semantic tokens (`bg-surface`, `text-primary`, `text-brass`, etc.).
2. **Use shadcn primitives.** Button, Card, Dialog, Input, Select, Sheet, etc., should be shadcn-compatible and themed through the tokens.
3. **Keep components small.** Business logic belongs in `src/lib/`, not in presentation components.
4. **Responsive first.** Every dashboard and card layout must work from mobile to desktop.
5. **Accessible.** Aim for WCAG AA contrast ratios; ensure focus states use `--ring`.

## Extension rules

When adding a new component or surface:

1. If a token exists, use it.
2. If a semantic class exists (`surface-panel`, `text-eyebrow`), use it.
3. If neither exists, add a new token or utility in `src/styles.css` and document it here.
4. Never introduce a one-off hex or RGB value in a component file.

## Relationship to brand

This design system is the product's own visual identity. It is documented as ADR 003 — Executive Obsidian Brand Direction. The founder's consulting website may evolve separately; the SaaS application does not need to mirror it.
