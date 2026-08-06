# Personalization Math as a Sales Proof Point

## What the engine actually produces

I ran the live rule engine (`src/lib/blueprint/engine.ts`) against 2,000,000 randomly generated score profiles and counted distinct outputs.

| Blueprint component | Distinct variations observed |
| --- | --- |
| Priority opportunities (top 3, ranked) | 242 |
| Quick wins (top 3, ranked) | 186 |
| Long-term moves (top 3, ranked) | 157 |
| Ranked gaps (top 3) | 120 |
| Ranked strengths (top 3) | 120 |
| Category band pattern (6 categories × 3 bands) | 729 |
| Resource set | 28 |
| Maturity tier | 3 |
| **Combined action plan** (opportunities + quick wins + long-term) | **5,502** |
| **Full personalized blueprint** (all of the above combined) | **~286,000** |

The 286,000 figure is a Chao1 statistical estimate; 206,590 distinct blueprints were directly observed in the sample and the curve had not saturated, so the true number is at or above that estimate.

## The honest caveat

The 90-day roadmap *phase templates* themselves are selected by maturity tier only — there are exactly 3 roadmap skeletons (9 phases total). All personalization currently sits in the layers around the roadmap: prioritized opportunities, quick wins, long-term moves, gaps, strengths, KPIs, and resources.

So "over 250,000 unique roadmaps" is defensible only if "roadmap" means the whole action plan. If we want the phrase to mean the literal 90-day plan, we should make the roadmap itself score-driven first.

## Recommended approach

### Option A — Market what exists (no engine change)
Use the verified claim: **"5,502 distinct action plans and over 250,000 unique blueprint configurations."** Add a short "How personalized is it?" proof block to the landing page and pricing page, with a one-line explanation of the math so it reads as engineering, not marketing.

### Option B — Make the roadmap genuinely unique, then market it
Extend `generateBlueprint` so each of the 3 roadmap phases is populated with that user's selected actions (phase 1 pulls quick wins, phases 2–3 pull opportunities and long-term moves) instead of static template activity strings. That lifts literal roadmap variation from 3 to the 5,502 action-plan figure and makes the sales claim exact. Then apply Option A's copy.

## Technical notes

- Verification script is throwaway (`/tmp/combo/`), not committed. If we publish a number, I'll add a small committed test that re-derives it so the claim can't silently drift when rules change.
- Landing page copy lives in `src/routes/index.tsx`; pricing copy in the pricing route. No backend or schema change is needed for Option A.
- Option B touches `src/lib/blueprint/engine.ts` (roadmap assembly) and `rules.ts` (phase templates gain slots), plus the roadmap UI and PDF export, which both read `blueprint.roadmap`.

## Open question

Which framing do you want — Option A (ship the copy now against current numbers) or Option B (upgrade the roadmap first, then claim the bigger, literal number)?
