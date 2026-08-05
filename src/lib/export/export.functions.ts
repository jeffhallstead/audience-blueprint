import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ExportRow } from "@/lib/export/rows";
import { EXPORT_COLUMNS } from "@/lib/export/rows";
import { RECORD_PROVIDERS, type IntegrationProvider } from "@/lib/integrations/types";

const MAX_ROWS = 500;

type PaymentEnv = "sandbox" | "live";

function assertEnv(value: unknown): PaymentEnv {
  return value === "live" ? "live" : "sandbox";
}

function assertRecordProvider(value: unknown): IntegrationProvider {
  if (typeof value !== "string" || !RECORD_PROVIDERS.includes(value as IntegrationProvider)) {
    throw new Error("Unsupported export destination");
  }
  return value as IntegrationProvider;
}

function sanitizeRows(input: unknown): ExportRow[] {
  if (!Array.isArray(input) || input.length === 0) throw new Error("Nothing to export");
  if (input.length > MAX_ROWS) throw new Error(`Export is limited to ${MAX_ROWS} rows`);
  return input.map((raw) => {
    const source = (raw ?? {}) as Record<string, unknown>;
    const row = {} as Record<string, string>;
    for (const column of EXPORT_COLUMNS) {
      row[column] = String(source[column] ?? "").slice(0, 2000);
    }
    if (!row["Title"] || !row["Key"]) throw new Error("Export row is missing a title");
    return row as unknown as ExportRow;
  });
}

/** Which record destinations this user has connected. */
export const getExportDestinations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { environment?: string } | undefined) => ({
    environment: assertEnv(input?.environment),
  }))
  .handler(async ({ data, context }) => {
    const { requireFeature } = await import("@/lib/commerce/entitlement.server");
    await requireFeature(context.supabase, context.userId, data.environment, "connector_export");
    const { listUserConnections } = await import("@/lib/integrations/credentials.server");
    const connections = await listUserConnections(context.userId);

    const available: IntegrationProvider[] = [];
    if (connections.some((c) => c.provider === "airtable" && c.airtableBaseId)) {
      available.push("airtable_records");
    }
    if (connections.some((c) => c.provider === "asana")) available.push("asana");

    const { data } = await context.supabase
      .from("export_targets")
      .select("provider, airtable_table, asana_project_id, asana_project_name, last_exported_at")
      .eq("user_id", context.userId);

    return {
      available,
      connections,
      targets: data ?? [],
    };
  });

/** Saves the per-user destination config (Airtable table, Asana project). */
export const saveExportTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      environment?: string;
      provider: string;
      airtableTable?: string | null;
      asanaProjectId?: string | null;
      asanaProjectName?: string | null;
    }) => ({
      environment: assertEnv(input?.environment),
      provider: assertRecordProvider(input?.provider),
      airtableTable: input?.airtableTable?.slice(0, 200) ?? null,
      asanaProjectId: input?.asanaProjectId?.slice(0, 100) ?? null,
      asanaProjectName: input?.asanaProjectName?.slice(0, 200) ?? null,
    }),
  )
  .handler(async ({ data, context }) => {
    const { requireFeature } = await import("@/lib/commerce/entitlement.server");
    await requireFeature(context.supabase, context.userId, data.environment, "connector_export");
    const { error } = await context.supabase.from("export_targets").upsert(
      {
        user_id: context.userId,
        provider: data.provider,
        airtable_table: data.airtableTable,
        asana_project_id: data.asanaProjectId,
        asana_project_name: data.asanaProjectName,
      },
      { onConflict: "user_id,provider" },
    );
    if (error) throw new Error(error.message);
    return { saved: true as const };
  });

/** Asana projects this user's connected account can write to. */
export const listExportAsanaProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { environment?: string } | undefined) => ({
    environment: assertEnv(input?.environment),
  }))
  .handler(async ({ data, context }) => {
    const { requireFeature } = await import("@/lib/commerce/entitlement.server");
    await requireFeature(context.supabase, context.userId, data.environment, "connector_export");
    const { getUserCredential } = await import("@/lib/integrations/credentials.server");
    const credential = await getUserCredential(context.userId, "asana");
    if (!credential?.token) return { connected: false as const, projects: [] };
    try {
      const { listAsanaProjects } = await import("@/lib/integrations/asana.server");
      return { connected: true as const, projects: await listAsanaProjects(credential.token) };
    } catch (err) {
      console.error("[export] asana project list failed:", err);
      return { connected: true as const, projects: [] };
    }
  });


/**
 * Queues exported Blueprint rows for delivery to a record destination.
 * Delivery itself runs through the existing integration outbox (retry + backoff).
 */
export const pushExportRows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: string; rows: unknown; environment?: string }) => ({
    environment: assertEnv(input?.environment),
    provider: assertRecordProvider(input?.provider),
    rows: sanitizeRows(input?.rows),
  }))
  .handler(async ({ data, context }) => {
    const { requireFeature } = await import("@/lib/commerce/entitlement.server");
    await requireFeature(context.supabase, context.userId, data.environment, "connector_export");
    const { getAdapter } = await import("@/lib/integrations/outbox.server");
    const adapter = getAdapter(data.provider);
    const ready = adapter
      ? adapter.isConfiguredForUser
        ? await adapter.isConfiguredForUser(context.userId)
        : adapter.isConfigured()
      : false;
    if (!ready) {
      throw new Error("Connect that destination in Settings first.");
    }


    const { data: target } = await context.supabase
      .from("export_targets")
      .select("airtable_table, asana_project_id")
      .eq("user_id", context.userId)
      .eq("provider", data.provider)
      .maybeSingle();

    if (data.provider === "asana" && !target?.asana_project_id) {
      throw new Error("Choose an Asana project before exporting.");
    }

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", context.userId)
      .maybeSingle();

    const { enqueueIntegrationEvent } = await import("@/lib/integrations/outbox.server");
    await enqueueIntegrationEvent(
      {
        eventName: "records.exported",
        userId: context.userId,
        email: (context.claims as { email?: string } | null)?.email ?? null,
        fullName: profile?.full_name ?? null,
        occurredAt: new Date().toISOString(),
        records: data.rows,
        target: {
          airtableTable: target?.airtable_table ?? null,
          asanaProjectId: target?.asana_project_id ?? null,
        },
        metadata: { rowCount: data.rows.length },
      },
      {
        providers: [data.provider],
        // A new key per push so a re-export always runs.
        dedupeKey: `export:${context.userId}:${Date.now()}`,
      },
    );

    await context.supabase
      .from("export_targets")
      .update({ last_exported_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .eq("provider", data.provider);

    // Drain immediately so the push feels synchronous; the scheduled dispatch
    // endpoint still retries anything that fails here.
    try {
      const { dispatchOutbox } = await import("@/lib/integrations/outbox.server");
      const result = await dispatchOutbox(10);
      return { queued: true as const, rows: data.rows.length, delivered: result.delivered, failed: result.failed };
    } catch (err) {
      console.error("[export] immediate dispatch failed:", err);
      return { queued: true as const, rows: data.rows.length, delivered: 0, failed: 0 };
    }
  });
