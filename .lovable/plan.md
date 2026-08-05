# Enable PDF download on the Blueprint dashboard

Today the dashboard's "Download PDF" button only shows a toast saying the feature arrives later, and the pricing page already advertises "Executive PDF export". This closes that gap with a real, reliable PDF.

## What gets built

A clean typographic PDF generated in the browser from the same Blueprint data that feeds the CSV/Excel export — no screenshots, no layout surprises, selectable text.

**Report contents (paid users — Blueprint or OS):**

```text
Page 1  Cover: Publisher Blueprint™ wordmark, organization name,
        Publisher Index score /100, maturity level, assessment date
        Executive summary: position, biggest opportunity, primary risk
Page 2+ Category readings table (six categories with scores)
        Strengths and gaps
        Priority opportunities / quick wins
        90-day roadmap, month by month
        KPIs to track
        Saved actions (when the user has any)
        Footer on every page: page number + generated date
```

**Free users** get a limited PDF: cover page, Publisher Index score, category readings table, and a closing page inviting them to unlock the full strategic report. This mirrors what the dashboard already shows them on screen, so nothing paid leaks out.

## Behavior

- The existing "Download PDF" button on the dashboard runs the real export.
- Button shows a spinner while generating; a toast confirms or reports failure.
- Filename matches the other exports (e.g. `publisher-blueprint-momentive-ventures-2026-08-05.pdf`).
- The download is tracked the same way CSV/Excel exports are, so it appears in export analytics.
- No PDF button is added to the Index detail, roadmap, Copilot documents, or saved actions pages in this change.

## Technical notes

- Add `jspdf` as a dependency; import it dynamically inside the download handler so it never lands in the initial page bundle (same pattern as the existing `xlsx` import in `src/lib/export/file.ts`).
- New `src/lib/export/pdf.ts` exporting `downloadBlueprintPdf(blueprint, { saved, locked })`, which lays out text, headings, and simple tables with page-break handling and word wrap. Kept out of `file.ts` so the row-based exports stay untouched.
- Content tiering reads the existing `locked` flag already returned by `useBlueprint()` in `src/lib/blueprint/use-blueprint.ts` — the same signal the dashboard uses to hide paid sections — rather than introducing a second entitlement check.
- Wire the handler in `src/routes/_authenticated/dashboard.tsx`, replacing the placeholder toast at the "Download PDF" button.
- Colors and type pulled from the Executive Obsidian tokens, translated to print-safe values: dark ink on white paper, indigo-violet accent for headings and rules. A dark-background PDF would be unusable when printed.
- QA: generate PDFs for a paid blueprint, a free/locked blueprint, and a blueprint with no saved actions; render each page to an image and inspect for clipped text, overflow, bad page breaks, and missing sections before finishing.
