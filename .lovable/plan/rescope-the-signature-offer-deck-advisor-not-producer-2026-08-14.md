# Rescope the Signature Offer Deck: advisor, not producer

You're right — the deck currently reads like you ship the episodes. Several slides commit to production work: "Ship the first four episodes of the flagship season", "Automate the derivative production pipeline", "4 episodes shipped on schedule". That's an execution promise you can't and shouldn't make.

The fix is a copy rescope of the deck only. No app code, schema, or product logic changes.

## The reframe

The engagement delivers the *system and the plan*: the diagnostic, the franchise decision, the format spec, the operating cadence, the measurement layer, and the governance to keep it running. The client's team — or a producer/agency they hire, with your help selecting and briefing them — makes the assets. Every phase is scoped to decisions, specs, and systems, and its metrics measure those, not published output.

## Changes by slide

**Days 1–30 (Foundation)** — unchanged in spirit; sharpen to decisions and specs.
- Rank formats by subscriber yield; recommend what to retire
- Define the flagship format: audience, promise, host profile, season structure
- Write the repurposing spec: one asset, five derivatives
- Set the single north-star audience metric and its reporting line
- Metrics: portfolio ranked, flagship format spec approved, north-star metric agreed

**Days 31–60 (Execution)** — the biggest rewrite. Becomes "Build the operating system."
- Stand up the editorial cadence: slate review, owners, calendar
- Define the production model and, if needed, brief and shortlist production partners
- Build the partnership target list and outreach sequence for adjacent audiences
- Specify and stand up the audience dashboard
- Metrics: cadence running, production path resourced, dashboard live, partner pipeline opened
- Deliverable: an editorial operating system and a live audience dashboard

**Days 61–90 (Optimization)** — mostly intact; keep to measurement and reallocation.
- Attribute pipeline influence to owned segments
- Design the retention program against the most engaged cohort
- Recommend the shift from paid reach to owned investment
- Deliver the quarterly audience report format and first executive readout

**Deliverables slide** — add an explicit scope line: strategy, specs, systems, and measurement; asset production sits with your team or a partner we select and brief together.

**Who this is not for** — replace "You want freelance content production" with a clearer boundary: "You need someone to produce the assets — this engagement designs and directs the work, it does not shoot it."

**KPIs** — "Publishing frequency (4 per month)" reads as your output. Reframe as a target the operating system is built to sustain, labeled as the client's cadence, not a deliverable count.

## Technical notes

Edits are confined to `scripts/build-offer-deck.py` (the `PHASES`, `DELIVERABLES`, `FIT_NO`, and `KPIS` blocks, plus the deliverable strings on the phase slides). Regenerate the PDF to `/mnt/documents/` and visually inspect every page for reflow, since several activity lines get longer.

Existing bracketed placeholders (`[PRICE]`, `[CADENCE]`, `[YEARS]`, `[N]`, `[PROOF]`) stay until you send values.

## Note on the product itself

The same production-flavored phrasing lives in the roadmap engine (`src/lib/blueprint/rules.ts`) that generates every client's 90-day plan — so the app tells users to "ship four episodes" too. I've left that out of this plan since you asked about the offer, but it's the same mismatch and worth a follow-up pass.
