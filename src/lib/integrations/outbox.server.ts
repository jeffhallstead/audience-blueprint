import type {
  IntegrationAdapter,
  IntegrationEvent,
  IntegrationProvider,
} from "./types";
import {
  CONTACT_PROVIDERS,
  INTEGRATION_PROVIDERS,
  MAX_ATTEMPTS,
  PROVIDER_DISPATCH_LIMIT,
} from "./types";

import { airtableAdapter } from "./airtable.server";
import { airtableRecordsAdapter } from "./airtable-records.server";
import { asanaAdapter } from "./asana.server";
import { hubspotAdapter } from "./hubspot.server";

const ADAPTERS: Record<IntegrationProvider, IntegrationAdapter> = {
  airtable: airtableAdapter,
  hubspot: hubspotAdapter,
  airtable_records: airtableRecordsAdapter,
  asana: asanaAdapter,
};

export function getAdapter(provider: IntegrationProvider): IntegrationAdapter | null {
  return ADAPTERS[provider] ?? null;
}

/** Providers that currently have credentials wired up. */
export function configuredProviders(
  candidates: IntegrationProvider[] = INTEGRATION_PROVIDERS,
): IntegrationProvider[] {
  return candidates.filter((p) => ADAPTERS[p].isConfigured());
}

/**
 * Queue an event for the given providers (contact providers by default).
 * Never throws — integrations must not break signup, assessment, or checkout flows.
 */
export async function enqueueIntegrationEvent(
  event: IntegrationEvent,
  options: { dedupeKey?: string; providers?: IntegrationProvider[] } = {},
): Promise<void> {
  try {
    const providers = configuredProviders(options.providers ?? CONTACT_PROVIDERS);
    if (providers.length === 0) return;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = providers.map((provider) => ({
      provider,
      event_name: event.eventName,
      user_id: event.userId,
      dedupe_key: options.dedupeKey ? `${options.dedupeKey}:${provider}` : null,
      payload: event as unknown as never,
    }));

    const { error } = await supabaseAdmin
      .from("integration_outbox")
      .upsert(rows, { onConflict: "provider,dedupe_key", ignoreDuplicates: true });
    if (error) console.error("[integrations] enqueue failed:", error.message);
  } catch (err) {
    console.error("[integrations] enqueue threw:", err);
  }
}


/** Exponential backoff: 1m, 4m, 9m, 16m, 25m. */
function backoffMinutes(attempts: number) {
  return Math.min(attempts * attempts, 60);
}

export interface DispatchResult {
  claimed: number;
  delivered: number;
  failed: number;
  skipped: number;
}

/** Drain pending outbox rows. Called by the scheduled dispatch endpoint. */
export async function dispatchOutbox(limit = 25): Promise<DispatchResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const nowIso = new Date().toISOString();

  const { data: rows, error } = await supabaseAdmin
    .from("integration_outbox")
    .select("*")
    .eq("status", "pending")
    .lte("next_attempt_at", nowIso)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);

  const result: DispatchResult = { claimed: 0, delivered: 0, failed: 0, skipped: 0 };

  // Per-provider throughput cap: a backlog for one destination can't consume
  // the whole run or trip that provider's rate limit. Overflow stays pending.
  const perProvider = new Map<string, number>();

  for (const row of rows ?? []) {
    const provider = row.provider as IntegrationProvider;
    const used = perProvider.get(provider) ?? 0;
    if (used >= (PROVIDER_DISPATCH_LIMIT[provider] ?? 10)) continue;
    perProvider.set(provider, used + 1);
    result.claimed += 1;

    const adapter = getAdapter(provider);

    const available = adapter
      ? adapter.isConfiguredForUser
        ? await adapter.isConfiguredForUser(row.user_id)
        : adapter.isConfigured()
      : false;
    if (!available) {

      result.skipped += 1;
      await supabaseAdmin
        .from("integration_outbox")
        .update({ status: "skipped", last_error: "provider not configured", processed_at: nowIso })
        .eq("id", row.id);
      continue;
    }

    try {
      await adapter!.send(row.payload as unknown as IntegrationEvent);
      result.delivered += 1;
      await supabaseAdmin
        .from("integration_outbox")
        .update({
          status: "delivered",
          attempts: row.attempts + 1,
          last_error: null,
          processed_at: new Date().toISOString(),
        })
        .eq("id", row.id);
    } catch (err) {
      const attempts = row.attempts + 1;
      const exhausted = attempts >= MAX_ATTEMPTS;
      result.failed += 1;
      await supabaseAdmin
        .from("integration_outbox")
        .update({
          status: exhausted ? "failed" : "pending",
          attempts,
          last_error: err instanceof Error ? err.message : String(err),
          next_attempt_at: new Date(
            Date.now() + backoffMinutes(attempts) * 60_000,
          ).toISOString(),
          processed_at: exhausted ? new Date().toISOString() : null,
        })
        .eq("id", row.id);
    }
  }

  return result;
}
