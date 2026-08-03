import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/events/track.functions";
import type { PlatformEventType } from "@/lib/events/catalog";

export type BlueprintEventName =
  | "dashboard_viewed"
  | "publisher_index_viewed"
  | "roadmap_viewed"
  | "resources_viewed"
  | "history_viewed"
  | "resource_clicked"
  | "upgrade_cta_clicked"
  | "assessment_revisited"
  | "section_expanded";

/** Legacy analytics name → canonical platform event type. */
const CANONICAL: Record<BlueprintEventName, PlatformEventType> = {
  dashboard_viewed: "blueprint.dashboard_viewed",
  publisher_index_viewed: "blueprint.index_viewed",
  roadmap_viewed: "blueprint.roadmap_viewed",
  resources_viewed: "blueprint.resources_viewed",
  history_viewed: "blueprint.history_viewed",
  resource_clicked: "blueprint.resource_clicked",
  section_expanded: "blueprint.section_expanded",
  upgrade_cta_clicked: "commerce.upgrade_cta_clicked",
  assessment_revisited: "assessment.revisited",
};

/**
 * Fire-and-forget product analytics. Never blocks rendering and never throws:
 * a failed analytics write must not degrade the blueprint experience.
 *
 * Dual-writes to the legacy `assessment_events` table and the canonical
 * `platform_events` store; the legacy write is removed one release after E2.
 */
export async function trackBlueprintEvent(
  eventName: BlueprintEventName,
  metadata: Record<string, unknown> = {},
  section?: string,
) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await Promise.allSettled([
      supabase.from("assessment_events").insert({
        user_id: data.user.id,
        assessment_id: (metadata["assessmentId"] as string | undefined) ?? null,
        event_name: eventName,
        section: section ?? null,
        metadata: metadata as never,
      }),
      trackEvent({
        data: {
          type: CANONICAL[eventName],
          context: { section: section ?? null, assessmentId: metadata["assessmentId"] ?? null },
          payload: metadata,
        },
      }),
    ]);
  } catch {
    /* analytics must never interrupt the experience */
  }
}
