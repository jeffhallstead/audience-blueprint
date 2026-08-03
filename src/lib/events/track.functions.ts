/**
 * Client-callable event emission. The browser cannot insert into
 * `platform_events` directly, so UI analytics route through this authenticated
 * server function; the caller's identity comes from the bearer token, never
 * from request data.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLATFORM_EVENTS, type PlatformEventType } from "./catalog";

interface TrackInput {
  type: PlatformEventType;
  context?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  environment?: string;
  dedupeKey?: string | null;
}

export const trackEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: TrackInput) => {
    if (!input || typeof input.type !== "string" || !(input.type in PLATFORM_EVENTS)) {
      throw new Error("Unknown platform event type");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { emitPlatformEvent } = await import("./emit.server");
    // The organization is resolved server-side so clients can never mislabel it.
    const { data: member } = await context.supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    await emitPlatformEvent({
      type: data.type,
      userId: context.userId,
      organizationId: member?.organization_id ?? null,
      environment: data.environment ?? "live",
      source: "app",
      context: data.context ?? {},
      payload: data.payload ?? {},
      dedupeKey: data.dedupeKey ?? null,
    });
    return { ok: true };
  });
