/**
 * Server-only writer for the canonical `platform_events` store.
 *
 * The table grants no INSERT to `authenticated`, so every event lands here via
 * the service-role client. Emission is fire-and-forget by contract: a failed
 * consumer or a duplicate must never block the user action that produced it.
 */

import { eventVersion, type PlatformEventInput } from "./catalog";
import { LIFECYCLE_TRIGGERS } from "@/lib/lifecycle/stages";

/**
 * Keeps the derived lifecycle stage in step with the event that just landed.
 * Only progress-bearing events trigger it, and `lifecycle.stage_changed` is
 * never a trigger, so a transition can't cascade into another recompute.
 */
async function syncLifecycleFor(input: PlatformEventInput) {
  if (!input.userId || !LIFECYCLE_TRIGGERS.has(input.type)) return;
  const { syncLifecycle } = await import("@/lib/lifecycle/sync.server");
  await syncLifecycle(input.userId, { organizationId: input.organizationId ?? null });
}

export async function emitPlatformEvent(input: PlatformEventInput): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("platform_events").insert({
      event_type: input.type,
      event_version: eventVersion(input.type),
      user_id: input.userId ?? null,
      organization_id: input.organizationId ?? null,
      environment: input.environment ?? "live",
      source: input.source ?? "app",
      occurred_at: input.occurredAt ?? new Date().toISOString(),
      context: (input.context ?? {}) as never,
      payload: (input.payload ?? {}) as never,
      dedupe_key: input.dedupeKey ?? null,
    });
    // 23505 = unique violation on dedupe_key: the event is already recorded.
    if (error && error.code !== "23505") {
      console.error(`platform_events emit failed [${input.type}]: ${error.message}`);
      return;
    }
    if (!error) await syncLifecycleFor(input);
  } catch (error) {
    console.error(
      `platform_events emit threw [${input.type}]: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}


/** Emits many events in one round trip; duplicates are ignored. */
export async function emitPlatformEvents(inputs: PlatformEventInput[]): Promise<void> {
  if (inputs.length === 0) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("platform_events").upsert(
      inputs.map((input) => ({
        event_type: input.type,
        event_version: eventVersion(input.type),
        user_id: input.userId ?? null,
        organization_id: input.organizationId ?? null,
        environment: input.environment ?? "live",
        source: input.source ?? "app",
        occurred_at: input.occurredAt ?? new Date().toISOString(),
        context: (input.context ?? {}) as never,
        payload: (input.payload ?? {}) as never,
        dedupe_key: input.dedupeKey ?? null,
      })),
      { onConflict: "dedupe_key", ignoreDuplicates: true },
    );
    if (error) {
      console.error(`platform_events batch emit failed: ${error.message}`);
      return;
    }
    // One recompute per user, however many of their events were in the batch.
    for (const userId of new Set(
      inputs.filter((i) => i.userId && LIFECYCLE_TRIGGERS.has(i.type)).map((i) => i.userId!),
    )) {
      const { syncLifecycle } = await import("@/lib/lifecycle/sync.server");
      await syncLifecycle(userId);
    }

  } catch (error) {
    console.error(
      `platform_events batch emit threw: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
