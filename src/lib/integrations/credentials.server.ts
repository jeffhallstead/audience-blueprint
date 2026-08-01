/**
 * Per-user integration credentials (Airtable / Asana personal access tokens).
 *
 * Server-only. Tokens are encrypted with AES-256-GCM before they touch the
 * database and are never returned to the browser.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type UserIntegrationProvider = "airtable" | "asana";

function key(): Buffer {
  const raw = process.env["USER_INTEGRATION_CRED_SECRET"];
  if (!raw) throw new Error("USER_INTEGRATION_CRED_SECRET is not configured");
  // Hash so any secret length/encoding yields a valid 32-byte key.
  return createHash("sha256").update(raw).digest();
}

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

export function decryptToken(stored: string): string {
  const buf = Buffer.from(stored, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key(), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
}

export interface UserCredential {
  token: string;
  airtableBaseId: string | null;
  accountLabel: string | null;
}

/** Loads and decrypts one user's credential for a provider, or null. */
export async function getUserCredential(
  userId: string | null,
  provider: UserIntegrationProvider,
): Promise<UserCredential | null> {
  if (!userId) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_integration_credentials")
    .select("token_ciphertext, airtable_base_id, account_label")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    token: decryptToken(data.token_ciphertext),
    airtableBaseId: data.airtable_base_id,
    accountLabel: data.account_label,
  };
}

export async function saveUserCredential(
  userId: string,
  provider: UserIntegrationProvider,
  input: { token?: string; airtableBaseId?: string | null; accountLabel?: string | null },
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const patch: Record<string, unknown> = {
    user_id: userId,
    provider,
    updated_at: new Date().toISOString(),
  };
  if (input.token) patch["token_ciphertext"] = encryptToken(input.token);
  if (input.airtableBaseId !== undefined) patch["airtable_base_id"] = input.airtableBaseId;
  if (input.accountLabel !== undefined) patch["account_label"] = input.accountLabel;

  const { error } = await supabaseAdmin
    .from("user_integration_credentials")
    .upsert(patch as never, { onConflict: "user_id,provider" });
  if (error) throw new Error(error.message);
}

export async function deleteUserCredential(
  userId: string,
  provider: UserIntegrationProvider,
): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("user_integration_credentials")
    .delete()
    .eq("user_id", userId)
    .eq("provider", provider);
  if (error) throw new Error(error.message);
}

/** Non-secret connection summary for the UI. */
export async function listUserConnections(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_integration_credentials")
    .select("provider, airtable_base_id, account_label, updated_at")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    provider: row.provider as UserIntegrationProvider,
    airtableBaseId: row.airtable_base_id,
    accountLabel: row.account_label,
    connectedAt: row.updated_at,
  }));
}
