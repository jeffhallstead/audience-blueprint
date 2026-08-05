/**
 * Maps canonical `platform_events` onto CRM contact pushes.
 *
 * This is the single place where the event stream becomes CRM traffic. Call
 * sites never enqueue lifecycle or qualification syncs themselves — they emit a
 * platform event, and `syncCrmFor` (wired into the emitter) decides whether the
 * CRM cares. Airtable is the live destination; HubSpot is enqueued too and is
 * skipped by the dispatcher until its connector is configured.
 */

import type { PlatformEventInput, PlatformEventType } from "@/lib/events/catalog";
import type { IntegrationEvent, IntegrationEventName } from "./types";

/**
 * Canonical event type -> CRM event name. Only derived-state transitions live
 * here: purchase, signup and assessment pushes are enqueued by their own flows
 * with richer payloads, and duplicating them would double-write the CRM.
 */
const CRM_EVENT_MAP: Partial<Record<PlatformEventType, IntegrationEventName>> = {
  "lifecycle.stage_changed": "lifecycle.stage_changed",
  "qualification.scored": "qualification.tier_changed",
  "organization.profile_completed": "organization.updated",
};

export function crmEventNameFor(type: PlatformEventType): IntegrationEventName | null {
  return CRM_EVENT_MAP[type] ?? null;
}

interface ContactIdentity {
  email: string | null;
  fullName: string | null;
  organization: string | null;
  score: number | null;
  maturityLevel: string | null;
  tier: string | null;
}

/** Resolves the contact fields every adapter expects, from server-role reads. */
async function resolveIdentity(
  userId: string,
  organizationId: string | null,
): Promise<ContactIdentity> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [authResult, profileResult, scoreResult, qualificationResult] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(userId),
    supabaseAdmin.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    supabaseAdmin
      .from("assessment_scores")
      .select("overall_score, maturity_title")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("customer_qualification")
      .select("tier")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  let organization: string | null = null;
  const orgQuery = supabaseAdmin.from("organizations").select("name").limit(1);
  const { data: org } = organizationId
    ? await orgQuery.eq("id", organizationId).maybeSingle()
    : await orgQuery.eq("owner_id", userId).maybeSingle();
  organization = org?.name ?? null;

  return {
    email: authResult.data.user?.email ?? null,
    fullName: profileResult.data?.full_name ?? null,
    organization,
    score: scoreResult.data?.overall_score ?? null,
    maturityLevel: scoreResult.data?.maturity_title ?? null,
    tier: qualificationResult.data?.tier ?? null,
  };
}

/**
 * Enqueues a CRM push for an event that just landed. Never throws — CRM sync is
 * downstream of the user action and must not be able to fail it.
 */
export async function syncCrmFor(input: PlatformEventInput): Promise<void> {
  try {
    const eventName = crmEventNameFor(input.type);
    if (!eventName || !input.userId) return;

    const { CONTACT_PROVIDERS } = await import("./types");
    const { configuredProviders, enqueueIntegrationEvent } = await import("./outbox.server");
    // Skip the identity reads entirely when no contact provider is connected.
    if (configuredProviders(CONTACT_PROVIDERS).length === 0) return;

    const organizationId = input.organizationId ?? null;
    const identity = await resolveIdentity(input.userId, organizationId);
    if (!identity.email) return;

    const occurredAt = input.occurredAt ?? new Date().toISOString();
    const payload = (input.payload ?? {}) as { to?: unknown; from?: unknown };

    const event: IntegrationEvent = {
      eventName,
      userId: input.userId,
      email: identity.email,
      fullName: identity.fullName,
      organization: identity.organization,
      score: identity.score,
      maturityLevel: identity.maturityLevel,
      tier: identity.tier,
      occurredAt,
      metadata: {
        sourceEvent: input.type,
        from: payload.from ?? null,
        to: payload.to ?? null,
        organizationId,
      },
    };

    await enqueueIntegrationEvent(event, {
      // One CRM push per transition; a replayed emit collapses onto the same row.
      dedupeKey: input.dedupeKey ?? `${input.type}:${input.userId}:${occurredAt}`,
    });
  } catch (error) {
    console.error(
      `crm sync threw [${input.type}]: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Enqueues a current-state contact push for one user, independent of any new
 * event. Used to backfill the CRM with accounts that qualified before the
 * queue was working. Returns why it was skipped, when it was.
 */
export async function enqueueContactSnapshot(
  userId: string,
  organizationId: string | null = null,
): Promise<{ queued: boolean; reason?: string }> {
  const { CONTACT_PROVIDERS } = await import("./types");
  const { configuredProviders, enqueueIntegrationEvent } = await import("./outbox.server");
  if (configuredProviders(CONTACT_PROVIDERS).length === 0) {
    return { queued: false, reason: "no contact provider configured" };
  }

  const identity = await resolveIdentity(userId, organizationId);
  if (!identity.email) return { queued: false, reason: "no email on file" };

  const occurredAt = new Date().toISOString();
  await enqueueIntegrationEvent(
    {
      eventName: "qualification.tier_changed",
      userId,
      email: identity.email,
      fullName: identity.fullName,
      organization: identity.organization,
      score: identity.score,
      maturityLevel: identity.maturityLevel,
      tier: identity.tier,
      occurredAt,
      metadata: { sourceEvent: "crm.backfill", to: identity.tier, organizationId },
    },
    // One backfill row per user per tier: re-running the backfill is a no-op
    // unless the user's tier has moved since.
    { dedupeKey: `crm.backfill:${userId}:${identity.tier ?? "none"}` },
  );
  return { queued: true };
}

