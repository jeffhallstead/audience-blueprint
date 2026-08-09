/**
 * Slack notifications for internal lead alerts.
 *
 * Posts through the Lovable connector gateway with the workspace Slack
 * connection. Never throws: a Slack outage must not affect the user flow that
 * produced the event.
 */

import type { PlatformEventInput } from "@/lib/events/catalog";
import { MATURITY_LEVELS } from "@/lib/assessment/config";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/slack/api";
const LEADS_CHANNEL = "#publisher-leads";

async function postSlackMessage(channel: string, text: string): Promise<void> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const slackKey = process.env["SLACK_API_KEY"];
  if (!lovableKey || !slackKey) {
    console.error("[slack] missing LOVABLE_API_KEY or SLACK_API_KEY; skipping notification");
    return;
  }

  const response = await fetch(`${GATEWAY_URL}/chat.postMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": slackKey,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ channel, text }),
  });

  const body = await response.text();
  if (!response.ok) {
    console.error(`[slack] chat.postMessage failed [${response.status}]: ${body.slice(0, 500)}`);
    return;
  }
  try {
    const parsed = JSON.parse(body) as { ok?: boolean; error?: string };
    if (!parsed.ok) console.error(`[slack] chat.postMessage rejected: ${parsed.error ?? body.slice(0, 200)}`);
  } catch {
    console.error(`[slack] chat.postMessage returned non-JSON: ${body.slice(0, 200)}`);
  }
}

/** Resolves the display name and email for the user behind an event. */
async function resolveContact(userId: string): Promise<{ name: string | null; email: string | null }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [authResult, profileResult] = await Promise.all([
    supabaseAdmin.auth.admin.getUserById(userId),
    supabaseAdmin.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
  ]);
  return {
    name: profileResult.data?.full_name ?? null,
    email: authResult.data.user?.email ?? null,
  };
}

/** True for events that should ping the internal leads channel. */
export function slackNotifiableEvent(type: PlatformEventInput["type"]): boolean {
  return type === "assessment.completed";
}

export async function notifySlackFor(input: PlatformEventInput): Promise<void> {
  try {
    if (!slackNotifiableEvent(input.type) || !input.userId) return;

    const { name, email } = await resolveContact(input.userId);
    const who = name ?? email ?? "A visitor";
    const withEmail = email && name ? `${who} (${email})` : who;

    const payload = input.payload ?? {};
    const score = typeof payload["overall_score"] === "number" ? payload["overall_score"] : null;
    const levelValue = payload["maturity_level"];
    const level = typeof levelValue === "number" ? levelValue : null;
    const title = MATURITY_LEVELS.find((item) => item.level === level)?.title ?? null;

    const scoreText =
      score === null
        ? "Publisher Index score unavailable"
        : `Publisher Index score ${score}${level ? ` (Level ${level}${title ? `, ${title}` : ""})` : ""}`;

    await postSlackMessage(LEADS_CHANNEL, `New Publisher Test completed — ${withEmail} — ${scoreText}`);
  } catch (error) {
    console.error(`[slack] notification threw: ${error instanceof Error ? error.message : String(error)}`);
  }
}
