# Behavioral Personas from the Publisher Index

Turn the roadmap combinatorics into 8 named, actionable personas for sales and marketing. Deliverable is a reference document only — no app or engine changes.

## What gets built

A new document, `docs/Customer-Personas.md`, plus a companion CSV (`docs/customer-personas.csv`) so the segments can be pasted into Airtable or a CRM view.

## How segments are defined

Each persona is a combination of three signal groups already produced by the platform:

1. **Publisher Index maturity level** — Observer (0–34), Publisher (35–54), Studio (55–71), Media Brand (72–85), Category Leader (86+).
2. **Gap pattern** — which of the six categories (audience, content, distribution, operations, strategy, alignment) fall in the "critical" or "developing" band. This is what actually drives which roadmap and priority set a person receives, so it is the behavioral axis that separates two people at the same score.
3. **Firmographics + buying readiness** — revenue range, team size, industry from the organization profile; qualification tier (lead / marketing qualified / sales qualified / customer) and engagement score from the event stream.

ICP filter applied throughout: brand and marketing leaders (CMO, VP Marketing, Brand Director) at $10M–$500M consumer brands or funded companies ready to invest. The sweet spot is the middle of the index — Publisher and Studio — with Observer and Category Leader treated as non-target for the consulting engagement.

## The 8 personas

Working segmentation, refined against the actual rule engine before writing:

| # | Persona | Index band | Defining gap pattern | Commercial motion |
| --- | --- | --- | --- | --- |
| 1 | Paid Media Plateau | Publisher | Distribution + strategy weak, content adequate | Core ICP — consulting lead |
| 2 | Campaign Factory | Publisher | Operations + alignment weak | Core ICP — consulting lead |
| 3 | Orphaned Audience | Publisher / Studio | Audience weak, content strong | Core ICP — consulting lead |
| 4 | Stalled Studio | Studio | Measurement/alignment weak, output high | Core ICP — highest-value |
| 5 | Funded Builder | Publisher | Broad gaps, small team, funded | Blueprint now, consulting on raise |
| 6 | Curious Observer | Observer | Everything critical | Blueprint + OS self-serve only |
| 7 | Internal Champion | Any | Strong engagement, weak org authority signals | Nurture toward an executive intro |
| 8 | Category Leader | Media Brand / Category Leader | Few gaps | Out of scope — partner or referral |

## What each persona entry contains

- Index range and the specific gap signature that produces it
- Firmographic profile and likely job title
- Which roadmap phases and priority opportunities the engine tends to serve them
- Their situation, in their words (rising media costs, flat returns, board pressure, no production capability)
- What they want and what they buy
- Why Jeff wins the deal — the media-side (Warner Bros, Disney, Paramount, Comcast/NBCU, Amazon Studios) plus measurement (Nielsen, Comscore) plus brand-side operating experience
- The offer to lead with (free Publisher Test, $49 Blueprint, Publisher OS at launch, or a 3–6 month engagement)
- Outreach trigger: the qualification tier and event pattern that means "reach out now"
- Two subject-line / opening-line examples grounded in that persona's gap

## Technical notes

Before writing, the actual distribution is sampled: the existing verification harness is re-pointed at the rule engine to tally which gap patterns and roadmap priority sets occur together and at what frequency, so persona boundaries follow real output clusters rather than intuition. That sampling is throwaway (run in `/tmp`) and nothing in `src/` changes.

No claim about a persona's size or share is published unless the sample supports it.

## Open item

Persona 8 (Category Leader) is included as an explicit disqualify/referral segment so sales knows to route it out rather than chase it. Say the word if you'd rather spend that slot on a ninth ICP-relevant split instead.
