# Design System — Editorial White Paper

**Status:** Active (supersedes Executive Obsidian)  
**Owner:** Jeff Hallstead  
**Purpose:** Single source of truth for visual design tokens, typography, components, and layout rules for the Publisher Blueprint application.

---

## Philosophy

Editorial White Paper is a light, print-inspired identity shared with Content Strategy Hub. The product should read like a strategic brief you could hand across a table: white paper, black ink, serif headlines, quiet sans body, and almost no decorative color.

- White surfaces.
- Near-black ink for text and primary actions.
- Hairline rules instead of heavy elevation.
- Generous whitespace.
- No playful illustrations, no gradients.
- Document-driven layouts.

## Brand tokens

### Color palette

| Token | Value | Usage |
| --- | --- | --- |
| `--background` | `#ffffff` | Page background |
| `--surface` | `#ffffff` | Cards, panels, elevated surfaces |
| `--card` | `#ffffff` | Card backgrounds |
| `--foreground` | `#111111` | Primary text |
| `--primary` | `#111111` | Buttons, links, focus rings, accent |
| `--primary-foreground` | `#ffffff` | Text on primary |
| `--secondary` | `#f6f6f5` | Secondary buttons, muted backgrounds |
| `--accent` | `#f2f2f1` | Accent surface |
| `--accent-foreground` | `#111111` | Accent text |
| `--brass` | `#111111` | Legacy premium accent, now editorial ink |
| `--success` | `#15803d` | Positive states |
| `--warning` | `#b45309` | Warnings, caution |
| `--destructive` | `#b91c1c` | Errors, destructive actions |
| `--border` | `rgba(17,17,17,0.12)` | Dividers, card borders |
| `--input` | `rgba(17,17,17,0.18)` | Input borders |
| `--ring` | `rgba(17,17,17,0.45)` | Focus rings |
| `--muted-foreground` | `#6b6b6b` | Secondary text |

All colors are defined as CSS variables in `src/styles.css` and exposed through Tailwind v4 `@theme inline` tokens.

### Typography

| Token | Font | Usage |
| --- | --- | --- |
| `--font-sans` | Helvetica / Helvetica Neue / Arial | Body text, UI, labels |
| `--font-display` | Georgia / Times New Roman | Headings, large numbers, hero text |
| `--font-mono` | Helvetica stack | Eyebrows, technical labels |
| `--font-wordmark` | Georgia stack | Logo wordmark, brand text |

No web fonts are loaded; the system uses locally available families.

#### Heading treatment

- `h1`, `h2`, `h3`: serif, `font-weight: 700`, `letter-spacing: -0.01em`.
- Wordmark: serif, `font-weight: 700`, tight tracking, sentence case.
- Eyebrow: uppercase sans, `letter-spacing: 0.14em`, `font-size: 0.6875rem`, `font-weight: 600`, muted foreground.

### Radii

Base `--radius`: `0.375rem`, with `sm`/`md`/`lg`/`xl`/`2xl`/`3xl` derived from it.

### Elevation

| Token | Value |
| --- | --- |
| `--shadow-card` | `0 1px 2px rgb(17 17 17 / 4%)` |
| `--shadow-elevated` | `0 1px 2px rgb(17 17 17 / 6%), 0 12px 32px -20px rgb(17 17 17 / 25%)` |

## Semantic utilities

### surface-panel

```css
@utility surface-panel {
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}
```

### text-display

```css
@utility text-display {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: -0.01em;
}
```

### text-eyebrow

```css
@utility text-eyebrow {
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-muted-foreground);
}
```

## Layout

- **App shell:** sidebar on desktop, sheet on mobile, with a top-level page header.
- **Page padding:** generous, responsive padding (`px-4 sm:px-6 lg:px-8`).
- **Card grid:** responsive grids with consistent gap (`gap-4` or `gap-6`).
- **Max content width:** constrain wide dashboards to a readable max-width (`max-w-7xl` or `max-w-8xl`).

## Theme

The system is light-only. The `.dark` class mirrors the light tokens so no surface renders dark-on-dark; `color-scheme: light` is set on `html`.

## Component rules

1. **Never hardcode a color.** Always use semantic tokens (`bg-surface`, `text-primary`, `text-muted-foreground`, etc.).
2. **Use shadcn primitives** themed through the tokens.
3. **Keep components small.** Business logic belongs in `src/lib/`.
4. **Responsive first.**
5. **Accessible.** Aim for WCAG AA contrast; focus states use `--ring`.

## Extension rules

1. If a token exists, use it.
2. If a semantic utility exists (`surface-panel`, `text-eyebrow`), use it.
3. If neither exists, add it in `src/styles.css` and document it here.
4. Never introduce a one-off hex or RGB value in a component file.

## Relationship to brand

This identity is shared with the Content Strategy Hub property and is documented as ADR 010 — Editorial White Paper Brand Direction, superseding ADR 003 (Executive Obsidian).
