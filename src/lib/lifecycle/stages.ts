/**
 * Lifecycle stage definitions (browser-safe: pure data + pure functions).
 *
 * A stage is a *derived* fact, never a hand-set flag: it is recomputed from the
 * canonical `platform_events` stream plus the entitlement tables, so the same
 * inputs always produce the same stage and history can be replayed.
 */

export const LIFECYCLE_STAGES = [
  "visitor",
  "registered",
  "assessment_started",
  "assessment_completed",
  "blueprint_owner",
  "os_subscriber",
  "churned",
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

/**
 * Progression rank. `churned` sits outside the ladder — it is a state a
 * customer falls *into*, so it never counts as a new high-water mark.
 */
export const STAGE_RANK: Record<LifecycleStage, number> = {
  visitor: 0,
  registered: 1,
  assessment_started: 2,
  assessment_completed: 3,
  blueprint_owner: 4,
  os_subscriber: 5,
  churned: -1,
};

export const STAGE_LABEL: Record<LifecycleStage, string> = {
  visitor: "Visitor",
  registered: "Registered",
  assessment_started: "Assessment started",
  assessment_completed: "Assessment completed",
  blueprint_owner: "Blueprint owner",
  os_subscriber: "OS subscriber",
  churned: "Churned",
};

export const STAGE_DESCRIPTION: Record<LifecycleStage, string> = {
  visitor: "Seen on the site but no account yet.",
  registered: "Account created, assessment not begun.",
  assessment_started: "Working through the Publisher Index assessment.",
  assessment_completed: "Has a Publisher Index score and a blueprint to act on.",
  blueprint_owner: "Purchased Publisher Blueprint.",
  os_subscriber: "Active Publisher OS subscription.",
  churned: "Lapsed after a paid relationship ended.",
};

/** Events that can move someone forward. Used to decide when to recompute. */
export const LIFECYCLE_TRIGGERS = new Set<string>([
  "organization.created",
  "assessment.started",
  "assessment.question_answered",
  "assessment.completed",
  "commerce.purchase_completed",
  "commerce.purchase_confirmed",
  "commerce.purchase_refunded",
  "commerce.subscription_activated",
  "commerce.subscription_updated",
  "commerce.subscription_past_due",
  "commerce.subscription_canceled",
]);

/** The facts a stage is derived from. */
export interface LifecycleFacts {
  hasAccount: boolean;
  assessmentStarted: boolean;
  assessmentCompleted: boolean;
  /** A completed, non-refunded Blueprint purchase. */
  hasPurchase: boolean;
  /** A subscription (or included OS access) that is live right now. */
  hasActiveSubscription: boolean;
  /** Previously paid — purchase refunded or subscription ended. */
  hadPaidRelationship: boolean;
}

export interface DerivedStage {
  stage: LifecycleStage;
  reason: string;
}

/**
 * Single source of truth for "what stage is this person in?".
 *
 * Ordered most-advanced first. Churn is checked only after every active state
 * fails, so a lapsed customer who resubscribes returns to `os_subscriber`
 * immediately rather than being stuck as churned.
 */
export function deriveStage(facts: LifecycleFacts): DerivedStage {
  if (facts.hasActiveSubscription) {
    return { stage: "os_subscriber", reason: "Active Publisher OS access" };
  }
  if (facts.hasPurchase) {
    return { stage: "blueprint_owner", reason: "Completed Blueprint purchase" };
  }
  if (facts.hadPaidRelationship) {
    return { stage: "churned", reason: "Paid access ended without renewal" };
  }
  if (facts.assessmentCompleted) {
    return { stage: "assessment_completed", reason: "Publisher Index assessment completed" };
  }
  if (facts.assessmentStarted) {
    return { stage: "assessment_started", reason: "Assessment in progress" };
  }
  if (facts.hasAccount) {
    return { stage: "registered", reason: "Account created" };
  }
  return { stage: "visitor", reason: "No account yet" };
}

/** Keeps the furthest point ever reached; churn never overwrites it. */
export function nextHighestStage(current: LifecycleStage, candidate: LifecycleStage): LifecycleStage {
  return STAGE_RANK[candidate] > STAGE_RANK[current] ? candidate : current;
}
