import { supabase } from "@/integrations/supabase/client";

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

/**
 * Fire-and-forget product analytics. Never blocks rendering and never throws:
 * a failed analytics write must not degrade the blueprint experience.
 */
export async function trackBlueprintEvent(
  eventName: BlueprintEventName,
  metadata: Record<string, unknown> = {},
  section?: string,
) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("assessment_events").insert({
      user_id: data.user.id,
      assessment_id: (metadata["assessmentId"] as string | undefined) ?? null,
      event_name: eventName,
      section: section ?? null,
      metadata: metadata as never,
    });
  } catch {
    /* analytics must never interrupt the experience */
  }
}
