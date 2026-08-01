/**
 * Publisher Blueprint™ — business rules configuration.
 *
 * Every recommendation the dashboard renders is derived from this file. No
 * rule, threshold, copy string, roadmap template, KPI, resource, or CTA is
 * hardcoded in application code or in the engine — `engine.ts` only selects
 * and ranks the entries defined here. This is the seam a future AI service
 * would replace or augment without any UI redesign.
 */

import type { CategoryId } from "@/lib/assessment/config";

export const BLUEPRINT_RULES_VERSION = "rules-v1";

/** Performance bands applied to every 0–100 category score. */
export type PerformanceBand = "strong" | "developing" | "critical";

export const BAND_THRESHOLDS: { band: PerformanceBand; minScore: number; label: string; tone: string }[] = [
  { band: "strong", minScore: 70, label: "Strong", tone: "success" },
  { band: "developing", minScore: 45, label: "Developing", tone: "warning" },
  { band: "critical", minScore: 0, label: "Needs attention", tone: "destructive" },
];

export interface CategoryRule {
  id: CategoryId;
  /** Short executive framing of what the category governs. */
  meaning: string;
  band: Record<PerformanceBand, { status: string; explanation: string }>;
  /** Used when the category ranks as a top strength. */
  strength: { title: string; description: string; implication: string };
  /** Used when the category ranks as a top gap. */
  gap: { title: string; whyItMatters: string; benefit: string };
}

export const CATEGORY_RULES: Record<CategoryId, CategoryRule> = {
  audience: {
    meaning: "The size, quality, and durability of the audience you can reach without paying a platform.",
    band: {
      strong: {
        status: "Owned audience is compounding",
        explanation:
          "You can reach a meaningful audience directly. Protect that relationship and increase the value exchange.",
      },
      developing: {
        status: "Partial ownership",
        explanation:
          "An owned list exists but growth is inconsistent and a large share of reach is still rented.",
      },
      critical: {
        status: "Rented reach",
        explanation:
          "Almost all reach depends on platforms you do not control. A single algorithm change removes it.",
      },
    },
    strength: {
      title: "A real first-party audience relationship",
      description: "You can reach subscribers directly and repeatedly without buying access.",
      implication: "Lowers acquisition cost and makes demand less sensitive to platform volatility.",
    },
    gap: {
      title: "Limited first-party audience ownership",
      whyItMatters: "Rented distribution makes reach a rental cost that resets every quarter.",
      benefit: "An owned list converts one-time attention into a compounding, addressable asset.",
    },
  },
  content: {
    meaning: "Editorial capability, original IP, and the formats you can sustain at quality.",
    band: {
      strong: {
        status: "Original IP in market",
        explanation: "Recurring, recognizable formats give the program a durable editorial identity.",
      },
      developing: {
        status: "Consistent but generic",
        explanation: "Output is steady, but little of it is distinctive enough to build a following around.",
      },
      critical: {
        status: "Campaign-driven output",
        explanation: "Content is produced to serve campaigns rather than to build an audience relationship.",
      },
    },
    strength: {
      title: "High-quality original content",
      description: "Your editorial output stands on its own rather than serving as campaign support.",
      implication: "Original IP is the only content asset that appreciates instead of depreciating.",
    },
    gap: {
      title: "No repeatable flagship format",
      whyItMatters: "Audiences subscribe to formats and hosts, not to individual assets.",
      benefit: "One recurring franchise creates the appointment behavior that grows a subscriber base.",
    },
  },
  distribution: {
    meaning: "How reliably the work reaches the right audience without paid dependency.",
    band: {
      strong: {
        status: "Diversified distribution",
        explanation: "Reach is spread across owned, earned, and partner channels rather than one platform.",
      },
      developing: {
        status: "Concentrated channels",
        explanation: "Distribution works, but a small number of channels carry most of the reach.",
      },
      critical: {
        status: "Single point of failure",
        explanation: "Distribution is concentrated enough that one channel change would erase most reach.",
      },
    },
    strength: {
      title: "Distribution discipline",
      description: "Work is systematically pushed through multiple channels rather than published and abandoned.",
      implication: "Increases return per asset and reduces marginal cost of reach.",
    },
    gap: {
      title: "No content repurposing system",
      whyItMatters: "Every asset published once captures a fraction of the audience it could reach.",
      benefit: "A repurposing system multiplies reach per unit of production with no new creative cost.",
    },
  },
  operations: {
    meaning: "Team, workflow, documentation, tooling, and measurement discipline.",
    band: {
      strong: {
        status: "Documented operating system",
        explanation: "The program runs on process rather than on individual heroics.",
      },
      developing: {
        status: "Process lives with people",
        explanation: "Things ship, but the workflow is undocumented and fragile to turnover.",
      },
      critical: {
        status: "Ad hoc production",
        explanation: "There is no reliable cadence, owner, or calendar to plan against.",
      },
    },
    strength: {
      title: "Consistent publishing cadence",
      description: "The team ships predictably, which is the strongest single predictor of audience compounding.",
      implication: "Predictable output makes audience growth forecastable and staffing defensible.",
    },
    gap: {
      title: "No editorial calendar or clear ownership",
      whyItMatters: "Without a cadence and an accountable owner, publishing collapses under competing priorities.",
      benefit: "A documented cadence turns effort into throughput and makes quality repeatable.",
    },
  },
  strategy: {
    meaning: "Clarity of objectives and the ambition behind the publishing motion.",
    band: {
      strong: {
        status: "Clear written strategy",
        explanation: "Objectives are explicit, shared, and tied to business outcomes.",
      },
      developing: {
        status: "Directionally aligned",
        explanation: "Intent is understood but not written down in a way everyone can articulate.",
      },
      critical: {
        status: "Undefined thesis",
        explanation: "There is no agreed answer to who the audience is or what the program promises them.",
      },
    },
    strength: {
      title: "A defined strategic thesis",
      description: "The team can state who the audience is and what the program promises them.",
      implication: "Strategic clarity is what allows the team to say no and stay consistent.",
    },
    gap: {
      title: "No written publishing thesis",
      whyItMatters: "Unwritten strategy defaults to whichever stakeholder asks loudest this quarter.",
      benefit: "A one-page thesis makes prioritization objective and protects the cadence.",
    },
  },
  alignment: {
    meaning: "Executive support, budget, and cross-functional commitment.",
    band: {
      strong: {
        status: "Executive sponsorship secured",
        explanation: "Leadership treats the program as a multi-year asset with committed budget.",
      },
      developing: {
        status: "Conditional support",
        explanation: "Leadership is supportive but expects campaign-style proof points on short horizons.",
      },
      critical: {
        status: "Unprotected mandate",
        explanation: "Without executive cover, the program will be cut the first time targets tighten.",
      },
    },
    strength: {
      title: "Strong executive support",
      description: "Leadership actively champions the program rather than tolerating it.",
      implication: "Sponsorship buys the time horizon that audience building actually requires.",
    },
    gap: {
      title: "Executive commitment is campaign-length",
      whyItMatters: "Audience assets compound over years; quarterly review cycles kill them early.",
      benefit: "A board-level narrative converts content spend from cost line to strategic asset.",
    },
  },
};

/** Opportunity catalog. The engine selects and ranks by category weakness. */
export interface OpportunityRule {
  id: string;
  category: CategoryId;
  /** Only offered when the category score is at or below this value. */
  maxScore: number;
  title: string;
  rationale: string;
  impact: "High" | "Medium" | "Low";
  effort: "High" | "Medium" | "Low";
  /** Tie-breaker when several rules qualify. Higher wins. */
  leverage: number;
}

export const OPPORTUNITY_RULES: OpportunityRule[] = [
  {
    id: "newsletter-strategy",
    category: "audience",
    maxScore: 70,
    title: "Newsletter strategy",
    rationale: "Stand up one flagship newsletter as the system of record for the owned audience.",
    impact: "High",
    effort: "Medium",
    leverage: 96,
  },
  {
    id: "first-party-data",
    category: "audience",
    maxScore: 45,
    title: "First-party data capture",
    rationale: "Instrument every property with a single consented capture path into one governed list.",
    impact: "High",
    effort: "Low",
    leverage: 92,
  },
  {
    id: "flagship-format",
    category: "content",
    maxScore: 70,
    title: "Flagship episodic format",
    rationale: "Commission one recurring named format so the audience has something to subscribe to.",
    impact: "High",
    effort: "High",
    leverage: 88,
  },
  {
    id: "content-repurposing",
    category: "content",
    maxScore: 60,
    title: "Content repurposing engine",
    rationale: "Convert each flagship asset into five derivative formats on a fixed template.",
    impact: "Medium",
    effort: "Low",
    leverage: 74,
  },
  {
    id: "channel-diversification",
    category: "distribution",
    maxScore: 65,
    title: "Channel diversification",
    rationale: "Reduce concentration risk by building two additional reliable distribution paths.",
    impact: "High",
    effort: "Medium",
    leverage: 82,
  },
  {
    id: "partner-distribution",
    category: "distribution",
    maxScore: 50,
    title: "Partner distribution program",
    rationale: "Sign three co-marketing partners with adjacent, non-competing audiences.",
    impact: "Medium",
    effort: "Medium",
    leverage: 68,
  },
  {
    id: "editorial-operating-cadence",
    category: "operations",
    maxScore: 65,
    title: "Editorial operating cadence",
    rationale: "Install a weekly slate review, a named editor-in-chief, and a published calendar.",
    impact: "High",
    effort: "Low",
    leverage: 86,
  },
  {
    id: "measurement-layer",
    category: "operations",
    maxScore: 55,
    title: "Audience measurement layer",
    rationale: "Report engaged reach, subscriber quality, and pipeline influence on one dashboard.",
    impact: "Medium",
    effort: "Medium",
    leverage: 70,
  },
  {
    id: "publishing-thesis",
    category: "strategy",
    maxScore: 65,
    title: "Written publishing thesis",
    rationale: "Document audience, promise, format, and north-star metric on a single page.",
    impact: "High",
    effort: "Low",
    leverage: 84,
  },
  {
    id: "portfolio-prioritization",
    category: "strategy",
    maxScore: 50,
    title: "Content portfolio prioritization",
    rationale: "Retire low-yield formats and concentrate investment behind the top two.",
    impact: "Medium",
    effort: "Medium",
    leverage: 66,
  },
  {
    id: "executive-thought-leadership",
    category: "alignment",
    maxScore: 70,
    title: "Executive thought leadership",
    rationale: "Put a named executive voice at the center of the program to earn internal air cover.",
    impact: "High",
    effort: "High",
    leverage: 78,
  },
  {
    id: "board-narrative",
    category: "alignment",
    maxScore: 50,
    title: "Board-level content narrative",
    rationale: "Reframe content spend as audience asset creation in the executive reporting pack.",
    impact: "Medium",
    effort: "Low",
    leverage: 64,
  },
];

/** Maturity tiers used to select roadmap templates, KPIs, resources, and CTA. */
export type MaturityTier = "foundational" | "scaling" | "advanced";

export function tierForLevel(level: number): MaturityTier {
  if (level >= 4) return "advanced";
  if (level >= 3) return "scaling";
  return "foundational";
}

export interface RoadmapPhaseTemplate {
  month: 1 | 2 | 3;
  phase: string;
  objective: string;
  activities: string[];
  metrics: string[];
}

export const ROADMAP_TEMPLATES: Record<MaturityTier, RoadmapPhaseTemplate[]> = {
  foundational: [
    {
      month: 1,
      phase: "Foundation",
      objective: "Define the publishing thesis and stand up a single owned channel.",
      activities: [
        "Write the one-page publishing thesis: audience, promise, format, north-star metric",
        "Appoint an accountable editor-in-chief with named weekly time",
        "Launch a newsletter signup path on every owned property",
        "Audit and consolidate existing lists into one governed source",
      ],
      metrics: ["Thesis approved by leadership", "Signup path live on 100% of properties", "Baseline subscriber count recorded"],
    },
    {
      month: 2,
      phase: "Execution",
      objective: "Ship a fixed cadence and prove the format can be sustained.",
      activities: [
        "Publish on a fixed weekly cadence for four consecutive weeks",
        "Document the editorial workflow from brief to publish",
        "Instrument subscriber source tracking end to end",
        "Run a weekly slate review with a single decision-maker",
      ],
      metrics: ["4/4 weeks published on cadence", "Documented workflow in use", "Subscriber growth rate established"],
    },
    {
      month: 3,
      phase: "Optimization",
      objective: "Prove the audience relationship and secure the next horizon of investment.",
      activities: [
        "Review open, click, and retention data and cut the weakest segment",
        "Interview ten subscribers to sharpen the promise",
        "Package results into an executive review with a 12-month ask",
        "Select the flagship format to commission next quarter",
      ],
      metrics: ["Engaged-reach baseline reported", "Executive review delivered", "Next-quarter budget confirmed"],
    },
  ],
  scaling: [
    {
      month: 1,
      phase: "Foundation",
      objective: "Concentrate investment behind the highest-yield franchise.",
      activities: [
        "Rank every active format by subscriber yield and retire the bottom third",
        "Name a host and lock a season structure for the flagship format",
        "Define the repurposing template: one asset, five derivatives",
        "Set a single north-star audience metric reviewed monthly",
      ],
      metrics: ["Portfolio ranked and pruned", "Season one greenlit", "Repurposing template in use"],
    },
    {
      month: 2,
      phase: "Execution",
      objective: "Scale production throughput and open new distribution paths.",
      activities: [
        "Ship the first four episodes of the flagship season",
        "Sign three co-marketing partners with adjacent audiences",
        "Automate the derivative production pipeline",
        "Stand up the audience dashboard for weekly review",
      ],
      metrics: ["4 episodes shipped on schedule", "3 partnerships signed", "Reach per asset up 30%"],
    },
    {
      month: 3,
      phase: "Optimization",
      objective: "Tie audience growth to commercial outcomes.",
      activities: [
        "Attribute pipeline influence to owned audience segments",
        "Run a retention program against the most engaged cohort",
        "Rebalance spend from paid reach to owned production",
        "Publish a quarterly audience report to the executive team",
      ],
      metrics: ["Pipeline influence reported", "Retention cohort improved", "Paid dependency reduced"],
    },
  ],
  advanced: [
    {
      month: 1,
      phase: "Foundation",
      objective: "Formalize the audience as a governed business asset.",
      activities: [
        "Define audience P&L ownership, targets, and reporting cadence",
        "Map franchise portfolio against category narrative gaps",
        "Set defensibility metrics for the core audience relationship",
        "Align product, sales, and editorial on one shared roadmap",
      ],
      metrics: ["Audience P&L defined", "Portfolio map approved", "Cross-functional roadmap published"],
    },
    {
      month: 2,
      phase: "Execution",
      objective: "Extend the flagship into adjacent formats and audiences.",
      activities: [
        "Launch one adjacent format sharing the flagship audience economics",
        "Open a premium or membership tier for the most engaged cohort",
        "Expand partner network into one new category-adjacent segment",
        "Systematize talent development for on-camera and editorial leads",
      ],
      metrics: ["Adjacent format live", "Premium tier piloted", "Engaged cohort expanded"],
    },
    {
      month: 3,
      phase: "Optimization",
      objective: "Monetize the audience beyond demand generation and defend the moat.",
      activities: [
        "Model direct monetization scenarios for the owned audience",
        "Institutionalize measurement in the board reporting pack",
        "Run a competitive share-of-narrative analysis",
        "Set the 12-month franchise investment plan",
      ],
      metrics: ["Monetization model approved", "Board reporting live", "12-month plan funded"],
    },
  ],
};

export interface ActionRule {
  id: string;
  category: CategoryId;
  /** Offered when the category score is at or below this value. */
  maxScore: number;
  title: string;
  description: string;
  /** Shown as the effort chip. */
  timeframe: string;
}

export const QUICK_WIN_RULES: ActionRule[] = [
  {
    id: "qw-newsletter-signup",
    category: "audience",
    maxScore: 70,
    title: "Launch a newsletter signup",
    description: "Put one consistent capture path on every owned property this week.",
    timeframe: "2 days",
  },
  {
    id: "qw-list-consolidation",
    category: "audience",
    maxScore: 55,
    title: "Consolidate existing lists",
    description: "Merge scattered CRM segments and event lists into one governed audience source.",
    timeframe: "4 days",
  },
  {
    id: "qw-content-audit",
    category: "content",
    maxScore: 70,
    title: "Audit existing content",
    description: "Rank last year's output by engagement and identify the three highest-yield themes.",
    timeframe: "3 days",
  },
  {
    id: "qw-repurpose-top-asset",
    category: "content",
    maxScore: 60,
    title: "Repurpose your top asset",
    description: "Take the best-performing piece and cut five derivative formats from it.",
    timeframe: "2 days",
  },
  {
    id: "qw-editorial-calendar",
    category: "operations",
    maxScore: 70,
    title: "Create an editorial calendar",
    description: "Publish a shared eight-week calendar with named owners for each slot.",
    timeframe: "1 day",
  },
  {
    id: "qw-slate-review",
    category: "operations",
    maxScore: 60,
    title: "Book a weekly slate review",
    description: "Thirty minutes, one decision-maker, every week, non-negotiable.",
    timeframe: "1 hour",
  },
  {
    id: "qw-channel-inventory",
    category: "distribution",
    maxScore: 70,
    title: "Inventory your distribution risk",
    description: "Map what share of reach comes from each channel and flag the concentration.",
    timeframe: "2 days",
  },
  {
    id: "qw-thesis-draft",
    category: "strategy",
    maxScore: 70,
    title: "Draft the one-page thesis",
    description: "Audience, promise, format, north-star metric. One page, circulated for comment.",
    timeframe: "3 days",
  },
  {
    id: "qw-exec-briefing",
    category: "alignment",
    maxScore: 70,
    title: "Brief one executive sponsor",
    description: "Walk a single senior stakeholder through this blueprint and secure explicit backing.",
    timeframe: "1 week",
  },
];

export const LONG_TERM_RULES: ActionRule[] = [
  {
    id: "lt-branded-series",
    category: "content",
    maxScore: 80,
    title: "Develop an original branded series",
    description: "A named, recurring, seasonal format with its own editorial identity and host.",
    timeframe: "2 quarters",
  },
  {
    id: "lt-audience-infrastructure",
    category: "audience",
    maxScore: 80,
    title: "Build owned audience infrastructure",
    description: "Consent, identity, segmentation, and lifecycle automation on one governed stack.",
    timeframe: "2 quarters",
  },
  {
    id: "lt-exec-program",
    category: "alignment",
    maxScore: 80,
    title: "Create an executive content program",
    description: "A sustained, ghost-supported leadership voice tied to the category narrative.",
    timeframe: "3 quarters",
  },
  {
    id: "lt-distribution-network",
    category: "distribution",
    maxScore: 80,
    title: "Build a partner distribution network",
    description: "A standing roster of co-marketing partners with shared audience economics.",
    timeframe: "2 quarters",
  },
  {
    id: "lt-measurement-standard",
    category: "operations",
    maxScore: 80,
    title: "Install an audience measurement standard",
    description: "Shared definitions for engaged reach, subscriber quality, and pipeline influence.",
    timeframe: "1 quarter",
  },
  {
    id: "lt-portfolio-strategy",
    category: "strategy",
    maxScore: 80,
    title: "Formalize a franchise portfolio strategy",
    description: "A funded, reviewed portfolio of formats with explicit investment tiers.",
    timeframe: "2 quarters",
  },
];

export interface KpiRule {
  id: string;
  label: string;
  description: string;
  /** Illustrative target framing until live integrations land. */
  target: string;
}

export const KPI_RULES: Record<MaturityTier, KpiRule[]> = {
  foundational: [
    { id: "subscribers", label: "Newsletter subscribers", description: "Total confirmed first-party subscribers.", target: "Establish baseline" },
    { id: "signup-rate", label: "Signup conversion rate", description: "Visitors who join the owned list.", target: "1.5% of sessions" },
    { id: "cadence", label: "Publishing consistency", description: "Scheduled slots shipped on time.", target: "100% of slots" },
    { id: "first-party", label: "First-party audience size", description: "Contactable, consented individuals.", target: "Grow 10% monthly" },
  ],
  scaling: [
    { id: "growth-rate", label: "Email growth rate", description: "Net new subscribers month over month.", target: "8–12% monthly" },
    { id: "engaged-reach", label: "Engaged reach", description: "Audience with a meaningful interaction in 30 days.", target: "35% of list" },
    { id: "returning", label: "Returning visitors", description: "Share of visits from known audience.", target: "40% of sessions" },
    { id: "organic", label: "Organic traffic", description: "Non-paid sessions to owned properties.", target: "Grow 15% per quarter" },
    { id: "frequency", label: "Publishing frequency", description: "Flagship assets shipped per month.", target: "4 per month" },
  ],
  advanced: [
    { id: "retention", label: "Subscriber retention", description: "Twelve-month audience retention.", target: "80%+" },
    { id: "pipeline", label: "Pipeline influence", description: "Opportunities touched by owned audience.", target: "20% of pipeline" },
    { id: "engagement", label: "Customer engagement", description: "Depth of interaction across the portfolio.", target: "Trend positive" },
    { id: "lead-gen", label: "Lead generation", description: "Qualified leads sourced from owned channels.", target: "25% of MQLs" },
    { id: "paid-dependency", label: "Paid dependency", description: "Share of reach bought rather than owned.", target: "Below 40%" },
  ],
};

export interface ResourceRule {
  id: string;
  title: string;
  description: string;
  kind: string;
  readingMinutes: number;
  ctaLabel: string;
  /** Matched when any of these categories is a top gap, or the tier matches. */
  categories?: CategoryId[];
  tiers?: MaturityTier[];
  /** Always included regardless of results. */
  always?: boolean;
}

export const RESOURCE_RULES: ResourceRule[] = [
  {
    id: "branded-entertainment-brief",
    title: "The Branded Entertainment Brief",
    description: "How to greenlight an episodic series that an audience actually subscribes to.",
    kind: "Framework",
    readingMinutes: 9,
    ctaLabel: "Read the brief",
    categories: ["content"],
  },
  {
    id: "owned-audience-doctrine",
    title: "The Owned Audience Doctrine",
    description: "The five-stage publisher maturity model behind your Publisher Index™ score.",
    kind: "Framework",
    readingMinutes: 12,
    ctaLabel: "Read the doctrine",
    always: true,
  },
  {
    id: "newsletter-playbook",
    title: "The Flagship Newsletter Playbook",
    description: "Positioning, cadence, and growth loops for a newsletter that becomes the audience system of record.",
    kind: "Playbook",
    readingMinutes: 11,
    ctaLabel: "Open the playbook",
    categories: ["audience"],
  },
  {
    id: "editorial-operating-cadence",
    title: "Editorial Operating Cadence",
    description: "Weekly, monthly, and quarterly rituals for a functioning newsroom inside a brand.",
    kind: "Playbook",
    readingMinutes: 8,
    ctaLabel: "Open the playbook",
    categories: ["operations"],
  },
  {
    id: "distribution-risk-audit",
    title: "The Distribution Risk Audit",
    description: "A one-page method for quantifying concentration risk across your channels.",
    kind: "Template",
    readingMinutes: 6,
    ctaLabel: "Get the template",
    categories: ["distribution"],
  },
  {
    id: "executive-narrative-memo",
    title: "The Executive Narrative Memo",
    description: "How to present content spend to a board as audience asset creation.",
    kind: "Template",
    readingMinutes: 7,
    ctaLabel: "Get the template",
    categories: ["alignment", "strategy"],
  },
  {
    id: "publisher-test",
    title: "The Publisher Test",
    description: "Twelve questions that reveal whether your organization behaves like a publisher.",
    kind: "Diagnostic",
    readingMinutes: 5,
    ctaLabel: "Take the test",
    always: true,
  },
  {
    id: "ai-toolkit-preview",
    title: "The Future AI Toolkit",
    description: "Where generative tooling belongs — and does not belong — in an editorial operation.",
    kind: "Reference",
    readingMinutes: 10,
    ctaLabel: "Preview the toolkit",
    tiers: ["scaling", "advanced"],
  },
];

export interface CtaRule {
  tier: MaturityTier;
  eyebrow: string;
  title: string;
  body: string;
  action: string;
}

export const CTA_RULES: Record<MaturityTier, CtaRule> = {
  foundational: {
    tier: "foundational",
    eyebrow: "Recommended next step",
    title: "Unlock the complete Publisher Blueprint™",
    body: "Your fastest gains are foundational. The full blueprint expands each 90-day phase into briefs, owners, and templates your team can execute directly.",
    action: "Unlock the full blueprint",
  },
  scaling: {
    tier: "scaling",
    eyebrow: "Recommended next step",
    title: "Book a Strategy Workshop",
    body: "You have the cadence. A half-day working session focuses your portfolio behind the franchise most likely to compound.",
    action: "Book a strategy workshop",
  },
  advanced: {
    tier: "advanced",
    eyebrow: "Recommended next step",
    title: "Schedule an Executive Strategy Session",
    body: "At your maturity the question is defensibility and monetization. A session with Jeff sets the twelve-month franchise and audience P&L plan.",
    action: "Schedule an executive session",
  },
};

/** Executive summary sentence templates, selected by band and tier. */
export const SUMMARY_TEMPLATES = {
  position: {
    foundational:
      "Your organization is publishing with intent but still depends heavily on rented distribution and campaign-shaped output. Establishing a first-party audience beachhead should become the highest strategic priority.",
    scaling:
      "Your organization has established consistent publishing habits and the beginnings of original IP. The constraint is now concentration: turning steady output into a franchise that compounds an owned audience.",
    advanced:
      "Your organization operates a genuine media capability with measurable audience ownership. The strategic question has shifted from building reach to defending and monetizing the audience relationship.",
  } satisfies Record<MaturityTier, string>,
  focus: {
    foundational: "Commit one owned channel to a fixed cadence for two full quarters before adding production volume.",
    scaling: "Concentrate investment behind a single flagship franchise and instrument it against pipeline.",
    advanced: "Extend the flagship into adjacent formats while formalizing the audience as a governed P&L asset.",
  } satisfies Record<MaturityTier, string>,
};
