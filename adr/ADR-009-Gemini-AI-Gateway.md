# ADR 0009: Gemini via Lovable AI Gateway for Publisher Copilot™

## Status

Accepted

## Context

Publisher Copilot™ needs to generate personalized strategic recommendations, documents, and chat responses from the user's assessment data. The team could use OpenAI, Anthropic, Google Gemini, or another model. The platform also needs a consistent way to call AI services from server functions without exposing API keys to the client.

## Decision

We will use **Google Gemini** as the model behind Publisher Copilot™, accessed through the **Lovable AI Gateway**. The gateway provides a unified interface for chat completions, image generation, embeddings, and text-to-speech without requiring user-managed API keys. The server-side integration is encapsulated in `src/lib/ai-gateway.server.ts`, and structured prompts for the "Chief Content Officer" persona live in `src/lib/copilot/prompts.server.ts`.

## Consequences

- **Positive**: No API key management for the founder; billing and quotas are handled by Lovable.
- **Positive**: Gemini is well-suited for long-context document generation from structured assessment data.
- **Positive**: A single gateway can be extended to other models later without changing the app's interface.
- **Negative**: The gateway is a Lovable-specific dependency; moving to a self-managed model would require a small abstraction layer.
- **Negative**: Streaming responses and token usage must be carefully handled to maintain a responsive chat UI.
- **Neutral**: Prompt engineering is the primary lever for output quality; the gateway is intentionally model-agnostic at the API layer.

## Related records

- ADR 0002: TanStack Start + Supabase — AI calls are made from server functions in this stack.
- ADR 0005: Platform Event Architecture — copilot interactions are tracked as platform events for analytics.

## PRD origin

PRD Phase 4 — AI Strategy Engine & Publisher Copilot™.
