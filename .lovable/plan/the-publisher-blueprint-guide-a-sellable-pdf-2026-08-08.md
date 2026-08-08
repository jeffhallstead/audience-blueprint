# The Publisher Blueprint Guide — a sellable PDF

## Goal
Turn the Blueprint framework and the eight behavioral personas into a short, designed PDF ebook (15–25 pages) that can later be offered free or sold. Pricing decision is deferred — the deliverable is the guide itself, produced so either path stays open.

## What it's built from
Everything already exists in the project and does not need to be invented:
- `docs/Customer-Personas.md` — eight engine-derived personas with gap signatures, quick wins, and roadmap patterns.
- `src/lib/assessment/config.ts` — the seven diagnostic sections and their questions.
- `src/lib/assessment/scoring.ts` + the five maturity levels (Observer → Category Leader).
- `src/lib/blueprint/rules.ts` — the recommendation engine: insights, opportunities, 90-day phases, KPIs.

## Structure (target ~22 pages)

```text
 1  Cover — Publisher Blueprint, by Jeff Hallstead
 2  Why most brands rent their audience (the premise, 1 page)
 3  How to use this guide
 4-5  The Publisher Index: seven dimensions, what each measures
 6    The five maturity levels and what changes between them
 7-8  Self-scoring worksheet — score yourself 1-5 on each dimension, total, find your level
 9    Reading your result: overall level x weakest category
10-17 The eight personas, one page each: who you are, the trap, the three moves, what to ignore
18-19 The 90-day roadmap method: phase 1 stabilize, phase 2 build, phase 3 compound
20    The KPI set worth tracking
21    Common failure patterns
22    Next step — take the live Publisher Test / book a call
```

## Voice and design
- Conversational Jeff: first-person, direct, story-led. No generic marketing filler.
- Executive Obsidian brand: near-black cover and section dividers, indigo-violet accent, light interior pages for print readability, Outfit headings / Plus Jakarta Sans body.
- Simple diagrams: the seven-dimension wheel, the maturity ladder, the persona grid (tier x weakest category), the 90-day phase bar.

## Technical approach
- Generate the PDF with a Python ReportLab script under `scripts/`, sourcing the persona and rule content so the guide stays in sync with the engine.
- Register a Unicode TTF, embed brand colors from `src/styles.css` tokens.
- Output to `/mnt/documents/publisher-blueprint-guide.pdf` for download.
- Also write the manuscript to `docs/Publisher-Blueprint-Guide.md` so copy can be edited without touching the generator.
- Every page rendered to an image and visually inspected before delivery.

## Out of scope for this pass
- No checkout, paywall, or landing page yet. Once you have read the draft and decided free vs paid, a follow-up adds either an email-gated download or a Stripe product plus a delivery page.
- No changes to the app's assessment, dashboard, or funnel.

## What I need from you later (not blocking)
- Whether to include a headshot/bio page and any real client results — I will not invent testimonials or numbers.
