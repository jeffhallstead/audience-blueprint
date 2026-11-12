import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const VERTICALS = ["beauty", "fashion", "food", "wellness", "other"] as const;
const PATTERN_IDS = ["paid_media_plateau", "campaign_factory", "borrowed_audience", "invisible_studio", "fragmented_builder", "category_leader"] as const;

const intake = z.object({
  brandName: z.string().trim().min(1).max(200),
  website: z.string().trim().max(500).optional().default(""),
  handles: z.string().trim().max(1000).optional().default(""),
  vertical: z.enum(VERTICALS),
  editorialNewsletter: z.boolean(),
  recurringSeries: z.boolean(),
  heavyPaid: z.boolean(),
  activeCommunity: z.boolean(),
  notes: z.string().trim().max(4000).optional().default(""),
});

type Ctx = { supabase: any; userId: string };
async function requireStaff({ supabase, userId }: Ctx) {
  const [a, b] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "analyst" }),
  ]);
  if (!a.data && !b.data) throw new Error("Forbidden");
}

export const listTeardowns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireStaff(context as Ctx);
    const { data, error } = await context.supabase
      .from("brand_teardowns").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteTeardown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await requireStaff(context as Ctx);
    const { error } = await context.supabase.from("brand_teardowns").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const runTeardown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => intake.parse(i))
  .handler(async ({ data, context }) => {
    await requireStaff(context as Ctx);
    const { generateText, Output } = await import("ai");
    const { COPILOT_MODEL, createLovableAiGatewayProvider, requireLovableApiKey } = await import("@/lib/ai-gateway.server");
    const { PUBLISHER_PATTERNS } = await import("@/lib/publisher-patterns");
    const { CATEGORIES } = await import("@/lib/assessment/config");
    const { normalizeTeardownScores } = await import("./scoring");

    const schema = z.object({
      scores: z.object({
        audience: z.number(), content: z.number(), distribution: z.number(),
        operations: z.number(), strategy: z.number(), alignment: z.number(),
      }),
      patternId: z.enum(PATTERN_IDS),
      patternReason: z.string(),
      priorities: z.array(z.object({ title: z.string(), detail: z.string() })),
      emailSubject: z.string(),
      emailBody: z.string(),
    });

    const system = `You are Jeff Hallstead, a fractional Chief Content Officer who runs Publisher Blueprint. You turn brands into publishers that own their audience.
Estimate how this brand would score on the Publisher Test from publicly observable signals only. Be realistic and conservative; never invent facts or metrics.

Six dimensions (score each 0-100):
${CATEGORIES.map((c) => `- ${c.id}: ${c.description}`).join("\n")}

Six Publisher Patterns (choose exactly one id):
${PUBLISHER_PATTERNS.map((p) => `- ${p.id} (${p.name}): ${p.shortDiagnosis} Signals: ${p.typicalSignals.join("; ")}. Priority: ${p.blueprintPriority}`).join("\n")}

Then write a cold outreach email teardown from Jeff:
- Subject: short, specific to the brand, no clickbait.
- Body (150-220 words, plain text, no markdown headers): open with one specific genuine observation about their reach; name the leak (where attention isn't becoming owned audience) and why it matters, using the pattern name; give exactly two concrete moves tailored to their vertical; close with a soft CTA to take the free 12-minute Publisher Test at https://blueprint.jeffhallstead.com/test or reply to talk. Sign off "Jeff". Executive, terse, no hype, no emojis.
priorities: exactly two 90-day moves matching the email.`;

    const prompt = `Brand: ${data.brandName}
Website: ${data.website || "n/a"}
Handles: ${data.handles || "n/a"}
Vertical: ${data.vertical}
Editorial newsletter (not just a discount popup): ${data.editorialNewsletter ? "yes" : "no"}
Recurring series/franchise content: ${data.recurringSeries ? "yes" : "no"}
Heavy paid ads: ${data.heavyPaid ? "yes" : "no"}
Active community: ${data.activeCommunity ? "yes" : "no"}
Observations: ${data.notes || "none"}`;

    const gateway = createLovableAiGatewayProvider(requireLovableApiKey(), undefined, { structuredOutputs: true });
    let out: z.infer<typeof schema>;
    try {
      const r = await generateText({ model: gateway(COPILOT_MODEL), output: Output.object({ schema }), system, prompt });
      out = r.output;
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (m.includes("429")) throw new Error("The AI is rate limited right now. Try again in a moment.");
      if (m.includes("402")) throw new Error("AI credits are exhausted. Add credits to continue.");
      throw new Error("The teardown could not be generated. Try again.");
    }

    const { dimensions, overall } = normalizeTeardownScores(out.scores);
    const { brandName, website, vertical, ...rest } = data;
    const { data: saved, error } = await context.supabase.from("brand_teardowns").insert({
      created_by: context.userId,
      brand_name: brandName,
      website: website || null,
      vertical,
      inputs: rest as never,
      overall_score: overall,
      dimension_scores: dimensions as never,
      pattern_id: out.patternId,
      pattern_reason: out.patternReason,
      priorities: out.priorities.slice(0, 2) as never,
      email_subject: out.emailSubject,
      email_body: out.emailBody,
      model: COPILOT_MODEL,
    }).select("*").single();
    if (error) throw new Error(`Generated, but could not be saved: ${error.message}`);
    return saved;
  });
