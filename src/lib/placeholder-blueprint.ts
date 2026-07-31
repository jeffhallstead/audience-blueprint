/**
 * Placeholder blueprint output.
 *
 * The MVP does not generate recommendations with AI yet. This module is the
 * single seam where a future AI service (OpenAI / Claude via the AI gateway)
 * will replace deterministic placeholders — the UI reads only from these types.
 */

export interface BlueprintSnapshot {
  publisherLevel: string;
  publisherLevelIndex: number;
  overallScore: number;
  sectionScores: { label: string; score: number }[];
  topOpportunity: string;
  topRisk: string;
  recommendedPriority: string;
  next90Days: string;
}

export interface RecommendationItem {
  category: string;
  title: string;
  rationale: string;
  impact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
}

export interface RoadmapItem {
  month: 1 | 2 | 3;
  title: string;
  description: string;
  owner: string;
  status: "planned" | "in_progress" | "done";
}

export const PUBLISHER_LEVELS = ["Broadcaster", "Publisher", "Programmer", "Studio", "Network"];

export const PLACEHOLDER_BLUEPRINT: BlueprintSnapshot = {
  publisherLevel: "Publisher",
  publisherLevelIndex: 1,
  overallScore: 62,
  sectionScores: [
    { label: "Audience", score: 58 },
    { label: "Content", score: 71 },
    { label: "Distribution", score: 54 },
    { label: "Operations", score: 49 },
    { label: "Goals alignment", score: 78 },
  ],
  topOpportunity:
    "Convert existing demand capture into a flagship episodic series that compounds a first-party subscriber base.",
  topRisk:
    "Distribution is concentrated in rented channels; a single algorithm change would remove most reach overnight.",
  recommendedPriority: "Stand up an owned subscription layer before increasing production volume.",
  next90Days:
    "Define the franchise thesis, appoint an accountable editor-in-chief, and ship the first eight episodes on a fixed cadence.",
};

export const PLACEHOLDER_RECOMMENDATIONS: RecommendationItem[] = [
  {
    category: "Audience",
    title: "Launch a single flagship newsletter as the audience system of record",
    rationale: "Consolidates fragmented lists into one measurable, owned relationship.",
    impact: "high",
    effort: "medium",
  },
  {
    category: "Content",
    title: "Commission an episodic branded series with a named host",
    rationale: "Recurring formats outperform campaign content on retention and recall.",
    impact: "high",
    effort: "high",
  },
  {
    category: "Distribution",
    title: "Formalize three distribution partnerships with adjacent audiences",
    rationale: "Reduces dependency on paid reach while accelerating subscriber growth.",
    impact: "medium",
    effort: "medium",
  },
  {
    category: "Operations",
    title: "Adopt an editorial operating cadence with a weekly slate review",
    rationale: "Publishing consistency is the strongest predictor of audience compounding.",
    impact: "medium",
    effort: "low",
  },
];

export const PLACEHOLDER_ROADMAP: RoadmapItem[] = [
  {
    month: 1,
    title: "Establish the franchise thesis",
    description: "Define audience, promise, and format. Align executives on a single measurable north star.",
    owner: "CMO",
    status: "planned",
  },
  {
    month: 1,
    title: "Audit owned audience assets",
    description: "Consolidate lists, CRM segments, and community members into one governed source.",
    owner: "Marketing Ops",
    status: "planned",
  },
  {
    month: 2,
    title: "Build the production system",
    description: "Appoint an editor-in-chief, lock the cadence, and stand up the editorial workflow.",
    owner: "Content Lead",
    status: "planned",
  },
  {
    month: 2,
    title: "Pilot the flagship format",
    description: "Ship the first three episodes and instrument subscriber conversion end to end.",
    owner: "Brand Studio",
    status: "planned",
  },
  {
    month: 3,
    title: "Activate distribution partnerships",
    description: "Sign three co-marketing partners and launch a cross-promotion calendar.",
    owner: "Partnerships",
    status: "planned",
  },
  {
    month: 3,
    title: "Install the measurement layer",
    description: "Report subscriber growth, engaged reach, and pipeline influence to the executive team.",
    owner: "Analytics",
    status: "planned",
  },
];

export const RESOURCE_PLACEHOLDERS = [
  {
    title: "The Owned Audience Doctrine",
    kind: "Framework",
    description: "The five-stage publisher maturity model behind your score.",
  },
  {
    title: "Branded Entertainment Greenlight Memo",
    kind: "Template",
    description: "A one-page format for pitching an episodic series to the executive committee.",
  },
  {
    title: "Editorial Operating Cadence",
    kind: "Playbook",
    description: "Weekly, monthly, and quarterly rituals for a functioning newsroom.",
  },
  {
    title: "Audience Measurement Standard",
    kind: "Reference",
    description: "Definitions for engaged reach, subscriber quality, and pipeline influence.",
  },
];
