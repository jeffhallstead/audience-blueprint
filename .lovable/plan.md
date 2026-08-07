# Plan: Turn Customer Personas into Sales Material

## Goal
Create a small, persona-driven sales-material kit for the Publisher Blueprint product that can be used on the website and in Instagram ads, aimed at **post-assessment / warm leads** in a **conversational Jeff voice**.

## What we already have
`docs/Customer-Personas.md` and `docs/customer-personas.csv` define eight behavioral personas, with clear weakest-category signals, openers, and offer routing. The core ICP sweet spot is Personas 1–5 (Observer, P1–P5, is product-only; Category Leader is partner/referral).

## Deliverables

### 1. Website copy blocks
Add persona-aware copy to the existing public pages so a warm lead sees themselves in the message.

- **Homepage / landing page (`src/routes/index.tsx`)**
  - Add a “Which of these sounds like you?” section with 5 short persona cards (P1–P5). Each card has a headline, one-sentence situation, and the promise.
  - Keep the SEO-optimized H1; the new section sits below the hero as body copy.
- **Results page / dashboard (`src/routes/_authenticated/dashboard.tsx` or adjacent)**
  - Add a “Here is what your weakest category means” banner that uses the user’s actual weakest dimension to mirror one of the five personas.
  - Add a CTA block for consulting discovery that matches the persona’s primary offer.
- **Pricing page (`src/routes/pricing.tsx`)**
  - Add a “Not sure where you fit?” persona selector that routes the reader to the right tier.

### 2. Short sales video scripts
Produce scripts for 5 persona-specific videos (≈15–30 seconds each, conversational Jeff voice) for website embed and Instagram ads.

- One video per core ICP persona: P1 Paid Media Plateau, P2 Campaign Factory, P3 Orphaned Audience, P4 Stalled Studio, P5 Funded Builder.
- Each script: hook, 2-line diagnosis, one concrete promise, soft CTA.
- Optionally render one video with Remotion for a reusable template (1080x1080 and 1080x1920 versions) so the other four can follow the same pattern.

### 3. Instagram ad targeting kit
Create an ad-targeting brief for each persona:

- Target audience (job titles, company size, interests, lookalike source)
- Primary creative angle (one sentence)
- Headline options (3 per persona)
- Body copy (50–100 words, conversational Jeff)
- CTA
- Destination URL on the Blueprint site

### 4. Supporting document
`docs/Sales-Material-Kit.md` — a single reference that ties each persona to its website copy, video script, and ad brief, plus a routing guide so the right persona gets the right offer.

## Out of scope
- No new product features, payment changes, or admin tooling.
- No new data models; we use existing assessment scores and weakest-category logic.
- No live ad-spend setup in Meta Ads Manager (copy only).

## How we will use the personas
- Persona signals (index tier + weakest category) are already computed by the Blueprint engine.
- We map each signal to a message bucket so the website and ad copy can be driven by the same data the app already produces.
- The conversational Jeff voice means first-person, story-led language rather than generic marketing speak.

## Success criteria
- Website copy can be read aloud and sounds like the course-forum post style.
- Video scripts are short enough to be read without a teleprompter in one take.
- Each ad brief is ready to paste into a Meta ad draft.
- The final kit is documented in `docs/Sales-Material-Kit.md`.
