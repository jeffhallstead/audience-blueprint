# ADR 0010: Editorial White Paper Brand Direction

## Status

Accepted (supersedes ADR 0003 — Executive Obsidian)

## Context

Publisher Blueprint shipped with the **Executive Obsidian** identity: near-black surfaces, an indigo-violet accent, and Outfit / Plus Jakarta Sans typography. As the product settled into a consultative, diagnostic role — a document you read, print, and take into a strategy conversation — the dark SaaS aesthetic began to work against the content. The Content Strategy Hub project established a lighter, editorial system that reads like a printed brief, and the two properties should share one visual language.

## Decision

Adopt the **Editorial White Paper** identity from Content Strategy Hub:

- White paper background (`#ffffff`) with near-black ink (`#111111`).
- Black serif headlines (Georgia stack), quiet neutral sans body (Helvetica/Arial stack). No web-font download.
- Black as the primary action color; almost no decorative color.
- Hairline `rgba(17,17,17,0.12)` rules and a near-invisible card shadow instead of dark elevated panels.
- Muted editorial status colors: `#15803d`, `#b45309`, `#b91c1c`.
- Base radius tightened to `0.375rem`.

The app is single-theme; the `.dark` class mirrors the light palette so no surface can render dark-on-dark.

## Consequences

- **Positive**: The product reads as a strategic document rather than a dashboard tool, matching how it is actually used and sold.
- **Positive**: One shared identity across Content Strategy Hub and Publisher Blueprint.
- **Positive**: No web-font request; faster first paint.
- **Neutral**: `--brass` is retained as a token name but now resolves to editorial ink, so the ~20 call sites using it needed no edits.
- **Negative**: Generated marketing assets (newsletter ad PNGs, LinkedIn thumbnails, PDF guide, offer deck) still render in Executive Obsidian and must be regenerated separately.

## Related records

- ADR 0003: Executive Obsidian — superseded by this record.
- ADR 0002: TanStack Start + Supabase — tokens live in `src/styles.css` under Tailwind CSS v4.
