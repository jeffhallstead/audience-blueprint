/**
 * Qualification tier definitions (browser-safe: pure data + pure functions).
 *
 * Like lifecycle stages, a tier is *derived*: fit (who they are, from the
 * organization profile) plus engagement (what they have done, counted from the
 * `platform_events` stream) produce a total score, and the score plus hard
 * signals produce a tier. Nothing here is ever set by hand.
 */

export const QUALIFICATION_TIERS = [
  "unqualified",
  "lead",
  "marketing_qualified",
  "sales_qualified",
  "customer",
] as const;

export type QualificationTier = (typeof QUALIFICATION_TIERS)[number];

export const TIER_RANK: Record<QualificationTier, number> = {
  unqualified: 0,
  lead: 1,
  marketing_qualified: 2,
  sales_qualified: 3,
  customer: 4,
};

export const TIER_LABEL: Record<QualificationTier, string> = {
  unqualified: "Unqualified",
  lead: "Lead",
  marketing_qualified: "Marketing qualified",
  sales_qualified: "Sales qualified",
  customer: "Customer",
};

export const TIER_DESCRIPTION: Record<QualificationTier, string> = {
  unqualified: "Too little known to judge fit or intent.",
  lead: "Known account with an early profile — nurture.",
  marketing_qualified: "Good ICP fit and real product engagement.",
  sales_qualified: "Strong fit plus buying intent — worth a direct approach.",
  customer: "Paying for Publisher Blueprint™ or Publisher OS™.",
};

/**
 * Events that can change fit or intent. Used to decide when to rescore, and
 * mirrored by the engagement weights below.
 */
export const QUALIFICATION_TRIGGERS = new Set<string>([
  "organization.created",
  "organization.updated",
  "organization.profile_completed",
  "assessment.started",
  "assessment.completed",
  "blueprint.dashboard_viewed",
  "blueprint.roadmap_viewed",
  "blueprint.resource_clicked",
  "commerce.pricing_viewed",
  "commerce.upgrade_cta_clicked",
  "commerce.checkout_started",
  "commerce.purchase_completed",
  "commerce.purchase_refunded",
  "commerce.subscription_activated",
  "commerce.subscription_canceled",
  "copilot.session_started",
  "copilot.document_generated",
  "copilot.recommendation_saved",
  "lifecycle.stage_changed",
]);

/**
 * Engagement points per occurrence of an event, with a per-event cap so a
 * single repeated action can't manufacture a sales-qualified account.
 */
export const ENGAGEMENT_WEIGHTS: Record<string, { points: number; cap: number }> = {
  "assessment.started": { points: 4, cap: 4 },
  "assessment.completed": { points: 10, cap: 10 },
  "blueprint.dashboard_viewed": { points: 1, cap: 5 },
  "blueprint.roadmap_viewed": { points: 1, cap: 4 },
  "blueprint.resource_clicked": { points: 1, cap: 3 },
  "copilot.session_started": { points: 2, cap: 6 },
  "copilot.document_generated": { points: 3, cap: 9 },
  "copilot.recommendation_saved": { points: 1, cap: 4 },
  "commerce.pricing_viewed": { points: 2, cap: 6 },
  "commerce.upgrade_cta_clicked": { points: 3, cap: 9 },
  "commerce.checkout_started": { points: 5, cap: 10 },
};

export const MAX_ENGAGEMENT_SCORE = Object.values(ENGAGEMENT_WEIGHTS).reduce(
  (total, weight) => total + weight.cap,
  0,
);

/** ICP fit weights. Media, larger revenue and B2B/DTC publishers fit best. */
const REVENUE_FIT: Record<string, number> = {
  "< $10M": 4,
  "$10M – $50M": 10,
  "$50M – $250M": 16,
  "$250M – $1B": 20,
  "$1B+": 20,
};

const TEAM_FIT: Record<string, number> = {
  "1 – 50": 3,
  "51 – 250": 8,
  "251 – 1,000": 12,
  "1,001 – 5,000": 14,
  "5,000+": 14,
};

const INDUSTRY_FIT: Record<string, number> = {
  "Media & Entertainment": 16,
  "Technology / SaaS": 14,
  "Financial Services": 12,
  "Professional Services": 12,
  "Retail / CPG": 11,
  Healthcare: 9,
  Education: 8,
  Manufacturing: 7,
  Nonprofit: 5,
  Other: 6,
};

const MODEL_FIT: Record<string, number> = {
  B2B: 10,
  DTC: 9,
  B2C: 8,
  Marketplace: 7,
  Hybrid: 7,
  Nonprofit: 4,
};

export const MAX_FIT_SCORE = 20 + 14 + 16 + 10 + 10 + 10; // + marketers + completeness

/** The facts a tier is derived from. */
export interface QualificationFacts {
  organization: {
    industry: string | null;
    revenueRange: string | null;
    teamSize: string | null;
    businessModel: string | null;
    marketerCount: number | null;
    profileCompleteness: number;
  } | null;
  /** Count of each qualifying event this user has produced. */
  eventCounts: Record<string, number>;
  assessmentCompleted: boolean;
  /** Publisher Index™ score, when one exists. */
  indexScore: number | null;
  isPaying: boolean;
}

export interface QualificationBreakdownItem {
  label: string;
  points: number;
}

export interface DerivedQualification {
  tier: QualificationTier;
  fitScore: number;
  engagementScore: number;
  totalScore: number;
  reason: string;
  signals: {
    fit: QualificationBreakdownItem[];
    engagement: QualificationBreakdownItem[];
  };
}

/** 0–80 profile fit. Missing profile data simply scores nothing. */
export function scoreFit(facts: QualificationFacts): {
  score: number;
  breakdown: QualificationBreakdownItem[];
} {
  const org = facts.organization;
  const breakdown: QualificationBreakdownItem[] = [];
  if (!org) return { score: 0, breakdown };

  const add = (label: string, points: number) => {
    if (points > 0) breakdown.push({ label, points });
    return points;
  };

  let score = 0;
  score += add(`Revenue: ${org.revenueRange ?? "unknown"}`, REVENUE_FIT[org.revenueRange ?? ""] ?? 0);
  score += add(`Company size: ${org.teamSize ?? "unknown"}`, TEAM_FIT[org.teamSize ?? ""] ?? 0);
  score += add(`Industry: ${org.industry ?? "unknown"}`, INDUSTRY_FIT[org.industry ?? ""] ?? 0);
  score += add(
    `Business model: ${org.businessModel ?? "unknown"}`,
    MODEL_FIT[org.businessModel ?? ""] ?? 0,
  );

  const marketers = org.marketerCount ?? 0;
  const marketerPoints = marketers >= 25 ? 10 : marketers >= 10 ? 7 : marketers >= 3 ? 4 : marketers > 0 ? 2 : 0;
  score += add(`Marketing team: ${marketers || "unknown"}`, marketerPoints);

  // A completed profile is itself a fit signal: it means they invested effort.
  score += add("Profile completeness", Math.round((org.profileCompleteness / 100) * 10));

  return { score: Math.min(score, MAX_FIT_SCORE), breakdown };
}

/** 0–MAX_ENGAGEMENT_SCORE behavioural intent, capped per event type. */
export function scoreEngagement(facts: QualificationFacts): {
  score: number;
  breakdown: QualificationBreakdownItem[];
} {
  const breakdown: QualificationBreakdownItem[] = [];
  let score = 0;
  for (const [type, weight] of Object.entries(ENGAGEMENT_WEIGHTS)) {
    const count = facts.eventCounts[type] ?? 0;
    if (count === 0) continue;
    const points = Math.min(count * weight.points, weight.cap);
    score += points;
    breakdown.push({ label: `${type} ×${count}`, points });
  }
  return { score, breakdown };
}

/**
 * Single source of truth for "how qualified is this account?".
 *
 * Paying customers short-circuit to `customer`. Otherwise the tier needs both
 * a score threshold and a hard signal, so a high fit score alone never reads as
 * intent and heavy browsing alone never reads as fit.
 */
export function deriveQualification(facts: QualificationFacts): DerivedQualification {
  const fit = scoreFit(facts);
  const engagement = scoreEngagement(facts);
  const totalScore = fit.score + engagement.score;

  const signals = { fit: fit.breakdown, engagement: engagement.breakdown };
  const base = {
    fitScore: fit.score,
    engagementScore: engagement.score,
    totalScore,
    signals,
  };

  if (facts.isPaying) {
    return { ...base, tier: "customer", reason: "Active paid relationship" };
  }

  const buyingIntent =
    (facts.eventCounts["commerce.checkout_started"] ?? 0) > 0 ||
    (facts.eventCounts["commerce.upgrade_cta_clicked"] ?? 0) > 0;

  if (fit.score >= 45 && engagement.score >= 20 && buyingIntent) {
    return {
      ...base,
      tier: "sales_qualified",
      reason: "Strong ICP fit with explicit buying intent",
    };
  }
  if (fit.score >= 30 && facts.assessmentCompleted && engagement.score >= 12) {
    return {
      ...base,
      tier: "marketing_qualified",
      reason: "Good fit with a completed Publisher Index™ and sustained engagement",
    };
  }
  if (facts.organization && (fit.score >= 15 || engagement.score >= 5)) {
    return { ...base, tier: "lead", reason: "Known account, early engagement" };
  }
  return { ...base, tier: "unqualified", reason: "Not enough profile or activity yet" };
}

/** Keeps the furthest tier ever reached. */
export function nextHighestTier(
  current: QualificationTier,
  candidate: QualificationTier,
): QualificationTier {
  return TIER_RANK[candidate] > TIER_RANK[current] ? candidate : current;
}
