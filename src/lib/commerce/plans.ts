/**
 * Commercial plan catalog — the single source of truth for tiers, pricing copy,
 * and feature entitlements. Price amounts here must match the Paddle catalog.
 */

export type Tier = "free" | "blueprint" | "os";

export const TIER_RANK: Record<Tier, number> = { free: 0, blueprint: 1, os: 2 };

/** Every gated capability in the product. */
export type Feature =
  | "assessment"
  | "index_score"
  | "category_scores"
  | "full_dashboard"
  | "roadmap"
  | "ai_documents"
  | "ai_chat"
  | "ai_chat_unlimited"
  | "pdf_export"
  | "progress_tracking"
  | "blueprint_history"
  | "reassessment";

/** Minimum tier required for each feature. */
export const FEATURE_MINIMUM: Record<Feature, Tier> = {
  assessment: "free",
  index_score: "free",
  category_scores: "free",
  full_dashboard: "blueprint",
  roadmap: "blueprint",
  ai_documents: "blueprint",
  ai_chat: "blueprint",
  pdf_export: "blueprint",
  ai_chat_unlimited: "os",
  progress_tracking: "os",
  blueprint_history: "os",
  reassessment: "os",
};

export function tierAllows(tier: Tier, feature: Feature): boolean {
  return TIER_RANK[tier] >= TIER_RANK[FEATURE_MINIMUM[feature]];
}

export const PRICE_IDS = {
  blueprint: "publisher_blueprint_onetime",
  os: "publisher_os_monthly",
} as const;

/** Paddle product external_id → tier. Used by the webhook to map purchases. */
/** Paddle price external_id → product external_id. Used by the webhook. */
export const PRICE_PRODUCT: Record<string, string> = {
  [PRICE_IDS.blueprint]: "publisher_blueprint",
  [PRICE_IDS.os]: "publisher_os",
};

export const PRODUCT_TIER: Record<string, Exclude<Tier, "free">> = {
  publisher_blueprint: "blueprint",
  publisher_os: "os",
};

export type Plan = {
  tier: Tier;
  name: string;
  tagline: string;
  priceLabel: string;
  cadence: string;
  priceId?: string;
  features: string[];
  excluded?: string[];
  highlight?: string;
};

export const PLANS: Plan[] = [
  {
    tier: "free",
    name: "Publisher Test™",
    tagline: "Diagnose where you stand today.",
    priceLabel: "Free",
    cadence: "No card required",
    features: [
      "Full seven-section assessment",
      "Publisher Index™ score",
      "Maturity level",
      "Category score breakdown",
    ],
    excluded: ["90-day roadmap", "AI strategy documents", "PDF exports"],
  },
  {
    tier: "blueprint",
    name: "Publisher Blueprint™",
    tagline: "Your complete strategic assessment and plan.",
    priceLabel: "$99",
    cadence: "One-time — lifetime access",
    priceId: PRICE_IDS.blueprint,
    highlight: "Includes one month of Publisher OS™",
    features: [
      "Everything in Publisher Test™",
      "Full executive dashboard",
      "Opportunity matrix and gap analysis",
      "90-day strategic roadmap",
      "AI strategy documents",
      "Executive PDF export",
      "One month of Publisher OS™ included",
    ],
  },
  {
    tier: "os",
    name: "Publisher OS™",
    tagline: "Operate the plan, quarter after quarter.",
    priceLabel: "$49",
    cadence: "per month",
    priceId: PRICE_IDS.os,
    features: [
      "Everything in Publisher Blueprint™",
      "Unlimited Publisher Copilot™ sessions",
      "Roadmap updates and progress tracking",
      "Blueprint history and version library",
      "Future reassessments",
      "Premium resources and new playbooks",
    ],
  },
];

export function planForTier(tier: Tier): Plan {
  return PLANS.find((plan) => plan.tier === tier) ?? PLANS[0]!;
}
