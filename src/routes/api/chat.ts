/**
 * Publisher Copilot™ — conversational streaming endpoint.
 *
 * Raw HTTP route because the AI SDK chat transport POSTs to a URL and expects a
 * streaming Response. Auth comes from the bearer token the client attaches;
 * every request rebuilds the organizational briefing before the model answers.
 */

import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  COPILOT_MODEL,
  createLovableAiGatewayProvider,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  requireLovableApiKey,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";
import { authenticateRequest } from "@/lib/copilot/auth.server";
import { buildCopilotContext } from "@/lib/copilot/context.server";
import { buildSystemPrompt } from "@/lib/copilot/prompts.server";

interface ChatRequestBody {
  messages?: unknown;
  sessionId?: unknown;
}

function textOf(message: UIMessage): string {
  return (message.parts ?? [])
    .map((part) => ("text" in part && typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticateRequest(request);
        if (!auth) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;
        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("Messages are required", { status: 400 });
        }
        if (!sessionId) return new Response("sessionId is required", { status: 400 });

        const { supabase, userId } = auth;

        // Ownership check — never stream against someone else's session.
        const { data: session } = await supabase
          .from("ai_sessions")
          .select("id, objective")
          .eq("id", sessionId)
          .eq("user_id", userId)
          .maybeSingle();
        if (!session) return new Response("Session not found", { status: 404 });

        const uiMessages = messages as UIMessage[];
        const context = await buildCopilotContext(supabase, userId);

        const latest = uiMessages[uiMessages.length - 1];
        if (latest?.role === "user") {
          const { error } = await supabase.from("ai_messages").upsert(
            {
              session_id: sessionId,
              user_id: userId,
              role: "user",
              message_key: latest.id,
              parts: latest.parts as never,
              content: textOf(latest),
            },
            { onConflict: "session_id,message_key" },
          );
          if (error) console.error("[copilot] failed to persist user message", error);
        }

        let gateway;
        try {
          gateway = createLovableAiGatewayProvider(requireLovableApiKey(), getLovableAiGatewayRunId(request));
        } catch (error) {
          return new Response((error as Error).message, { status: 500 });
        }

        const result = streamText({
          model: gateway(COPILOT_MODEL),
          system: buildSystemPrompt("ask", context.briefing, false),
          messages: await convertToModelMessages(uiMessages),
        });

        const response = result.toUIMessageStreamResponse({
          originalMessages: uiMessages,
          onFinish: async ({ responseMessage }) => {
            try {
              await supabase.from("ai_messages").upsert(
                {
                  session_id: sessionId,
                  user_id: userId,
                  role: "assistant",
                  message_key: responseMessage.id,
                  parts: responseMessage.parts as never,
                  content: textOf(responseMessage),
                  model: COPILOT_MODEL,
                },
                { onConflict: "session_id,message_key" },
              );
              await supabase
                .from("ai_sessions")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", sessionId);
            } catch (error) {
              console.error("[copilot] failed to persist assistant message", error);
            }
          },
          headers: getLovableAiGatewayResponseHeaders(undefined, {}),
        });

        return withLovableAiGatewayRunIdHeader(response, gateway);
      },
    },
  },
});
