/**
 * Public submission endpoint for Microdrama Greenlight.
 * Unauthenticated by design (lead magnet): the verdict is recomputed here from
 * raw answers, stored with the service role, and announced to Slack.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resolveGreenlight, type GreenlightAnswers } from "./greenlight";

const score = z.number().int().min(0).max(2);
const inputSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid work email").max(255),
  company: z.string().trim().min(1, "Enter your brand or company").max(160),
  answers: z.object({
    product_role: score,
    purchase_path: score,
    capture: score,
    distribution_budget: score,
    approval_speed: score,
    genre_comfort: score,
    season_commitment: score,
    measurement: score,
    budget_status: score,
    operating_context: z.enum([
      "paid_media_plateau",
      "borrowed_audience",
      "campaign_factory",
      "invisible_studio",
      "fragmented_builder",
      "category_leader",
    ]),
  }),
});

export const submitGreenlight = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const result = resolveGreenlight(data.answers as GreenlightAnswers);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("microdrama_greenlight_checks").insert({
      email: data.email,
      company: data.company,
      answers: data.answers as never,
      score: result.score,
      pattern_id: result.patternId,
      verdict: result.verdict,
      condition_met: result.conditionMet,
      enterprise_referral: result.enterpriseReferral,
      blockers: result.blockers as never,
    });
    if (error) console.error(`greenlight insert failed: ${error.message}`);

    const { notifyGreenlightLead } = await import("@/lib/integrations/slack.server");
    await notifyGreenlightLead({ email: data.email, company: data.company, result });
    return result;
  });
