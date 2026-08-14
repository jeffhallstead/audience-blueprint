# Publisher Pattern Update

Replace the "persona" framework with **Publisher Patterns** across the product, docs, and generated reports. Scoring and the maturity ladder are untouched.

The product model becomes: **Publisher Index** (where you are) → **Publisher Pattern** (what's holding you back) → **Publisher Blueprint** (what you do next) → **90-day engagement** (Diagnose → Build → Prove).

## 1. New pattern model

`src/lib/personas.ts` becomes `src/lib/publisher-patterns.ts` with six canonical patterns and full canonical content per pattern: diagnosis, typical signals, underlying constraint, strategic opportunity, Blueprint priority, plus the short-form pair (short diagnosis, strategic shift) for compact surfaces.

| Internal id | Name | Replaces |
| --- | --- | --- |
| `paid_media_plateau` | Paid Media Plateau | same |
| `campaign_factory` | Campaign Factory | same |
| `borrowed_audience` | Borrowed Audience | Orphaned Audience |
| `invisible_studio` | Invisible Studio | Stalled Studio |
| `fragmented_builder` | Fragmented Builder | Funded Builder |
| `category_leader` | Category Leader | same |

A legacy alias map (`orphaned-audience → borrowed_audience`, etc.) keeps any stored or historical value resolvable, so old analytics rows and saved documents still render under the new name.

### Two personas that no longer exist

The old set had eight entries. **Curious Observer** and **Internal Champion** are not Publisher Patterns:

- **Curious Observer** (maturity level 1) is a maturity state, not a constraint. Observer-tier users now get a real pattern resolved from their weakest dimension, with copy that acknowledges they are early.
- **Internal Champion** was a buying-authority signal, not an operating condition. It moves out of the product entirely and stays in the sales documentation as an outreach signal.

### Matching rules

Pattern resolution takes maturity level plus the six dimension scores:

```text
distribution weakest                      -> Paid Media Plateau
operations/content weakest, low-mid tier  -> Campaign Factory
audience weakest                          -> Borrowed Audience
operations/alignment weakest, Studio+     -> Invisible Studio
strategy weakest, or gaps broadly even    -> Fragmented Builder
Media Brand / Category Leader tier        -> Category Leader
```

## 2. Blueprint generation

The Blueprint engine (`src/lib/blueprint/engine.ts`) gains the pattern as an **emphasis layer**, not a fixed package:

1. Answers → dimension scores → Index + maturity level (unchanged).
2. Pattern is derived from those outputs and attached to the Blueprint.
3. The pattern's primary strategic emphasis reorders and frames the existing opportunity, quick-win, and roadmap output; the specific interventions still come from dimension scores as they do today.

Two organizations sharing a pattern will still receive different Blueprints. The three roadmap phases stay Diagnose → Build → Prove; only what fills them shifts.

The Copilot system prompt (`src/lib/copilot/prompts.server.ts`) and its context builder get the pattern name, diagnosis, and strategic emphasis so generated documents use the same language. (Its unrelated internal `COPILOT_PERSONA` constant — the AI's own voice — is renamed to avoid confusion but is not customer-facing.)

## 3. Results experience

`src/routes/_authenticated/results.tsx` and `dashboard.tsx` present a clear three-level hierarchy:

- **Primary — Publisher Index**: score, maturity level, six dimension scores. "Your Publisher Index shows how mature your publishing operation is."
- **Secondary — Publisher Pattern**: pattern name, one-line diagnosis, then typical signals, underlying constraint, strategic opportunity, and Blueprint priority. "Your Publisher Pattern identifies the primary constraint preventing your publishing investment from compounding."
- **Tertiary — Publisher Blueprint**: the prioritized plan, framed as the output of Index + dimensions + pattern.

The existing `PersonaBanner` becomes `PatternSummary`, using the short-form pattern data for compact placements (dashboard, cards, admin views) and the long definitions on the detailed results and in reports.

### Category Leader disambiguation

Wherever level-5 maturity and the Category Leader pattern can both appear, both are always labeled:

```text
Publisher Maturity: Level 5 — Category Leader
Publisher Pattern: Category Leader
```

## 4. Explanatory copy

The homepage/marketing explanation adopts the supplied framing: score is only the beginning, thousands of score combinations resolve into a small number of recognizable operating patterns, Index tells maturity, Pattern tells what prevents compounding, together they determine the Blueprint. No demographic/buyer-persona language anywhere.

`persona-cards.tsx` and `persona-selector.tsx` are renamed to pattern components and rewritten with the new names and short diagnoses. (They are currently not mounted on the homepage; they stay available for pricing/marketing use.)

## 5. Exports and reports

PDF export, CSV/Excel rows, and emailed reports include a Publisher Pattern block (name, diagnosis, strategic priority) and drop persona wording.

## 6. Documentation and audit

- `docs/Customer-Personas.md` → `docs/Publisher-Patterns.md`, rewritten around the six canonical definitions, with Internal Champion retained only as a sales outreach signal.
- `docs/customer-personas.csv` → `docs/publisher-patterns.csv`, regenerated.
- `docs/Sales-Material-Kit.md`, `docs/Publisher-Blueprint-Guide.md`, `docs/Signature-Offer.md`, and the deck/guide generator scripts updated to the new names and hierarchy.
- Full sweep for `persona`, `Orphaned Audience`, `Stalled Studio`, `Funded Builder`, reviewing each hit. False positives (`personalization`, `personal data`, `personal access token`) are left alone.

## 7. Data and analytics compatibility

No database migration. Patterns are computed at render time from scores that already exist, so every stored assessment keeps working. Analytics event names stay stable; only the `personaId` value passed to booking/CTA tracking changes to the new snake_case ids, with the legacy alias map covering historical rows.

## Technical notes

- New: `src/lib/publisher-patterns.ts` (definitions, short-form table, alias map, resolver).
- Changed: blueprint engine typing to carry `pattern`; Copilot context and prompts; results/dashboard routes; pattern components; export/PDF/rows; `book-a-call.tsx` surface names.
- Unchanged: `src/lib/assessment/*` scoring, maturity level config, roadmap phase structure, database schema.
