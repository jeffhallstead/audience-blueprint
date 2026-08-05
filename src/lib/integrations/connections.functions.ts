import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PROVIDERS = ["airtable", "asana"] as const;
type Provider = (typeof PROVIDERS)[number];

function assertProvider(value: unknown): Provider {
  if (typeof value !== "string" || !PROVIDERS.includes(value as Provider)) {
    throw new Error("Unsupported integration");
  }
  return value as Provider;
}

type PaymentEnv = "sandbox" | "live";

function assertEnv(value: unknown): PaymentEnv {
  return value === "live" ? "live" : "sandbox";
}

function cleanToken(value: unknown): string {
  const token = typeof value === "string" ? value.trim() : "";
  if (token.length < 10 || token.length > 500) throw new Error("That token doesn't look right.");
  return token;
}

/** Each user's own Airtable / Asana connections (no tokens ever leave the server). */
export const listMyConnections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listUserConnections } = await import("@/lib/integrations/credentials.server");
    return { connections: await listUserConnections(context.userId) };
  });

/** Saves a personal access token after verifying it against the provider. */
export const connectIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: string; token: string; environment?: string }) => ({
    environment: assertEnv(input?.environment),
    provider: assertProvider(input?.provider),
    token: cleanToken(input?.token),
  }))
  .handler(async ({ data, context }) => {
    const { requireFeature } = await import("@/lib/commerce/entitlement.server");
    await requireFeature(context.supabase, context.userId, data.environment, "connector_export");
    const { saveUserCredential } = await import("@/lib/integrations/credentials.server");

    let label: string;
    if (data.provider === "asana") {
      const { fetchAsanaUser } = await import("@/lib/integrations/asana.server");
      const user = await fetchAsanaUser(data.token);
      label = user.email ?? user.name;
    } else {
      const { listAirtableBases } = await import("@/lib/integrations/airtable-records.server");
      const bases = await listAirtableBases(data.token);
      if (bases.length === 0) {
        throw new Error("That token works, but it has no access to any Airtable base.");
      }
      label = `${bases.length} base${bases.length === 1 ? "" : "s"}`;
    }

    await saveUserCredential(context.userId, data.provider, {
      token: data.token,
      accountLabel: label,
    });
    return { connected: true as const, label };
  });

/** Removes a user's stored token for a provider. */
export const disconnectIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: string }) => ({ provider: assertProvider(input?.provider) }))
  .handler(async ({ data, context }) => {
    const { deleteUserCredential } = await import("@/lib/integrations/credentials.server");
    await deleteUserCredential(context.userId, data.provider);
    return { disconnected: true as const };
  });

/** Airtable bases the user's token can write to. */
export const listMyAirtableBases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { environment?: string } | undefined) => ({
    environment: assertEnv(input?.environment),
  }))
  .handler(async ({ data, context }) => {
    const { requireFeature } = await import("@/lib/commerce/entitlement.server");
    await requireFeature(context.supabase, context.userId, data.environment, "connector_export");
    const { getUserCredential } = await import("@/lib/integrations/credentials.server");
    const credential = await getUserCredential(context.userId, "airtable");
    if (!credential?.token) return { connected: false as const, bases: [], selectedBaseId: null };
    const { listAirtableBases } = await import("@/lib/integrations/airtable-records.server");
    try {
      return {
        connected: true as const,
        bases: await listAirtableBases(credential.token),
        selectedBaseId: credential.airtableBaseId,
      };
    } catch (err) {
      console.error("[integrations] airtable base list failed:", err);
      return { connected: true as const, bases: [], selectedBaseId: credential.airtableBaseId };
    }
  });

/** Stores which Airtable base this user exports into. */
export const selectAirtableBase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { baseId: string; environment?: string }) => ({
    environment: assertEnv(input?.environment),
    baseId: String(input?.baseId ?? "").trim().slice(0, 100),
  }))
  .handler(async ({ data, context }) => {
    if (!data.baseId) throw new Error("Choose a base");
    const { requireFeature } = await import("@/lib/commerce/entitlement.server");
    await requireFeature(context.supabase, context.userId, data.environment, "connector_export");
    const { saveUserCredential } = await import("@/lib/integrations/credentials.server");
    await saveUserCredential(context.userId, "airtable", { airtableBaseId: data.baseId });
    return { saved: true as const };
  });
