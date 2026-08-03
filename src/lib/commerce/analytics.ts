import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import { trackEvent } from "@/lib/events/track.functions";
import type { PlatformEventType } from "@/lib/events/catalog";

export type CommerceEvent =
  | "pricing_viewed"
  | "checkout_started"
  | "purchase_confirmed"
  | "upgrade_prompt_viewed"
  | "portal_opened"
  | "cancel_started";

/** Legacy funnel name → canonical platform event type. */
const CANONICAL: Record<CommerceEvent, PlatformEventType> = {
  pricing_viewed: "commerce.pricing_viewed",
  checkout_started: "commerce.checkout_started",
  purchase_confirmed: "commerce.purchase_confirmed",
  upgrade_prompt_viewed: "commerce.upgrade_prompt_viewed",
  portal_opened: "commerce.portal_opened",
  cancel_started: "commerce.cancel_started",
};

/**
 * Fire-and-forget funnel analytics. Never blocks the UI.
 *
 * Dual-writes to legacy `customer_events` and the canonical `platform_events`
 * store; the legacy write is removed one release after E2.
 */
export async function trackCommerceEvent(
  eventName: CommerceEvent,
  metadata: Record<string, unknown> = {},
) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const environment = getPaddleEnvironment();
    await Promise.allSettled([
      supabase.from("customer_events").insert({
        user_id: data.user.id,
        event_name: eventName,
        metadata: { ...metadata, environment } as never,
      }),
      trackEvent({
        data: {
          type: CANONICAL[eventName],
          environment,
          context: { surface: "web" },
          payload: metadata,
        },
      }),
    ]);
  } catch {
    // Analytics must never break the purchase flow.
  }
}
