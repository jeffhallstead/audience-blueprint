import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";

export type CommerceEvent =
  | "pricing_viewed"
  | "checkout_started"
  | "purchase_confirmed"
  | "upgrade_prompt_viewed"
  | "portal_opened";

/** Fire-and-forget funnel analytics. Never blocks the UI. */
export async function trackCommerceEvent(
  eventName: CommerceEvent,
  metadata: Record<string, unknown> = {},
) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("customer_events").insert({
      user_id: data.user.id,
      event_name: eventName,
      metadata: { ...metadata, environment: getPaddleEnvironment() } as never,
    });
  } catch {
    // Analytics must never break the purchase flow.
  }
}
