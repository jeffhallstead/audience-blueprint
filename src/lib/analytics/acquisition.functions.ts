/**
 * Persists a signed-in user's first-touch acquisition data. Write-once: if the
 * profile already carries an acquisition record, the call is a no-op so a later
 * campaign click can never rewrite where someone actually came from.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

interface AcquisitionInput {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  referrer?: string | null;
  landingPath?: string | null;
  capturedAt?: string | null;
}

const trim = (value: string | null | undefined, max = 500) =>
  value === null || value === undefined ? null : String(value).slice(0, max) || null;

export const recordAcquisition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AcquisitionInput) => input ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("acquisition_captured_at")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.acquisition_captured_at) return { ok: true, written: false };

    const capturedAt = data.capturedAt ? new Date(data.capturedAt) : new Date();
    const { error } = await supabase
      .from("profiles")
      .update({
        first_touch_source: trim(data.source, 120),
        first_touch_medium: trim(data.medium, 120),
        first_touch_campaign: trim(data.campaign, 200),
        first_touch_referrer: trim(data.referrer),
        first_touch_landing_path: trim(data.landingPath),
        acquisition_captured_at: (Number.isNaN(capturedAt.getTime())
          ? new Date()
          : capturedAt
        ).toISOString(),
      })
      .eq("id", userId);
    if (error) throw error;

    const { emitPlatformEvent } = await import("@/lib/events/emit.server");
    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .maybeSingle();

    await emitPlatformEvent({
      type: "analytics.acquisition_captured",
      userId,
      organizationId: member?.organization_id ?? null,
      source: "app",
      payload: {
        source: trim(data.source, 120),
        medium: trim(data.medium, 120),
        campaign: trim(data.campaign, 200),
        landing_path: trim(data.landingPath),
      },
      dedupeKey: `acquisition:${userId}`,
    });

    return { ok: true, written: true };
  });
