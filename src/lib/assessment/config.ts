/**
 * Publisher Index™ — assessment configuration.
 *
 * Everything about the assessment (sections, questions, answer types, scoring
 * weights, category mapping, maturity thresholds, ordering, estimated time)
 * lives in this file. Application code never hardcodes a question or a weight,
 * so a future assessment version only requires editing configuration.
 */

export const ASSESSMENT_VERSION = "v1";

/** Scoring categories the Publisher Index™ rolls up into. */
export type CategoryId = "audience" | "content" | "distribution" | "operations" | "strategy" | "alignment";

export interface CategoryConfig {
  id: CategoryId;
  label: string;
  description: string;
  /** Relative weight of the category inside the overall score. */
  weight: number;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: "audience",
    label: "Audience",
    description: "The first-party audience you own and can reach without permission from a platform.",
    weight: 1.2,
  },
  {
    id: "content",
    label: "Content",
    description: "Editorial capability, original IP, and the formats you can sustain.",
    weight: 1.1,
  },
  {
    id: "distribution",
    label: "Distribution",
    description: "How reliably work reaches the right audience without paid dependency.",
    weight: 1,
  },
  {
    id: "operations",
    label: "Operations",
    description: "Team, workflow, documentation, AI adoption, and measurement discipline.",
    weight: 1,
  },
  {
    id: "strategy",
    label: "Strategy",
    description: "Clarity of objectives and the ambition behind the publishing motion.",
    weight: 0.8,
  },
  {
    id: "alignment",
    label: "Alignment",
    description: "Executive support, budget, and cross-functional commitment.",
    weight: 0.9,
  },
];

export type AnswerType = "single" | "multi" | "likert" | "number" | "select" | "text" | "url";

export interface QuestionOption {
  value: string;
  label: string;
  /** Normalized contribution, 0–1. Omitted for unscored profile questions. */
  score?: number;
}

export interface NumericBand {
  /** Inclusive lower bound. */
  min: number;
  score: number;
}

export interface QuestionConfig {
  id: string;
  section: SectionId;
  label: string;
  help?: string;
  type: AnswerType;
  placeholder?: string;
  required?: boolean;
  options?: QuestionOption[];
  /** Numeric questions map raw input to a 0–1 score through descending bands. */
  bands?: NumericBand[];
  /** Category weights. Empty/undefined = profile-only question, not scored. */
  scoring?: Partial<Record<CategoryId, number>>;
  /** Multi-select: number of selections that represents a full score. */
  maxScoredSelections?: number;
}

export type SectionId =
  | "company"
  | "audience"
  | "content"
  | "distribution"
  | "operations"
  | "business"
  | "goals";

export interface SectionConfig {
  id: SectionId;
  title: string;
  eyebrow: string;
  summary: string;
  /** Estimated minutes to complete this section. */
  estimatedMinutes: number;
}

export const SECTIONS: SectionConfig[] = [
  {
    id: "company",
    title: "Company Profile",
    eyebrow: "Section one",
    summary: "Organizational context so the index is benchmarked against the right peer set.",
    estimatedMinutes: 1,
  },
  {
    id: "audience",
    title: "Audience Ownership",
    eyebrow: "Section two",
    summary: "The audience you actually own versus the audience you rent.",
    estimatedMinutes: 1.5,
  },
  {
    id: "content",
    title: "Content Capability",
    eyebrow: "Section three",
    summary: "Editorial consistency, original IP, and format depth.",
    estimatedMinutes: 1.5,
  },
  {
    id: "distribution",
    title: "Distribution",
    eyebrow: "Section four",
    summary: "Reach reliability and dependency on paid channels.",
    estimatedMinutes: 1,
  },
  {
    id: "operations",
    title: "Operations",
    eyebrow: "Section five",
    summary: "The operating system behind the publishing engine.",
    estimatedMinutes: 1.5,
  },
  {
    id: "business",
    title: "Business Alignment",
    eyebrow: "Section six",
    summary: "Executive conviction, funding, and cross-functional commitment.",
    estimatedMinutes: 1,
  },
  {
    id: "goals",
    title: "Growth Goals",
    eyebrow: "Section seven",
    summary: "What this program must deliver over the next four quarters.",
    estimatedMinutes: 0.5,
  },
];

const LIKERT: QuestionOption[] = [
  { value: "1", label: "Strongly disagree", score: 0 },
  { value: "2", label: "Disagree", score: 0.25 },
  { value: "3", label: "Neutral", score: 0.5 },
  { value: "4", label: "Agree", score: 0.75 },
  { value: "5", label: "Strongly agree", score: 1 },
];

/** Shorthand for the Likert questions that make up most of the instrument. */
function likert(
  id: string,
  section: SectionId,
  label: string,
  scoring: Partial<Record<CategoryId, number>>,
  help?: string,
): QuestionConfig {
  return { id, section, label, type: "likert", options: LIKERT, scoring, required: true, ...(help ? { help } : {}) };
}

export const QUESTIONS: QuestionConfig[] = [
  // ── Section 1 · Company Profile ──────────────────────────────────────────
  {
    id: "company_name",
    section: "company",
    label: "Company name",
    type: "text",
    placeholder: "Acme Industries",
    required: true,
  },
  { id: "website", section: "company", label: "Website", type: "url", placeholder: "https://acme.com" },
  {
    id: "industry",
    section: "company",
    label: "Industry",
    type: "select",
    options: [
      "Technology / SaaS",
      "Financial Services",
      "Healthcare",
      "Professional Services",
      "Manufacturing",
      "Retail / CPG",
      "Media & Entertainment",
      "Education",
      "Nonprofit",
      "Other",
    ].map((value) => ({ value, label: value })),
    required: true,
  },
  {
    id: "revenue_range",
    section: "company",
    label: "Annual revenue",
    type: "select",
    options: ["< $10M", "$10M – $50M", "$50M – $250M", "$250M – $1B", "$1B+"].map((value) => ({
      value,
      label: value,
    })),
  },
  {
    id: "company_size",
    section: "company",
    label: "Company size",
    type: "select",
    options: ["1 – 50", "51 – 250", "251 – 1,000", "1,001 – 5,000", "5,000+"].map((value) => ({
      value,
      label: value,
    })),
  },
  {
    id: "marketing_team_size",
    section: "company",
    label: "Marketing team size",
    help: "Full-time equivalents dedicated to marketing.",
    type: "number",
    placeholder: "12",
    bands: [
      { min: 50, score: 1 },
      { min: 20, score: 0.8 },
      { min: 8, score: 0.6 },
      { min: 3, score: 0.4 },
      { min: 1, score: 0.2 },
      { min: 0, score: 0 },
    ],
    scoring: { operations: 0.5 },
  },
  {
    id: "business_model",
    section: "company",
    label: "Primary business model",
    type: "single",
    options: ["B2B", "B2C", "DTC", "Marketplace", "Nonprofit", "Hybrid"].map((value) => ({ value, label: value })),
    required: true,
  },

  // ── Section 2 · Audience Ownership ───────────────────────────────────────
  {
    id: "email_list_size",
    section: "audience",
    label: "Email subscribers",
    help: "Active, opted-in subscribers you can reach today.",
    type: "number",
    placeholder: "25000",
    bands: [
      { min: 100000, score: 1 },
      { min: 25000, score: 0.85 },
      { min: 10000, score: 0.7 },
      { min: 2500, score: 0.5 },
      { min: 500, score: 0.3 },
      { min: 1, score: 0.15 },
      { min: 0, score: 0 },
    ],
    scoring: { audience: 1.5 },
    required: true,
  },
  {
    id: "website_traffic",
    section: "audience",
    label: "Monthly website visits",
    type: "number",
    placeholder: "120000",
    bands: [
      { min: 500000, score: 1 },
      { min: 100000, score: 0.85 },
      { min: 25000, score: 0.65 },
      { min: 5000, score: 0.45 },
      { min: 1000, score: 0.25 },
      { min: 0, score: 0.1 },
    ],
    scoring: { audience: 0.8, distribution: 0.4 },
  },
  likert("crm_quality", "audience", "Our CRM data is complete, current, and trusted by the business.", {
    audience: 1,
    operations: 0.4,
  }),
  likert("first_party_data", "audience", "We own meaningful first-party customer data.", { audience: 1.4 }),
  likert("returning_visitors", "audience", "A significant share of our traffic is returning, not first-touch.", {
    audience: 0.9,
    distribution: 0.3,
  }),
  likert("community", "audience", "We operate an active community our audience participates in.", {
    audience: 0.9,
  }),
  likert("audience_growth", "audience", "Our owned audience grows predictably month over month.", {
    audience: 1.1,
    strategy: 0.3,
  }),

  // ── Section 3 · Content Capability ───────────────────────────────────────
  likert("publishing_consistency", "content", "We publish on a consistent, reliable cadence.", { content: 1.4 }),
  likert("editorial_planning", "content", "We work from an editorial calendar and a defined planning process.", {
    content: 1,
    operations: 0.5,
  }),
  likert("original_ip", "content", "We create original intellectual property, not derivative content.", {
    content: 1.2,
    strategy: 0.4,
  }),
  likert("exec_thought_leadership", "content", "Our executives publish credible thought leadership.", {
    content: 0.9,
    alignment: 0.4,
  }),
  likert("brand_storytelling", "content", "We tell a distinctive brand story rather than generic category content.", {
    content: 1,
  }),
  likert("video", "content", "We produce video at a quality and cadence our audience expects.", { content: 0.8 }),
  likert("podcast", "content", "We run an audio or podcast property with a real audience.", { content: 0.6 }),
  likert("research", "content", "We publish original research or proprietary data.", { content: 0.9, strategy: 0.3 }),

  // ── Section 4 · Distribution ─────────────────────────────────────────────
  likert("dist_newsletter", "distribution", "Our newsletter is a primary distribution channel with strong engagement.", {
    distribution: 1.3,
    audience: 0.4,
  }),
  likert("dist_seo", "distribution", "Search drives durable, compounding discovery for us.", { distribution: 1.1 }),
  likert("dist_social", "distribution", "Our social presence reliably reaches the audience that matters.", {
    distribution: 0.9,
  }),
  likert("dist_partnerships", "distribution", "We use partnerships and co-marketing to expand reach.", {
    distribution: 0.8,
  }),
  likert("dist_organic_reach", "distribution", "Organic reach is growing rather than declining.", {
    distribution: 1.1,
  }),
  likert("dist_repurposing", "distribution", "We systematically repurpose work across formats and channels.", {
    distribution: 0.9,
    operations: 0.3,
  }),
  {
    id: "paid_dependency",
    section: "distribution",
    label: "How dependent is your reach on paid media?",
    type: "single",
    required: true,
    options: [
      { value: "total", label: "Almost entirely paid", score: 0 },
      { value: "high", label: "Mostly paid", score: 0.25 },
      { value: "balanced", label: "Balanced paid and organic", score: 0.55 },
      { value: "low", label: "Mostly organic", score: 0.85 },
      { value: "none", label: "Effectively no paid dependency", score: 1 },
    ],
    scoring: { distribution: 1.2, strategy: 0.3 },
  },

  // ── Section 5 · Operations ───────────────────────────────────────────────
  likert("ops_team", "operations", "We have a dedicated team accountable for publishing.", { operations: 1.3 }),
  likert("ops_workflow", "operations", "Our production workflow is defined and repeatable.", { operations: 1.2 }),
  likert("ops_documentation", "operations", "Standards, briefs, and playbooks are documented.", { operations: 0.9 }),
  likert("ops_ai", "operations", "AI is meaningfully embedded in how we research, produce, and distribute.", {
    operations: 1,
    strategy: 0.3,
  }),
  likert("ops_measurement", "operations", "We measure content against business outcomes, not vanity metrics.", {
    operations: 1.2,
    strategy: 0.4,
  }),
  likert("ops_analytics", "operations", "Our analytics stack gives us trustworthy, timely reporting.", {
    operations: 1,
  }),
  {
    id: "ops_kpis",
    section: "operations",
    label: "Which KPIs do you actively report on?",
    help: "Select every metric reviewed by leadership at least monthly.",
    type: "multi",
    maxScoredSelections: 4,
    options: [
      "Subscriber growth",
      "Pipeline influenced",
      "Engagement depth",
      "Retention",
      "Share of voice",
      "CAC payback",
      "Revenue attribution",
    ].map((value) => ({ value, label: value })),
    scoring: { operations: 0.9, strategy: 0.4 },
  },
  likert("ops_governance", "operations", "Editorial governance and approvals are clear and unblocked.", {
    operations: 0.8,
    alignment: 0.3,
  }),

  // ── Section 6 · Business Alignment ───────────────────────────────────────
  likert("exec_support", "business", "Our executive team actively champions the publishing strategy.", {
    alignment: 1.4,
  }),
  {
    id: "budget",
    section: "business",
    label: "Annual budget committed to content and audience",
    type: "select",
    required: true,
    options: [
      { value: "< $100K", label: "< $100K", score: 0.15 },
      { value: "$100K – $500K", label: "$100K – $500K", score: 0.45 },
      { value: "$500K – $2M", label: "$500K – $2M", score: 0.75 },
      { value: "$2M+", label: "$2M+", score: 1 },
    ],
    scoring: { alignment: 1.2 },
  },
  likert("long_term_commitment", "business", "Leadership treats this as a multi-year commitment, not a campaign.", {
    alignment: 1.3,
    strategy: 0.5,
  }),
  likert("business_objectives", "business", "Our content objectives are explicitly tied to business objectives.", {
    strategy: 1.2,
    alignment: 0.5,
  }),
  likert("cross_functional", "business", "Sales, product, and marketing are aligned around the publishing motion.", {
    alignment: 1.1,
  }),
  likert("strategic_clarity", "business", "We have a written strategy that everyone involved can articulate.", {
    strategy: 1.3,
  }),

  // ── Section 7 · Growth Goals ─────────────────────────────────────────────
  {
    id: "growth_goals",
    section: "goals",
    label: "What should this program deliver over the next 12 months?",
    help: "Select every outcome that matters. Priority sequencing comes later.",
    type: "multi",
    required: true,
    maxScoredSelections: 3,
    options: [
      "Build owned audience",
      "Generate leads",
      "Improve retention",
      "Launch newsletter",
      "Launch podcast",
      "Build thought leadership",
      "Reduce paid media dependence",
      "Strengthen brand authority",
      "Increase first-party data",
    ].map((value) => ({ value, label: value })),
    scoring: { strategy: 1 },
  },
  {
    id: "time_to_launch",
    section: "goals",
    label: "How quickly must the first initiative ship?",
    type: "single",
    required: true,
    options: [
      { value: "30", label: "Within 30 days", score: 1 },
      { value: "90", label: "Within 90 days", score: 0.8 },
      { value: "180", label: "Within 6 months", score: 0.5 },
      { value: "365", label: "Within 12 months", score: 0.3 },
    ],
    scoring: { strategy: 0.6, alignment: 0.3 },
  },
  {
    id: "success_definition",
    section: "goals",
    label: "What does success look like 12 months from now?",
    help: "Optional. One or two sentences in your own words.",
    type: "text",
    placeholder: "A 50,000-subscriber flagship newsletter that sources 20% of pipeline.",
  },
];

/** Maturity ladder. Thresholds are the inclusive minimum overall score. */
export interface MaturityLevelConfig {
  level: 1 | 2 | 3 | 4 | 5;
  minScore: number;
  title: string;
  summary: string;
  characteristics: string[];
  strategicFocus: string;
  nextStep: string;
}

export const MATURITY_LEVELS: MaturityLevelConfig[] = [
  {
    level: 1,
    minScore: 0,
    title: "Observer",
    summary: "Still relying primarily on campaigns and rented audiences.",
    characteristics: [
      "Publishing is campaign-driven and episodic",
      "Reach depends on platforms and paid media",
      "First-party data is thin or fragmented",
    ],
    strategicFocus: "Establish an owned audience beachhead before adding production volume.",
    nextStep: "Choose one owned channel and commit to a fixed publishing cadence for two quarters.",
  },
  {
    level: 2,
    minScore: 35,
    title: "Publisher",
    summary: "Publishing consistently but lacking repeatable systems.",
    characteristics: [
      "A steady cadence exists on at least one channel",
      "Process lives with individuals rather than in playbooks",
      "Measurement is activity-based, not outcome-based",
    ],
    strategicFocus: "Convert individual effort into a documented operating system.",
    nextStep: "Document the editorial workflow and appoint a single accountable owner.",
  },
  {
    level: 3,
    minScore: 55,
    title: "Studio",
    summary: "Developing original IP and repeatable content operations.",
    characteristics: [
      "Recurring formats and original IP are in market",
      "A dedicated team runs a predictable calendar",
      "Owned audience growth is tracked deliberately",
    ],
    strategicFocus: "Deepen audience ownership and tie output to pipeline.",
    nextStep: "Instrument content against revenue outcomes and double down on the top-performing format.",
  },
  {
    level: 4,
    minScore: 72,
    title: "Media Brand",
    summary: "Content drives measurable business outcomes and audience growth.",
    characteristics: [
      "Owned distribution rivals or exceeds paid reach",
      "Leadership reviews audience metrics alongside revenue",
      "Formats compound rather than reset each quarter",
    ],
    strategicFocus: "Scale the franchise portfolio and defend the audience relationship.",
    nextStep: "Extend the flagship property into adjacent formats with shared audience economics.",
  },
  {
    level: 5,
    minScore: 86,
    title: "Category Leader",
    summary: "Content has become a strategic business asset and competitive advantage.",
    characteristics: [
      "The audience is a durable, defensible asset",
      "Content shapes category narrative and demand",
      "Publishing economics are understood at board level",
    ],
    strategicFocus: "Protect the moat and monetize the audience beyond demand generation.",
    nextStep: "Formalize the audience as a P&L asset with its own growth and retention targets.",
  },
];

export const ESTIMATED_MINUTES = Math.round(
  SECTIONS.reduce((total, section) => total + section.estimatedMinutes, 0),
);

export function questionsForSection(sectionId: SectionId): QuestionConfig[] {
  return QUESTIONS.filter((question) => question.section === sectionId);
}

export type AnswerValue = string | number | string[] | null;
export type AssessmentAnswers = Record<string, AnswerValue>;
