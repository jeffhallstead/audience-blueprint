import type {
  IntegrationAdapter,
  IntegrationEvent,
  IntegrationProvider,
} from "./types";
import { INTEGRATION_PROVIDERS, MAX_ATTEMPTS } from "./types";
import { airtableAdapter } from "./airtable.server";
import { hubspotAdapter } from "./hubspot.server";

const ADAPTERS: Record<IntegrationProvider, IntegrationAdapter> = {
  airtable: airtableAdapter,
  hubspot: hubspotAdapter,
};

export function getAdapter(provider: IntegrationProvider): IntegrationAdapter | null {
  return ADAPTERS[provider] ?? null;
}

/** Providers that currently have credentials wired up. */
export function configuredProviders(): IntegrationProvider[] {
  return INTEGRATION_PROVIDERS.filter((p) => ADAPTERS[p].isConfigured());
}

/**
 * Queue an event for every configured provider. Never throws — integrations must
 * not break signup, assessment, or checkout flows.
 */
export async function enqueueIntegrationEvent(
  event: IntegrationEvent,
  options: { dedupeKey?: string } = {},
): Promise<void> {
  try {
    const providers = configuredProviders();
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

  const result: DispatchResult = { claimed: rows?.length ?? 0, delivered: 0, failed: 0, skipped: 0 };

  for (const row of rows ?? []) {
    const adapter = getAdapter(row.provider as IntegrationProvider);
    if (!adapter || !adapter.isConfigured()) {
      result.skipped += 1;
      await supabaseAdmin
        .from("integration_outbox")
        .update({ status: "skipped", last_error: "provider not configured", processed_at: nowIso })
        .eq("id", row.id);
      continue;
    }

    try {
      await adapter.send(row.payload as unknown as IntegrationEvent);
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
