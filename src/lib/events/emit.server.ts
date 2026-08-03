/**
 * Server-only writer for the canonical `platform_events` store.
 *
 * The table grants no INSERT to `authenticated`, so every event lands here via
 * the service-role client. Emission is fire-and-forget by contract: a failed
 * consumer or a duplicate must never block the user action that produced it.
 */

import { eventVersion, type PlatformEventInput } from "./catalog";
import { LIFECYCLE_TRIGGERS } from "@/lib/lifecycle/stages";
import { QUALIFICATION_TRIGGERS } from "@/lib/qualification/tiers";

/**
 * Keeps the derived lifecycle stage and qualification tier in step with the
 * event that just landed. Only progress-bearing events trigger a recompute,
 * and neither `lifecycle.stage_changed` nor `qualification.scored` is itself a
 * qualification trigger, so a transition can't cascade indefinitely.
 */
async function syncDerivedFor(input: PlatformEventInput) {
  if (!input.userId) return;
  const organizationId = input.organizationId ?? null;
  if (LIFECYCLE_TRIGGERS.has(input.type)) {
    const { syncLifecycle } = await import("@/lib/lifecycle/sync.server");
    await syncLifecycle(input.userId, { organizationId });
  }
  if (QUALIFICATION_TRIGGERS.has(input.type)) {
    const { syncQualification } = await import("@/lib/qualification/score.server");
    await syncQualification(input.userId, { organizationId });
  }
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
    if (!error) await syncDerivedFor(input);
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
    const byUser = new Map<
      string,
      { organizationId: string | null; lifecycle: boolean; qualification: boolean }
    >();
    for (const input of inputs) {
      if (!input.userId) continue;
      const lifecycle = LIFECYCLE_TRIGGERS.has(input.type);
      const qualification = QUALIFICATION_TRIGGERS.has(input.type);
      if (!lifecycle && !qualification) continue;
      const entry = byUser.get(input.userId) ?? {
        organizationId: null,
        lifecycle: false,
        qualification: false,
      };
      byUser.set(input.userId, {
        organizationId: entry.organizationId ?? input.organizationId ?? null,
        lifecycle: entry.lifecycle || lifecycle,
        qualification: entry.qualification || qualification,
      });
    }
    for (const [userId, entry] of byUser) {
      if (entry.lifecycle) {
        const { syncLifecycle } = await import("@/lib/lifecycle/sync.server");
        await syncLifecycle(userId, { organizationId: entry.organizationId });
      }
      if (entry.qualification) {
        const { syncQualification } = await import("@/lib/qualification/score.server");
        await syncQualification(userId, { organizationId: entry.organizationId });
      }
    }
  } catch (error) {
    console.error(
      `platform_events batch emit threw: ${error instanceof Error ? error.message : String(error)}`,
    );

  }
}
