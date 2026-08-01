import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendTemplateEmail } from "@/lib/email-templates/send-email";

const WELCOME_PATH = "/welcome";

const ALLOWED_ORIGINS = [/^https:\/\/[a-z0-9-]+\.lovable\.app$/i, /^https:\/\/([a-z0-9-]+\.)?jeffhallstead\.com$/i];

function resolveWelcomeUrl(origin: string | undefined): string {
  if (origin && ALLOWED_ORIGINS.some((pattern) => pattern.test(origin))) {
    return `${origin}${WELCOME_PATH}`;
  }
  return `https://jeffhallstead.com${WELCOME_PATH}`;
}

/**
 * Sends the welcome email once per account. Safe to call on every visit to the
 * welcome screen — the profile timestamp gates repeat sends.
 */
export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { origin?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, welcome_email_sent_at")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.welcome_email_sent_at) return { sent: false as const };

    const email = (claims as { email?: string } | null)?.email;
    if (!email) return { sent: false as const };

    // Mark first so concurrent calls cannot double-send.
    const { data: claimed } = await supabase
      .from("profiles")
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq("id", userId)
      .is("welcome_email_sent_at", null)
      .select("id")
      .maybeSingle();

    if (!claimed) return { sent: false as const };

    try {
      await sendTemplateEmail("welcome", email, {
        templateData: {
          name: profile?.full_name?.split(" ")[0] ?? undefined,
          welcomeUrl: resolveWelcomeUrl(data.origin),
        },
        idempotencyKey: `welcome-${userId}`,
      });
    } catch (error) {
      console.error("welcome email failed", error);
      await supabase.from("profiles").update({ welcome_email_sent_at: null }).eq("id", userId);
      return { sent: false as const };
    }

    return { sent: true as const };
  });
