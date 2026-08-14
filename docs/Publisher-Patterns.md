# Publisher Patterns — diagnostic archetypes

Version 2.0 · August 2026 · Product and sales reference

A **Publisher Pattern** is not a persona. It does not describe a type of buyer, a demographic, or a psychographic. It describes the current condition of an organization's publishing operation and names the single constraint preventing that operation from compounding.

The product model:

```text
Publisher Index    Where are you?        Measures overall publishing maturity.
      ↓
Publisher Pattern  What's holding you back?  Identifies the dominant operating constraint.
      ↓
Publisher Blueprint What should you do next?  Prioritized plan from scores + pattern.
      ↓
90-Day Engagement  How do we operationalize?  Diagnose → Build → Prove.
```

## How a pattern is assigned

Pattern resolution takes the maturity level plus the six dimension scores (audience, content, distribution, operations, strategy, alignment). The maturity ladder is unchanged:

| Level | Name | Score |
| --- | --- | --- |
| 1 | Observer | 0–34 |
| 2 | Publisher | 35–54 |
| 3 | Studio | 55–71 |
| 4 | Media Brand | 72–85 |
| 5 | Category Leader | 86+ |

Resolution rules (`src/lib/publisher-patterns.ts`):

```text
Maturity level 4–5                          -> Category Leader
Spread across dimensions <= 8 points        -> Fragmented Builder
Distribution weakest                        -> Paid Media Plateau
Audience weakest                            -> Borrowed Audience
Strategy weakest                            -> Fragmented Builder
Alignment weakest                           -> Invisible Studio
Operations or content weakest, level 3+     -> Invisible Studio
Operations or content weakest, level 1–2    -> Campaign Factory
```

The pattern supplements the Publisher Index. It never replaces the score, and it never returns a fixed Blueprint: two organizations sharing a pattern get different recommendations because their dimension scores differ.

## Pattern summary

| Pattern | Short diagnosis | Strategic shift |
| --- | --- | --- |
| Paid Media Plateau | Growth depends too heavily on purchased reach | Paid reach → owned audience |
| Campaign Factory | High output produces little accumulated value | Campaigns → franchises |
| Borrowed Audience | Audience relationships remain on external platforms | Followers → first-party audience |
| Invisible Studio | Publishing exists without a convincing business case | Activity → measurable audience value |
| Fragmented Builder | Resources are deployed without a common architecture | Initiatives → publishing system |
| Category Leader | Strong capabilities need extension and protection | Audience advantage → defensible moat |

---

## Paid Media Plateau

**Diagnosis.** Acquisition works, but the economics are becoming harder to sustain. This organization has successfully grown through paid acquisition but has developed significant dependence on purchased reach. Customer acquisition costs may be rising, incremental reach becomes more expensive, and audience growth slows when paid spending slows.

**Typical signals**
- Strong paid media capability
- Significant dependence on paid acquisition
- Rising or increasingly volatile CAC
- Limited first-party audience relative to total reach
- Content optimized primarily around campaigns and conversion
- Organic and direct distribution underdeveloped
- Marketing performance closely correlated with media spend

**Underlying constraint.** The brand has learned how to buy demand but has not built enough infrastructure to retain attention.

**Strategic opportunity.** Redirect part of the existing content and distribution investment toward building an audience the company can reach repeatedly without repurchasing every impression.

**Blueprint priority.** Turn paid reach into owned audience.

---

## Campaign Factory

**Diagnosis.** The organization produces constantly, but very little compounds. The company produces substantial amounts of marketing content, but most initiatives exist independently. Campaigns launch, perform, and disappear. The next quarter begins with another collection of briefs rather than building on an accumulating audience or recognizable publishing franchise.

**Typical signals**
- High content-production volume
- Strong campaign execution
- Multiple agencies, creators, or production partners
- Content organized around launches and marketing initiatives
- Few recurring editorial franchises
- Limited reuse of successful intellectual property
- Weak connection between content performance and audience accumulation

**Underlying constraint.** The organization has built a production machine rather than a publishing system.

**Strategic opportunity.** Identify the formats and ideas already demonstrating audience potential and concentrate investment behind recurring franchises.

**Blueprint priority.** Turn campaign output into repeatable publishing franchises.

---

## Borrowed Audience

*Replaces the former "Orphaned Audience".*

**Diagnosis.** People are paying attention, but the relationship belongs to someone else. The brand may have significant social followings, creator reach, video audiences, or platform engagement. However, relatively few of those relationships have migrated into channels the company owns.

**Typical signals**
- Strong social or platform engagement
- Meaningful follower counts or video audiences
- Successful creator and influencer relationships
- Content that performs organically
- Small first-party audience relative to platform reach
- Limited mechanisms for converting followers into known audience members
- Heavy exposure to platform algorithms and policy changes

**Underlying constraint.** The brand has built attention without sufficient audience ownership.

**Strategic opportunity.** Create deliberate pathways from platform engagement into first-party relationships such as email subscribers, registered users, members, or other directly addressable audiences.

**Blueprint priority.** Turn followers into an audience the brand owns.

---

## Invisible Studio

*Replaces the former "Stalled Studio".*

**Diagnosis.** The publishing capability is real. Leadership cannot see its business value. The organization may already have strong creative talent, recurring formats, production capability, and meaningful audience engagement. The problem is that the measurement model has not evolved alongside the publishing operation.

**Typical signals**
- Established internal content or editorial capability
- Recurring formats or franchises
- Meaningful production investment
- Strong creative leadership
- Audience metrics scattered across platforms and teams
- Reporting dominated by impressions, views, or engagement
- Difficulty connecting audience development to pipeline, retention, revenue, or strategic value
- Pressure from leadership to justify investment

**Underlying constraint.** The organization has developed a publishing operation without an executive measurement story.

**Strategic opportunity.** Build the measurement and governance layer around the existing publishing operation so leadership can understand the audience asset being created.

**Blueprint priority.** Make the business value of the audience visible.

---

## Fragmented Builder

*Replaces the former "Funded Builder".*

**Diagnosis.** The resources and ambition exist. The publishing system does not. Leadership has decided that content or owned audience should become strategically important. Budget, talent, agencies, technology, and ideas may already exist, but different teams are building different pieces before the organization has established a common publishing architecture.

**Typical signals**
- Executive interest in becoming more content-led
- Budget available for content or audience development
- Multiple initiatives launching simultaneously
- Agencies and internal teams working from different assumptions
- Unclear ownership across marketing, brand, communications, social, and growth
- Technology or production decisions occurring before strategy is settled
- No agreed flagship format or audience metric

**Underlying constraint.** The organization has resources without a shared publishing architecture.

**Strategic opportunity.** Establish the sequence before scaling investment: audience, publishing promise, flagship franchise, distribution model, operating cadence, ownership, and measurement.

**Blueprint priority.** Turn fragmented investment into a coherent publishing system.

---

## Category Leader

**Diagnosis.** The fundamentals are strong. The challenge is turning the advantage into a moat. The organization already has many of the characteristics of a sophisticated publisher: owned audience, recognizable content franchises, repeatable operations, diversified distribution, executive support, and meaningful measurement. The strategic question is what the audience allows the organization to do next.

**Typical signals**
- Large or strategically valuable first-party audience
- Recognizable editorial franchises or original IP
- Strong organic and direct distribution
- Mature production and editorial operations
- Executive support for publishing investment
- Audience data integrated into broader marketing decisions
- Evidence connecting publishing activity with commercial outcomes

**Underlying constraint.** The challenge has shifted from building capability to defending advantage.

**Strategic opportunity.** Treat the audience and associated intellectual property as strategic assets. Extend successful franchises, deepen first-party relationships, develop new distribution or monetization opportunities, and strengthen competitive defensibility.

**Blueprint priority.** Turn audience advantage into category defensibility.

### Naming note

"Category Leader" is both maturity level 5 and a Publisher Pattern. Both names are preserved, and the UI always labels which one is meant:

```text
Publisher Maturity: Level 5 — Category Leader
Publisher Pattern: Category Leader
```

---

## Strategic emphasis used by the Blueprint

| Publisher Pattern | Primary strategic emphasis |
| --- | --- |
| Paid Media Plateau | Convert paid reach into owned audience |
| Campaign Factory | Convert campaign production into recurring franchises |
| Borrowed Audience | Convert platform followers into first-party audience |
| Invisible Studio | Connect publishing capability to measurable business value |
| Fragmented Builder | Create a coherent publishing architecture |
| Category Leader | Extend and defend the audience advantage |

Dimension scores determine the specific interventions recommended underneath that emphasis. The 90-day engagement structure is unchanged: Diagnose (days 1–30), Build (days 31–60), Prove (days 61–90). The phases stay consistent; the intervention changes with the diagnosis.

---

## Sales signals that are not patterns

Two segments from the previous persona model are behavioral sales signals, not operating conditions, and are no longer part of the product:

- **Curious Observer** — maturity level 1. Early-stage, product-served, not a consulting buyer. Automated nurture only.
- **Internal Champion** — high engagement (repeat dashboard views, saved recommendations, generated documents) while the qualification tier is still `lead` and the org profile shows weak authority signals. Give them the exports and ask, "Who else needs to see this?"

## Legacy identifiers

Historical analytics rows and saved documents may contain older ids. They map forward:

| Legacy | Current |
| --- | --- |
| `orphaned-audience` / `orphaned_audience` | `borrowed_audience` |
| `stalled-studio` / `stalled_studio` | `invisible_studio` |
| `funded-builder` / `funded_builder` | `fragmented_builder` |
| `curious-observer` | `fragmented_builder` |
| `internal-champion` | `campaign_factory` |
| `paid-media-plateau` | `paid_media_plateau` |
| `campaign-factory` | `campaign_factory` |
| `category-leader` | `category_leader` |

The mapping lives in `LEGACY_PATTERN_ALIASES`; no database migration was required because patterns are computed from scores at render time.
