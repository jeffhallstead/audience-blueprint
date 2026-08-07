# Customer Personas — Publisher Index Behavioral Segments

Version 1.0 · August 2026 · Sales and marketing reference

Eight personas derived from the live Publisher Blueprint rule engine. Each one is a real output cluster, not a persona workshop invention: the engine was sampled across 120,000–200,000 randomly generated score profiles and the recommendation sets it produced were tallied by maturity tier and weakest category. The gap signature, quick wins, priority opportunities, and 90-day roadmap listed under each persona are the ones that engine actually emits most often for that segment.

---

## How a persona is assigned

Three signal groups, all already captured by the platform:

**1. Publisher Index maturity level** (overall 0–100)

| Level | Title | Score | Share of random profiles |
| --- | --- | --- | --- |
| 1 | Observer | 0–34 | 9.7% |
| 2 | Publisher | 35–54 | ~54% |
| 3 | Studio | 55–71 | 32.3% |
| 4 | Media Brand | 72–85 | 3.5% |
| 5 | Category Leader | 86+ | 0.1% |

Note: those shares describe uniformly random score profiles, not the real customer base. They tell you the engine's output space; they are not a forecast of who signs up.

**2. Weakest category** — audience, content, distribution, operations, strategy, or alignment. This is the single strongest predictor of what someone sees. Gap patterns are close to evenly distributed within a tier (each three-category combination lands near 1%), so the tier alone does not separate two buyers. The weakest category does: it changes the top opportunity set, the quick wins, and the phase-2 roadmap priorities.

**3. Firmographics and buying readiness** — revenue range, team size, industry, and job title from the organization profile, plus qualification tier (`lead` → `marketing_qualified` → `sales_qualified` → `customer`) and engagement score from the event stream.

### ICP filter

Brand and marketing leaders — CMO, VP Marketing, Brand Director — at $10M–$500M consumer brands, or funded companies ready to invest. Big enough to fund a content operation, small enough to still need outside help standing it up.

The consulting sweet spot is the **middle of the index: Publisher and Studio**. Observer is a product customer, not a services customer. Media Brand and Category Leader have already built the function.

```text
              CONSULTING FIT BY INDEX TIER

  Observer     Publisher      Studio      Media Brand   Cat. Leader
  |-----------|-------------|------------|-------------|----------|
   product      CORE ICP      CORE ICP      edge case     referral
   only         (P1,P2,P5)    (P3,P4)       (P8)          (P8)
```

---

## Persona 1 — Paid Media Plateau

**Engine signature:** Publisher tier, distribution weakest.

**Who:** VP Marketing or CMO at a $25M–$150M consumer brand. Performance marketing built the company; the CAC curve has now bent the wrong way for six straight quarters.

**Their situation:** Media costs climb every quarter while returns flatten. The team can produce campaigns but nobody there has built a content operation. No in-house production, no platform relationships. A board wanting returns in two quarters and budget under more scrutiny than it has ever been.

**What the engine tells them:**
- Quick wins: channel inventory, newsletter signup, list consolidation
- Priority opportunities: newsletter strategy, first-party data, channel diversification
- Long-term: distribution network, audience infrastructure, portfolio strategy

**What they want:** An audience they own rather than rent — a content library that appreciates instead of expiring with the media buy.

**What they buy:** Three to six months to become a media company — content strategy, original programming, distribution, and measurement — built alongside the team that will run it.

**Why Jeff:** He has worked inside the media business they are trying to emulate (Warner Bros, Disney, Paramount, Comcast/NBCU, Amazon Studios) plus 15 years measuring audiences at Nielsen and Comscore, and has built the same function on the brand side. He is not selling theory about owned media; he ran the businesses that invented it.

**Lead with:** Free Publisher Test → $49 Blueprint → consulting conversation.

**Outreach trigger:** `sales_qualified`, or `marketing_qualified` with `commerce.pricing_viewed` plus `blueprint.roadmap_viewed`.

**Openers:**
- "Your Publisher Index flagged distribution as your weakest dimension — here's what that costs you"
- "You have the content. The problem is that every view is rented."

---

## Persona 2 — Campaign Factory

**Engine signature:** Publisher tier, operations weakest.

**Who:** VP Marketing or Senior Director at a $10M–$100M brand with a busy, capable team and no editorial system. Output is high and unrepeatable.

**Their situation:** Everything ships, nothing compounds. Process lives in individual heads. Measurement is activity-based — impressions and posts — so nobody can defend the content line item when budget review comes around.

**What the engine tells them:**
- Quick wins: editorial calendar, slate review, thesis draft
- Priority opportunities: editorial operating cadence, publishing thesis, measurement layer
- Long-term: measurement standard, portfolio strategy, executive program

**What they want:** A machine instead of a scramble — something that keeps running when the one person who knows how it works goes on leave.

**What they buy:** An operating system engagement: editorial cadence, slate governance, and a measurement layer their CFO accepts.

**Why Jeff:** Studio slate operations plus Nielsen/Comscore measurement rigor. He has run the calendar and defended the numbers.

**Lead with:** $49 Blueprint (the roadmap is the pitch) → Publisher OS at launch → consulting.

**Outreach trigger:** `marketing_qualified` and up, especially after `copilot.document_generated`.

**Openers:**
- "You are producing plenty. Here is why none of it compounds."
- "Three quick wins that turn your calendar into an operating system"

---

## Persona 3 — Orphaned Audience

**Engine signature:** Publisher or Studio tier, audience weakest, content adequate or strong. The single largest recognizable cluster — 27% of Publisher/audience profiles get the identical top-three opportunity set.

**Who:** Brand Director or Head of Content at a $50M–$500M consumer brand with a real content library and no direct relationship with the people consuming it.

**Their situation:** Good work with no home. Followers on platforms they do not control, email lists split across three tools, no first-party data worth the name. An algorithm change is an existential risk and everyone knows it.

**What the engine tells them:**
- Quick wins: newsletter signup, list consolidation, content audit
- Priority opportunities: newsletter strategy, first-party data, flagship format
- Long-term: audience infrastructure, branded series, executive program

**What they want:** To own the relationship. To be able to reach their audience on a Tuesday without paying for the privilege.

**What they buy:** A three-to-six-month build: audience infrastructure, a flagship owned property, and the measurement to prove it works.

**Why Jeff:** He has built audience businesses on both sides — inside the studios and networks, and inside brands standing the function up for the first time.

**Lead with:** Free Publisher Test → consulting conversation directly. This persona converts fastest.

**Outreach trigger:** `assessment.completed` with an audience score in the critical band. Do not wait for pricing views.

**Openers:**
- "You have built the content. You do not own the audience."
- "Your list is in three tools. That is the whole problem."

---

## Persona 4 — Stalled Studio

**Engine signature:** Studio tier, operations or alignment weakest. Highest-value segment.

**Who:** CMO or VP Brand at a $100M–$500M company with a funded content team already in market. Recurring formats exist. Board support does not.

**Their situation:** The function is real but unprotected. Leadership cannot see the return, so the budget gets re-litigated every planning cycle. What is missing is not production — it is a measurement narrative and executive alignment.

**What the engine tells them:**
- Quick wins: editorial calendar, slate review, executive briefing
- Priority opportunities: editorial operating cadence, measurement layer, executive thought leadership (alignment-weak variant leads with executive thought leadership and board narrative)
- Long-term: measurement standard, executive program, distribution network

**What they want:** For content to stop being the first thing cut. A board-level story with numbers behind it.

**What they buy:** A senior engagement focused on measurement, board narrative, and portfolio strategy — often positioned as an audit plus a rebuild, not a startup.

**Why Jeff:** Fifteen years measuring audiences at Nielsen and Comscore, plus studio-side portfolio experience. He speaks the CFO's language and the creative team's at the same time.

**Lead with:** Consulting engagement. The Blueprint is the credibility artifact, not the offer.

**Outreach trigger:** `sales_qualified`, or any Studio-tier account where the org profile shows $100M+ revenue.

**Openers:**
- "Your content operation works. Your board cannot see it."
- "The gap is not production. It is the measurement story."

---

## Persona 5 — Funded Builder

**Engine signature:** Publisher tier, strategy weakest, broad gaps across several categories; small team, funded company.

**Who:** Founder-adjacent CMO or first marketing leader at a venture- or PE-backed company. Money is available; a plan is not.

**Their situation:** Ambition well ahead of infrastructure. Everything is a candidate priority so nothing gets sequenced. The pressure is to show a coherent strategy before the next board meeting.

**What the engine tells them:**
- Quick wins: thesis draft, editorial calendar, slate review
- Priority opportunities: publishing thesis, editorial operating cadence, portfolio prioritization
- Long-term: portfolio strategy, measurement standard, executive program

**What they want:** A defensible sequence. Something to say no with.

**What they buy:** The $49 Blueprint first, almost always. Consulting follows at the next funding milestone or when headcount lands.

**Why Jeff:** He has sequenced content portfolios with real money behind them and can tell them which two of their eight ideas actually matter.

**Lead with:** $49 Blueprint → Publisher OS at launch → nurture toward consulting.

**Outreach trigger:** `commerce.purchase_completed`. Follow up 30 days post-purchase, not before.

**Openers:**
- "Eight priorities is the same as zero. Here are your two."
- "The plan your next board meeting needs"

---

## Persona 6 — Curious Observer

**Engine signature:** Observer tier. Most categories critical. 9.7% of the output space.

**Who:** Marketing manager, solo operator, or a leader at a company under $10M. Genuinely early.

**Their situation:** Campaign-driven and episodic. Reach depends entirely on platforms and paid media. First-party data is thin or nonexistent.

**What the engine tells them:** Newsletter strategy, first-party data, and flagship format dominate — 9% of Observer profiles receive that exact top three, the tightest concentration of any tier.

**Commercial reality:** Not a consulting buyer. The Blueprint is genuinely useful to them and Publisher OS will be more so. Serve them well through product; do not spend sales time here.

**Lead with:** Free Publisher Test → $49 Blueprint → Publisher OS waitlist.

**Outreach trigger:** None manual. Automated nurture only.

**Openers:**
- "Start with one owned channel. Here is which one."
- "Your first 90 days of owned audience"

---

## Persona 7 — Internal Champion

**Engine signature:** Any index tier. Defined by behavior, not score: high engagement (multiple dashboard and roadmap views, saved recommendations, Copilot documents generated) with weak authority signals in the organization profile — junior title, or no revenue and team-size data filled in.

**Who:** A content lead, senior manager, or strategist who found the tool, loves it, and does not hold the budget.

**Their situation:** Convinced already. Trying to build an internal case for someone above them.

**What they want:** Ammunition. A credible outside document that makes their argument for them.

**What they buy:** Nothing directly. They unlock a Persona 1–4 buyer.

**How to work them:** Give them the export. The PDF, the Airtable and Asana pushes, and the board-narrative language exist for exactly this moment. Ask one question: "Who else needs to see this?"

**Lead with:** Free tier plus generous export access, then an offer to walk their leadership through the results.

**Outreach trigger:** Engagement score in the top quartile while qualification tier remains `lead`. That mismatch is the tell.

**Openers:**
- "You have run this three times. Want help presenting it upward?"
- "Happy to walk your CMO through these results — 20 minutes."

---

## Persona 8 — Category Leader

**Engine signature:** Media Brand or Category Leader tier. 3.6% of the output space combined. Few gaps; Category Leader profiles frequently generate no priority opportunities at all (57% return an empty opportunity set — they have nothing critical left to fix).

**Who:** A brand that has already built the function. Owned distribution rivals or exceeds paid reach. Content shapes the category narrative.

**Commercial reality:** Explicit disqualify. They do not need someone to stand up a content operation. Chasing them burns cycles that Personas 1–4 deserve.

**How to route:** Treat as partner, referral source, or case-study conversation. Their Blueprint result is a validation artifact they will happily share, which is worth more as marketing than as pipeline.

**Lead with:** Peer conversation, co-marketing, or a referral ask. No pitch.

**Outreach trigger:** Manual only, and only when the goal is partnership.

**Openers:**
- "You are in the top few percent of this index — I would love to compare notes."
- "Would you be open to being a reference case?"

---

## Routing summary

| # | Persona | Index | Weakest | Motion | Primary offer |
| --- | --- | --- | --- | --- | --- |
| 1 | Paid Media Plateau | Publisher | Distribution | Core ICP | Consulting |
| 2 | Campaign Factory | Publisher | Operations | Core ICP | Blueprint → OS → consulting |
| 3 | Orphaned Audience | Publisher / Studio | Audience | Core ICP, fastest close | Consulting |
| 4 | Stalled Studio | Studio | Operations / alignment | Core ICP, highest value | Consulting |
| 5 | Funded Builder | Publisher | Strategy | Product-led | Blueprint → OS |
| 6 | Curious Observer | Observer | All | Product only | Blueprint → OS |
| 7 | Internal Champion | Any | Any | Nurture upward | Free + exports |
| 8 | Category Leader | Media Brand+ | Few | Disqualify / partner | Referral |

---

## Method note

Figures in this document come from direct sampling of `src/lib/blueprint/engine.ts`. Tier shares and gap-pattern distributions were measured across 200,000 uniformly random score profiles; opportunity, quick-win, and roadmap concentrations within the Publisher and Studio tiers were measured across a further 120,000. Percentages describe the engine's output space, not observed customer counts. Re-derive them by sampling the engine directly whenever `rules.ts` changes; the related claim harness is `scripts/verify-personalization.ts`.
