# Phase 04 — Publisher Copilot™ AI Strategy Engine

## Status

Shipped

## Goal

Add an AI-powered strategic advisor that generates personalized recommendations, documents, chat responses, and simulations grounded in the user's assessment data.

## Scope

### In scope

- Publisher Copilot™ surfaces: home (`/copilot`), chat (`/copilot/chat/$sessionId`), documents library (`/copilot/documents`), document detail (`/copilot/documents/$documentId`), simulator (`/copilot/simulator`), and prompt packs (`/copilot/prompts`).
- Lovable AI Gateway integration via `src/lib/ai-gateway.server.ts`.
- Default model: `google/gemini-3.6-flash`.
- Context assembly (`src/lib/copilot/context.server.ts`) building a briefing from scores, blueprint, roadmap, answers, saved recommendations, and prior documents.
- Persona and prompt instructions in `src/lib/copilot/prompts.server.ts`.
- Structured document generation with strict `json_schema` outputs.
- Streaming chat endpoint at `src/routes/api/chat.ts`.
- Versioned, regenerable documents.
- Scenario simulator with directional outcomes (up/down/flat × magnitude).
- Nine registered objectives in a single catalog shared by UI, router, and prompts.
- `ai_sessions`, `ai_messages`, `generated_documents`, `prompt_templates` tables.

### Out of scope

- Unlimited Copilot for Blueprint-only users (reserved for Publisher OS™).
- Real-time collaborative editing.
- Fine-tuning or custom model training.

## Success criteria

- Every AI response is grounded in the user's own data.
- Documents are versioned and can be regenerated.
- Chat streams correctly and persists both sides.
- The simulator never predicts a numeric score.
- The client cannot spoof context.

## Technical notes

- All AI calls are server-only.
- Structured outputs require `json_schema` to avoid missing required fields.
- Honesty rules: state assumptions, never guarantee outcomes, never invent figures.
- Objectives are config-driven; adding a new capability is a catalog change.

## Non-goals

- No client-side AI calls.
- No public AI API.
- No persistent model state across users.

## Compliance

- AI design principles: Section 8.
- Product taxonomy: Section 4 (Publisher Copilot™).
- Event naming: Section 7 (`copilot.*`).
- Engineering standards: Section 9 (server-only AI, no secrets in client).
