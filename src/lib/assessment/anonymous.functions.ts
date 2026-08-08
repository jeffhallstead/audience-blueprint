/**
 * Public entry point for the anonymous Publisher Test.
 *
 * The visitor completes the whole diagnostic before we ask for anything, so
 * this is the first server call in the funnel. It is intentionally
 * unauthenticated: its only power is "create an account for this email, or
 * send that email a sign-in link". No test data is accepted here — answers are
 * written by the browser once the session exists and RLS applies.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid work email").max(255),
  /** Same-origin URL the sign-in link should return to. Validated server-side. */
  origin: z.string().trim().max(200).optional(),
});

const ALLOWED_ORIGIN = /^https?:\/\/(localhost:\d+|[a-z0-9-]+\.lovable\.app|([a-z0-9-]+\.)?jeffhallstead\.com)$/i;

export type StartFromEmailResult =
  | { status: "created"; tokenHash: string }
  | { status: "existing" };

export const startTestAccount = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<StartFromEmailResult> => {
    const origin = data.origin && ALLOWED_ORIGIN.test(data.origin) ? data.origin : "https://blueprint.jeffhallstead.com";
    const redirectTo = `${origin}/test`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Random internal password: the visitor never sets or sees one. They can
    // add a password or link Google later from settings.
    const password = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password,
      email_confirm: true,
    });

    if (createError) {
      const alreadyRegistered =
        /already/i.test(createError.message) || createError.status === 422;
      if (!alreadyRegistered) {
        console.error(`anonymous test signup failed: ${createError.message}`);
        throw new Error("We couldn't open your score. Please try again in a moment.");
      }

      // Known address: never create a duplicate, never sign anyone in from an
      // email alone. Send a one-click link to the inbox that owns it.
      const { createClient } = await import("@supabase/supabase-js");
      const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
      const publicClient = createClient(process.env["SUPABASE_URL"]!, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
          fetch: (input, init) => {
            const headers = new Headers(init?.headers);
            if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
              headers.delete("Authorization");
            }
            headers.set("apikey", key);
            return fetch(input, { ...init, headers });
          },
        },
      });
      await publicClient.auth.signInWithOtp({
        email: data.email,
        options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
      });
      return { status: "existing" };
    }

    // Brand new account: mint a one-time token the browser exchanges for a
    // session immediately, so the score appears without an inbox round trip.
    const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: data.email,
      options: { redirectTo },
    });
    if (linkError || !link?.properties?.hashed_token) {
      console.error(`anonymous test link failed: ${linkError?.message ?? "no token"}`);
      throw new Error("We couldn't open your score. Please try again in a moment.");
    }

    return { status: "created", tokenHash: link.properties.hashed_token };
  });
