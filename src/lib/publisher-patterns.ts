/**
 * Publisher Patterns — diagnostic archetypes.
 *
 * A Publisher Pattern describes the current condition of an organization's
 * publishing operation, not a type of buyer. The product hierarchy is:
 *
 *   Publisher Index    — where you are (maturity).
 *   Publisher Pattern  — what is holding you back (dominant constraint).
 *   Publisher Blueprint— what you do next (prioritized plan).
 *
 * The pattern supplements the Publisher Index; it never replaces it, and it
 * never determines the Blueprint on its own.
 */

import type { CategoryId } from "@/lib/assessment/config";

export type PublisherPatternId =
  | "paid_media_plateau"
  | "campaign_factory"
  | "borrowed_audience"
  | "invisible_studio"
  | "fragmented_builder"
  | "category_leader";

export interface PublisherPattern {
  id: PublisherPatternId;
  name: string;
  /** One line, used directly under the pattern name. */
  diagnosisLine: string;
  /** Full diagnosis paragraphs. */
  diagnosis: string[];
  typicalSignals: string[];
  underlyingConstraint: string;
  strategicOpportunity: string;
  /** The Publisher Blueprint priority this pattern sets. */
  blueprintPriority: string;
  /** Compact form for cards, dashboards, and admin views. */
  shortDiagnosis: string;
  strategicShift: string;
  /** Strategic emphasis used to frame Blueprint recommendations. */
  strategicEmphasis: string;
  /** Categories whose weakness most often produces this pattern. */
  weakest: CategoryId[];
  cta: { label: string; href: string; external?: boolean };
}

const CONTACT_HREF = "https://jeffhallstead.com/contact";
const BOOK_CALL = { label: "Book a call", href: CONTACT_HREF, external: true } as const;

export const PUBLISHER_PATTERNS: PublisherPattern[] = [
  {
    id: "paid_media_plateau",
    name: "Paid Media Plateau",
    diagnosisLine: "Acquisition works, but the economics are becoming harder to sustain.",
    diagnosis: [
      "This organization has successfully grown through paid acquisition but has developed significant dependence on purchased reach.",
      "Customer acquisition costs may be rising, incremental reach becomes more expensive, and audience growth slows when paid spending slows.",
    ],
    typicalSignals: [
      "Strong paid media capability",
      "Significant dependence on paid acquisition",
      "Rising or increasingly volatile CAC",
      "Limited first-party audience relative to total reach",
      "Content optimized primarily around campaigns and conversion",
      "Organic and direct distribution underdeveloped",
      "Marketing performance closely correlated with media spend",
    ],
    underlyingConstraint:
      "The brand has learned how to buy demand but has not built enough infrastructure to retain attention.",
    strategicOpportunity:
      "Redirect part of the existing content and distribution investment toward building an audience the company can reach repeatedly without repurchasing every impression.",
    blueprintPriority: "Turn paid reach into owned audience.",
    shortDiagnosis: "Growth depends too heavily on purchased reach",
    strategicShift: "Paid reach → owned audience",
    strategicEmphasis: "Convert paid reach into owned audience",
    weakest: ["distribution"],
    cta: BOOK_CALL,
  },
  {
    id: "campaign_factory",
    name: "Campaign Factory",
    diagnosisLine: "The organization produces constantly, but very little compounds.",
    diagnosis: [
      "The company produces substantial amounts of marketing content, but most initiatives exist independently.",
      "Campaigns launch, perform, and disappear. The next quarter begins with another collection of briefs rather than building on an accumulating audience or recognizable publishing franchise.",
    ],
    typicalSignals: [
      "High content-production volume",
      "Strong campaign execution",
      "Multiple agencies, creators, or production partners",
      "Content organized around launches and marketing initiatives",
      "Few recurring editorial franchises",
      "Limited reuse of successful intellectual property",
      "Weak connection between content performance and audience accumulation",
    ],
    underlyingConstraint:
      "The organization has built a production machine rather than a publishing system.",
    strategicOpportunity:
      "Identify the formats and ideas already demonstrating audience potential and concentrate investment behind recurring franchises.",
    blueprintPriority: "Turn campaign output into repeatable publishing franchises.",
    shortDiagnosis: "High output produces little accumulated value",
    strategicShift: "Campaigns → franchises",
    strategicEmphasis: "Convert campaign production into recurring franchises",
    weakest: ["operations", "content"],
    cta: BOOK_CALL,
  },
  {
    id: "borrowed_audience",
    name: "Borrowed Audience",
    diagnosisLine: "People are paying attention, but the relationship belongs to someone else.",
    diagnosis: [
      "The brand may have significant social followings, creator reach, video audiences, or platform engagement.",
      "However, relatively few of those relationships have migrated into channels the company owns.",
    ],
    typicalSignals: [
      "Strong social or platform engagement",
      "Meaningful follower counts or video audiences",
      "Successful creator and influencer relationships",
      "Content that performs organically",
      "Small first-party audience relative to platform reach",
      "Limited mechanisms for converting followers into known audience members",
      "Heavy exposure to platform algorithms and policy changes",
    ],
    underlyingConstraint: "The brand has built attention without sufficient audience ownership.",
    strategicOpportunity:
      "Create deliberate pathways from platform engagement into first-party relationships such as email subscribers, registered users, members, or other directly addressable audiences.",
    blueprintPriority: "Turn followers into an audience the brand owns.",
    shortDiagnosis: "Audience relationships remain on external platforms",
    strategicShift: "Followers → first-party audience",
    strategicEmphasis: "Convert platform followers into first-party audience",
    weakest: ["audience"],
    cta: BOOK_CALL,
  },
  {
    id: "invisible_studio",
    name: "Invisible Studio",
    diagnosisLine: "The publishing capability is real. Leadership cannot see its business value.",
    diagnosis: [
      "The organization may already have strong creative talent, recurring formats, production capability, and meaningful audience engagement.",
      "The problem is that the measurement model has not evolved alongside the publishing operation.",
    ],
    typicalSignals: [
      "Established internal content or editorial capability",
      "Recurring formats or franchises",
      "Meaningful production investment",
      "Strong creative leadership",
      "Audience metrics scattered across platforms and teams",
      "Reporting dominated by impressions, views, or engagement",
      "Difficulty connecting audience development to pipeline, retention, revenue, or strategic value",
      "Pressure from leadership to justify investment",
    ],
    underlyingConstraint:
      "The organization has developed a publishing operation without an executive measurement story.",
    strategicOpportunity:
      "Build the measurement and governance layer around the existing publishing operation so leadership can understand the audience asset being created.",
    blueprintPriority: "Make the business value of the audience visible.",
    shortDiagnosis: "Publishing exists without a convincing business case",
    strategicShift: "Activity → measurable audience value",
    strategicEmphasis: "Connect publishing capability to measurable business value",
    weakest: ["alignment", "operations"],
    cta: BOOK_CALL,
  },
  {
    id: "fragmented_builder",
    name: "Fragmented Builder",
    diagnosisLine: "The resources and ambition exist. The publishing system does not.",
    diagnosis: [
      "Leadership has decided that content or owned audience should become strategically important.",
      "Budget, talent, agencies, technology, and ideas may already exist, but different teams are building different pieces before the organization has established a common publishing architecture.",
    ],
    typicalSignals: [
      "Executive interest in becoming more content-led",
      "Budget available for content or audience development",
      "Multiple initiatives launching simultaneously",
      "Agencies and internal teams working from different assumptions",
      "Unclear ownership across marketing, brand, communications, social, and growth",
      "Technology or production decisions occurring before strategy is settled",
      "No agreed flagship format or audience metric",
    ],
    underlyingConstraint: "The organization has resources without a shared publishing architecture.",
    strategicOpportunity:
      "Establish the sequence before scaling investment: audience, publishing promise, flagship franchise, distribution model, operating cadence, ownership, and measurement.",
    blueprintPriority: "Turn fragmented investment into a coherent publishing system.",
    shortDiagnosis: "Resources are deployed without a common architecture",
    strategicShift: "Initiatives → publishing system",
    strategicEmphasis: "Create a coherent publishing architecture",
    weakest: ["strategy"],
    cta: BOOK_CALL,
  },
  {
    id: "category_leader",
    name: "Category Leader",
    diagnosisLine: "The fundamentals are strong. The challenge is turning the advantage into a moat.",
    diagnosis: [
      "The organization already has many of the characteristics of a sophisticated publisher: owned audience, recognizable content franchises, repeatable operations, diversified distribution, executive support, and meaningful measurement.",
      "The strategic question is what the audience allows the organization to do next.",
    ],
    typicalSignals: [
      "Large or strategically valuable first-party audience",
      "Recognizable editorial franchises or original IP",
      "Strong organic and direct distribution",
      "Mature production and editorial operations",
      "Executive support for publishing investment",
      "Audience data integrated into broader marketing decisions",
      "Evidence connecting publishing activity with commercial outcomes",
    ],
    underlyingConstraint: "The challenge has shifted from building capability to defending advantage.",
    strategicOpportunity:
      "Treat the audience and associated intellectual property as strategic assets. Extend successful franchises, deepen first-party relationships, develop new distribution or monetization opportunities, and strengthen competitive defensibility.",
    blueprintPriority: "Turn audience advantage into category defensibility.",
    shortDiagnosis: "Strong capabilities need extension and protection",
    strategicShift: "Audience advantage → defensible moat",
    strategicEmphasis: "Extend and defend the audience advantage",
    weakest: [],
    cta: BOOK_CALL,
  },
];

const BY_ID = new Map(PUBLISHER_PATTERNS.map((pattern) => [pattern.id, pattern]));

/**
 * Legacy identifiers stored in analytics, saved documents, and older exports.
 * They resolve to the current pattern so historical records keep rendering.
 */
export const LEGACY_PATTERN_ALIASES: Record<string, PublisherPatternId> = {
  "paid-media-plateau": "paid_media_plateau",
  "campaign-factory": "campaign_factory",
  "orphaned-audience": "borrowed_audience",
  orphaned_audience: "borrowed_audience",
  "stalled-studio": "invisible_studio",
  stalled_studio: "invisible_studio",
  "funded-builder": "fragmented_builder",
  funded_builder: "fragmented_builder",
  "curious-observer": "fragmented_builder",
  "internal-champion": "campaign_factory",
  "category-leader": "category_leader",
};

export function getPublisherPattern(id: string): PublisherPattern | undefined {
  const resolved = BY_ID.has(id as PublisherPatternId)
    ? (id as PublisherPatternId)
    : LEGACY_PATTERN_ALIASES[id];
  return resolved ? BY_ID.get(resolved) : undefined;
}

/**
 * Resolve the Publisher Pattern from maturity level plus dimension scores.
 *
 * Maturity narrows the field; the weakest dimension names the constraint. A
 * broadly even gap profile means no single dimension is the bottleneck — the
 * organization lacks a shared architecture, which is Fragmented Builder.
 */
export function resolvePublisherPattern(
  maturityLevel: number,
  categoryScores: Partial<Record<CategoryId, number>>,
): PublisherPattern {
  if (maturityLevel >= 4) return BY_ID.get("category_leader")!;

  const entries = (Object.entries(categoryScores) as [CategoryId, number][]).filter(
    ([, score]) => typeof score === "number",
  );
  if (entries.length === 0) return BY_ID.get("fragmented_builder")!;

  const sorted = [...entries].sort((a, b) => a[1] - b[1]);
  const weakest = sorted[0]!;
  const strongest = sorted[sorted.length - 1]!;

  // No dominant constraint: the spread across dimensions is flat.
  if (strongest[1] - weakest[1] <= 8) return BY_ID.get("fragmented_builder")!;

  switch (weakest[0]) {
    case "distribution":
      return BY_ID.get("paid_media_plateau")!;
    case "audience":
      return BY_ID.get("borrowed_audience")!;
    case "strategy":
      return BY_ID.get("fragmented_builder")!;
    case "alignment":
      return BY_ID.get("invisible_studio")!;
    case "operations":
    case "content":
      // Same weakness reads differently by maturity: an early operation is
      // still a campaign factory, a Studio-tier one is an invisible studio.
      return maturityLevel >= 3 ? BY_ID.get("invisible_studio")! : BY_ID.get("campaign_factory")!;
    default:
      return BY_ID.get("fragmented_builder")!;
  }
}

/** The compact table used by cards, dashboards, and admin views. */
export const PATTERN_SUMMARY_ROWS = PUBLISHER_PATTERNS.map((pattern) => ({
  id: pattern.id,
  name: pattern.name,
  shortDiagnosis: pattern.shortDiagnosis,
  strategicShift: pattern.strategicShift,
}));

/** Canonical explanatory copy shown wherever patterns are introduced. */
export const PATTERN_EXPLAINER = {
  heading: "Your score is only the beginning.",
  body: [
    "Thousands of possible Publisher Test score combinations resolve into a small number of recognizable operating patterns.",
    "Your Publisher Index tells us how mature your publishing operation is. Your Publisher Pattern tells us what is preventing that operation from compounding.",
    "Together, they determine what goes into your Publisher Blueprint.",
  ],
  indexLine: "Your Publisher Index shows how mature your publishing operation is.",
  patternLine:
    "Your Publisher Pattern identifies the primary constraint preventing your publishing investment from compounding.",
  blueprintLine:
    "Your Publisher Blueprint turns your maturity level, dimension scores, and pattern into what you do next.",
};
