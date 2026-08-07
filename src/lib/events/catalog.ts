/**
 * Canonical platform event catalog (browser-safe: types + constants only).
 *
 * Every business event in the product is named here exactly once. Names are
 * `domain.thing_happened`, past tense, and versioned independently so a payload
 * shape can evolve without rewriting history. Legacy rows backfilled from
 * `assessment_events` / `customer_events` carry version 0 and a `legacy.` prefix.
 */

export const PLATFORM_EVENTS = {
  // Organization
  "organization.created": 1,
  "organization.updated": 1,
  "organization.profile_completed": 1,
  "organization.archived": 1,

  // Assessment
  "assessment.started": 1,
  "assessment.section_completed": 1,
  "assessment.question_answered": 1,
  "assessment.completed": 1,
  "assessment.abandoned": 1,
  "assessment.revisited": 1,

  // Blueprint / product engagement
  "blueprint.dashboard_viewed": 1,
  "blueprint.index_viewed": 1,
  "blueprint.roadmap_viewed": 1,
  "blueprint.resources_viewed": 1,
  "blueprint.history_viewed": 1,
  "blueprint.resource_clicked": 1,
  "blueprint.section_expanded": 1,

  // Commerce
  "commerce.pricing_viewed": 1,
  "commerce.upgrade_cta_clicked": 1,
  "commerce.upgrade_prompt_viewed": 1,
  "commerce.checkout_started": 1,
  "commerce.purchase_confirmed": 1,
  "commerce.purchase_completed": 1,
  "commerce.purchase_unmatched": 1,
  "commerce.purchase_refunded": 1,
  "commerce.payment_failed": 1,
  "commerce.subscription_activated": 1,
  "commerce.subscription_updated": 1,
  "commerce.subscription_past_due": 1,
  "commerce.subscription_canceled": 1,
  "commerce.portal_opened": 1,
  "commerce.cancel_started": 1,
  "commerce.entitlement_granted": 1,
  "commerce.entitlement_revoked": 1,



  // Copilot
  "copilot.session_started": 1,
  "copilot.document_generated": 1,
  "copilot.recommendation_saved": 1,

  // Acquisition & recommendation analytics
  "analytics.acquisition_captured": 1,
  "recommendation.viewed": 1,
  "recommendation.exported": 1,
  "recommendation.completed": 1,

  // Lifecycle & qualification (emitted from E3/E4)
  "lifecycle.stage_changed": 1,
  "qualification.scored": 1,

  // In-app feedback
  "feedback.submitted": 1,

  // Consulting funnel
  "consulting.book_call_clicked": 1,

  // Admin actions
  "admin.user_deleted": 1,
  "admin.role_changed": 1,
} as const;

export type PlatformEventType = keyof typeof PLATFORM_EVENTS;

export function eventVersion(type: PlatformEventType): number {
  return PLATFORM_EVENTS[type];
}

/** Shape accepted by every emitter. `dedupeKey` makes an emit idempotent. */
export interface PlatformEventInput {
  type: PlatformEventType;
  userId?: string | null;
  organizationId?: string | null;
  environment?: string;
  source?: "app" | "server" | "webhook" | "backfill" | "admin";
  occurredAt?: string;
  /** Who/where context: section, route, assessment id, etc. */
  context?: Record<string, unknown>;
  /** Domain data for the event itself. */
  payload?: Record<string, unknown>;
  dedupeKey?: string | null;
}
