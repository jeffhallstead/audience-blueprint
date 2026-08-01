/**
 * Publisher Copilot™ — server functions.
 *
 * Structured generation (documents, simulations, prompt packs) runs here rather
 * than through the chat transport: these produce typed deliverables, not
 * streamed prose. Every call rebuilds the organizational briefing server-side,
 * so the client never supplies business context and cannot spoof it.
 */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import {
  COPILOT_MODEL,
  createLovableAiGatewayProvider,
  requireLovableApiKey,
} from "@/lib/ai-gateway.server";
import { buildCopilotContext } from "@/lib/copilot/context.server";
import { buildPromptPackPrompt, buildSimulationPrompt, buildSystemPrompt } from "@/lib/copilot/prompts.server";
import {
  documentToMarkdown,
  promptPackSchema,
  simulationSchema,
  simulationToMarkdown,
  strategyDocumentSchema,
  type Simulation,
  type StrategyDocument,
} from "@/lib/copilot/schema";
import { DOCUMENT_KIND_LABELS, type ObjectiveId } from "@/lib/copilot/objectives";

const DOCUMENT_OBJECTIVES = ["strategy", "roadmap", "pillars", "franchises", "score", "presentation"] as const;

const generateDocumentInput = z.object({
  objective: z.enum(DOCUMENT_OBJECTIVES),
  /** Optional user steer, e.g. "focus on the EMEA segment". */
  instruction: z.string().max(2000).optional(),
  /** Set when regenerating: the previous document is superseded by a new version. */
  supersedesDocumentId: z.string().uuid().optional(),
});

function friendlyAiError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("429")) {
    return new Error("Publisher Copilot™ is rate limited right now. Wait a moment and try again.");
  }
  if (message.includes("402")) {
    return new Error("AI credits are exhausted for this workspace. Add credits to continue using Publisher Copilot™.");
  }
  return new Error(`Publisher Copilot™ could not complete this request: ${message}`);
}

export const generateStrategyDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => generateDocumentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const briefing = await buildCopilotContext(supabase, userId);
    if (!briefing.hasAssessment) {
      throw new Error("Complete the Publisher Index™ assessment before generating strategy documents.");
    }

    // Strict json_schema mode: without it the gateway falls back to json_object
    // and the model silently omits required fields.
    const gateway = createLovableAiGatewayProvider(requireLovableApiKey(), undefined, {
      structuredOutputs: true,
    });
    const objective = data.objective as ObjectiveId;

    let document: StrategyDocument;
    try {
      const { output } = await generateText({
        model: gateway(COPILOT_MODEL),
        output: Output.object({ schema: strategyDocumentSchema }),
        system: buildSystemPrompt(objective, briefing.briefing, true),
        prompt: data.instruction?.trim()
          ? `Additional direction from the user for this deliverable: ${data.instruction.trim()}`
          : "Produce the deliverable now.",
      });
      document = output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("Publisher Copilot™ returned an unusable response. Try regenerating.");
      }
      throw friendlyAiError(error);
    }

    // Versioning: a regeneration becomes version n+1 and archives its predecessor.
    let version = 1;
    let parentId: string | null = null;
    if (data.supersedesDocumentId) {
      const { data: previous } = await supabase
        .from("generated_documents")
        .select("id, version, parent_document_id")
        .eq("id", data.supersedesDocumentId)
        .eq("user_id", userId)
        .maybeSingle();
      if (previous) {
        version = previous.version + 1;
        parentId = previous.parent_document_id ?? previous.id;
        await supabase.from("generated_documents").update({ status: "superseded" }).eq("id", previous.id);
      }
    }

    const { data: saved, error } = await supabase
      .from("generated_documents")
      .insert({
        user_id: userId,
        assessment_id: briefing.assessmentId,
        parent_document_id: parentId,
        kind: objective,
        title: document.title || DOCUMENT_KIND_LABELS[objective] || "Strategy document",
        summary: document.executiveSummary.slice(0, 400),
        body: document as never,
        markdown: documentToMarkdown(document),
        model: COPILOT_MODEL,
        version,
        status: "saved",
      })
      .select("id")
      .single();
    if (error) throw new Error(`Generated, but could not be saved: ${error.message}`);

    return { documentId: saved.id, document, version };
  });

const simulateInput = z.object({
  scenario: z.string().min(3).max(1000),
  supersedesDocumentId: z.string().uuid().optional(),
});

export const simulateScenario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => simulateInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const briefing = await buildCopilotContext(supabase, userId);
    if (!briefing.hasAssessment) {
      throw new Error("Complete the Publisher Index™ assessment before running scenarios.");
    }

    const gateway = createLovableAiGatewayProvider(requireLovableApiKey(), undefined, {
      structuredOutputs: true,
    });

    let simulation: Simulation;
    try {
      const { output } = await generateText({
        model: gateway(COPILOT_MODEL),
        output: Output.object({ schema: simulationSchema }),
        system: buildSimulationPrompt(briefing.briefing),
        prompt: `Scenario to model: ${data.scenario.trim()}`,
      });
      simulation = output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("Publisher Copilot™ returned an unusable response. Try rephrasing the scenario.");
      }
      throw friendlyAiError(error);
    }

    const { data: saved, error } = await supabase
      .from("generated_documents")
      .insert({
        user_id: userId,
        assessment_id: briefing.assessmentId,
        kind: "simulator",
        title: simulation.title || `Scenario: ${data.scenario.slice(0, 80)}`,
        summary: simulation.headline.slice(0, 400),
        body: { scenario: data.scenario, simulation } as never,
        markdown: simulationToMarkdown(simulation),
        model: COPILOT_MODEL,
        status: "saved",
      })
      .select("id")
      .single();
    if (error) throw new Error(`Simulated, but could not be saved: ${error.message}`);

    return { documentId: saved.id, simulation };
  });

export const generatePromptPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const briefing = await buildCopilotContext(supabase, userId);
    if (!briefing.hasAssessment) {
      throw new Error("Complete the Publisher Index™ assessment before generating a prompt pack.");
    }

    const gateway = createLovableAiGatewayProvider(requireLovableApiKey(), undefined, {
      structuredOutputs: true,
    });

    let prompts;
    try {
      const { output } = await generateText({
        model: gateway(COPILOT_MODEL),
        output: Output.object({ schema: promptPackSchema }),
        system: buildPromptPackPrompt(briefing.briefing),
        prompt: "Write the prompt library now.",
      });
      prompts = output.prompts.slice(0, 12);
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("Publisher Copilot™ returned an unusable prompt pack. Try again.");
      }
      throw friendlyAiError(error);
    }

    const rows = prompts.map((item) => ({
      user_id: userId,
      is_system: false,
      slug: `${item.slug}-${Date.now().toString(36)}`,
      category: item.category,
      title: item.title,
      description: item.description,
      body: item.body,
    }));

    const { error } = await supabase.from("prompt_templates").insert(rows);
    if (error) throw new Error(`Generated, but could not be saved: ${error.message}`);

    return { count: rows.length };
  });

/** Naming a conversation from its first exchange — cheap, non-blocking. */
export const nameSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().uuid(), firstMessage: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const gateway = createLovableAiGatewayProvider(requireLovableApiKey());

    let title = data.firstMessage.slice(0, 60);
    try {
      const { text } = await generateText({
        model: gateway(COPILOT_MODEL),
        system:
          "Write a title of at most six words for a strategy conversation that opened with the message below. Reply with the title only — no quotes, no punctuation at the end.",
        prompt: data.firstMessage.slice(0, 500),
      });
      const cleaned = text.trim().replace(/^["']|["']$/g, "");
      if (cleaned) title = cleaned.slice(0, 80);
    } catch {
      /* fall back to the truncated message */
    }

    await supabase.from("ai_sessions").update({ title }).eq("id", data.sessionId).eq("user_id", userId);
    return { title };
  });
