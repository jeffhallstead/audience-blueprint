# Publisher Blueprint™ — Product Specification v1.0

**Status:** Current as of the v1.0 build (Phases 1–6 shipped)
**Owner:** Jeff Hallstead
**Audience:** Parts 1–4 are written for executives and commercial stakeholders. Parts 5–8 are written for product and engineering.

---

## Part 1 — Executive summary

### 1.1 What the product is

Publisher Blueprint™ is a self-serve executive assessment and strategy platform. A marketing leader answers a structured seven-section questionnaire about how their organization builds and reaches its audience. The platform scores that input into the **Publisher Index™** — a 0–100 measure across six categories — places the organization on a five-level maturity ladder, and then generates a consulting-quality strategic assessment: an executive dashboard, an opportunity matrix, a prioritized 90-day roadmap, and a KPI framework.

**Publisher Copilot™** layers an AI strategist on top. Every AI request is grounded in the organization's own assessment data, so the user never re-explains their business and the model never works from a blank page.

### 1.2 The problem

Owned-audience strategy is expensive to buy and hard to self-diagnose. A consulting engagement that produces the same artifacts — a maturity diagnosis, a gap analysis, a sequenced 90-day plan — costs tens of thousands of dollars and takes weeks. Most marketing leaders below that budget line have no structured way to answer three questions:

1. How mature is our publishing operation, honestly, relative to where it should be?
2. Which gap is costing us the most right now?
3. What specifically do we do in the next 90 days?

### 1.3 Who it is for

Marketing, brand, and communications leaders at organizations that already produce content but do not yet operate as a media brand — typically B2B companies in the $10M–$1B revenue range with a marketing team of 3 to 50 people.

### 1.4 Value proposition

A consulting-grade strategic assessment, produced in about eight minutes of input, for $99 — with an ongoing operating layer at $49/month for teams that want to run the plan rather than just receive it.

### 1.5 What exists today

| Capability | State |
| --- | --- |
| Seven-section assessment with autosave | Shipped |
| Publisher Index™ scoring, six categories, five maturity levels | Shipped |
| Executive dashboard, opportunity matrix, KPI grid | Shipped |
| 90-day strategic roadmap, editable | Shipped |
| Publisher Copilot™ — chat, documents, simulator, prompt packs | Shipped |
| Payments, entitlements, customer portal | Shipped |
| Per-user exports to CSV, Excel, Airtable, Asana | Shipped |
| Transactional email on notify.jeffhallstead.com | Shipped |
| Internal admin console | Shipped |
| PDF export | Not shipped — see Part 8 |
| Peer benchmarking, team collaboration | Not shipped — see Part 8 |

---

## Part 2 — Product surface

### 2.1 Public surfaces

| Surface | Route | Purpose |
| --- | --- | --- |
| Landing page | `/` | Positioning, value proposition, entry to the assessment |
| Pricing | `/pricing` | Three-tier plan comparison and checkout entry |
| Sign in / sign up | `/auth` | Email + password and Google sign-in |
| OAuth callback | `/oauth/callback` | Authoritative return path for standalone-browser OAuth |
| Terms | `/terms` | Terms of service |
| Privacy | `/privacy` | Privacy policy |
| Refund policy | `/refund-policy` | Refund and cancellation terms |

### 2.2 Authenticated surfaces

All routes below sit behind a client-side session gate that redirects unauthenticated visitors to `/auth`.

| Surface | Route | Purpose | Gating |
| --- | --- | --- | --- |
| Welcome | `/welcome` | Post-signup orientation | Free |
| Assessment wizard | `/wizard` | Seven-section questionnaire with autosave and resume | Free |
| Processing | `/processing` | Generation interstitial between submit and results | Free |
| Results | `/results` | Publisher Index™ score, radar chart, maturity level | Free |
| Executive dashboard | `/dashboard` | Full strategic assessment, opportunity matrix, KPIs | Blueprint |
| Blueprint | `/blueprint` | Complete narrative blueprint, recommendations, saved actions | Blueprint |
| Roadmap | `/roadmap` | Editable 90-day, three-phase timeline | Blueprint |
| Copilot home | `/copilot` | Numbered four-step walkthrough of every AI capability | Blueprint |
| Copilot chat | `/copilot/chat/$sessionId` | Streaming conversation with the AI strategist | Blueprint (unlimited on OS) |
| Documents library | `/copilot/documents` | Every generated deliverable, versioned | Blueprint |
| Document detail | `/copilot/documents/$documentId` | A single deliverable, regenerable | Blueprint |
| Scenario simulator | `/copilot/simulator` | Directional impact modeling of strategic choices | Blueprint |
| Prompt packs | `/copilot/prompts` | Tailored prompts the team can reuse elsewhere | Blueprint |
| Strategy library | `/resources` | Playbooks and reference material; add-to-blueprint actions | Free / OS-premium |
| Settings | `/settings` | Profile, billing, integrations, account security | Free |
| Checkout success | `/checkout/success` | Post-payment entitlement polling and handoff | Free |
| Admin console | `/admin` | Internal operations surface | Role-gated |

### 2.3 The core user journey

```text
Landing → Sign up → Welcome → Wizard (7 sections, ~8 min)
       → Processing → Results (free score + maturity level)
       → Paywall: Unlock Publisher Blueprint™ $99
       → Dashboard → Blueprint → Roadmap
       → Copilot: generate deliverables, chat, simulate, export
```

The paywall sits deliberately after the score. The user receives real diagnostic value for free and pays for the plan that follows from it.

### 2.4 The admin console

`/admin` is internal-only, gated by a `user_roles` table checked server-side through a security-definer function. It exposes customer lifecycle state, event history, and integration outbox status. It is never linked from user-facing navigation.

---

## Part 3 — The Publisher Index™

### 3.1 Design principle

The entire assessment is configuration, not code. Sections, questions, answer types, scoring weights, category mapping, maturity thresholds, and estimated time all live in `src/lib/assessment/config.ts`. Adding or reweighting a question requires no component change, and a future v2 instrument is a configuration edit rather than a rebuild.

The current instrument version is **v1**.

### 3.2 The seven sections

| # | Section | What it establishes | Est. minutes |
| --- | --- | --- | --- |
| 1 | Company Profile | Organizational context for peer benchmarking | 1.0 |
| 2 | Audience Ownership | Audience owned versus audience rented | 1.5 |
| 3 | Content Capability | Editorial consistency, original IP, format depth | 1.5 |
| 4 | Distribution | Reach reliability and paid dependency | 1.0 |
| 5 | Operations | The operating system behind the publishing engine | 1.5 |
| 6 | Business Alignment | Executive conviction, funding, cross-functional buy-in | 1.0 |
| 7 | Growth Goals | What the program must deliver over four quarters | 0.5 |

Total estimated completion time: **8 minutes**.

### 3.3 Answer types

Seven answer types are supported: `single`, `multi`, `likert`, `number`, `select`, `text`, and `url`. Each maps to a normalized 0–1 contribution:

- **Likert** questions use a fixed five-point scale scoring 0, 0.25, 0.5, 0.75, 1.0.
- **Numeric** questions map raw input through descending bands. Email list size, for example, scores 1.0 at 100,000+ subscribers, 0.85 at 25,000, 0.7 at 10,000, 0.5 at 2,500, 0.3 at 500, 0.15 at any non-zero value, and 0 at zero.
- **Multi-select** questions define a `maxScoredSelections` threshold representing a full score.
- **Single-select** options carry explicit per-option scores.
- **Text** and **URL** questions are profile-only and carry no scoring weight.

### 3.4 The six scoring categories

| Category | What it measures | Weight |
| --- | --- | --- |
| Audience | First-party audience reachable without platform permission | 1.2 |
| Content | Editorial capability, original IP, sustainable formats | 1.1 |
| Distribution | Reach reliability without paid dependency | 1.0 |
| Operations | Team, workflow, documentation, AI adoption, measurement | 1.0 |
| Strategy | Clarity of objectives and ambition | 0.8 |
| Alignment | Executive support, budget, cross-functional commitment | 0.9 |

Audience carries the highest weight because owned audience is the asset the entire product argues for. Strategy carries the lowest because stated intent is cheap relative to demonstrated capability.

Individual questions contribute to categories with their own per-question weights — a single question can feed multiple categories. Category scores are weighted averages of their contributing normalized answers, scaled to 0–100. The overall Publisher Index™ is the category-weighted roll-up, also 0–100.

### 3.5 The five maturity levels

| Level | Title | Min score | Summary |
| --- | --- | --- | --- |
| 1 | Observer | 0 | Still relying primarily on campaigns and rented audiences |
| 2 | Publisher | 35 | Publishing consistently but lacking repeatable systems |
| 3 | Studio | 55 | Developing original IP and repeatable content operations |
| 4 | Media Brand | 72 | Content drives measurable business outcomes and audience growth |
| 5 | Category Leader | 86 | Content is a strategic business asset and competitive advantage |

Each level carries a defined set of characteristics, a strategic focus, and a single prescribed next step, so the diagnosis always terminates in an action.

### 3.6 The blueprint rule engine

Scores feed a rules configuration (`src/lib/blueprint/rules.ts`, version `rules-v1`) that produces the narrative assessment. Every 0–100 category score is banded:

| Band | Min score | Label |
| --- | --- | --- |
| Strong | 70 | Strong |
| Developing | 45 | Developing |
| Critical | 0 | Needs attention |

Each category defines band-specific status and explanation copy, a strength framing used when it ranks among the top categories, and a gap framing — why it matters and what fixing it delivers — used when it ranks among the bottom. No recommendation text lives in application code; the engine only selects and ranks entries from the rules file. This is the seam an AI service replaces or augments without any UI redesign.

### 3.7 Autosave and telemetry

Wizard progress is persisted per answer, so a session can be abandoned and resumed on any device. Section-level progression events are recorded to `assessment_events`, giving a per-section drop-off view.

---

## Part 4 — Commercial model

### 4.1 The three tiers

| | Publisher Test™ | Publisher Blueprint™ | Publisher OS™ |
| --- | --- | --- | --- |
| **Price** | Free | $99 | $49 |
| **Cadence** | No card required | One-time, lifetime access | Per month |
| **Positioning** | Diagnose where you stand today | Your complete strategic assessment and plan | Operate the plan, quarter after quarter |

Publisher Blueprint™ includes one month of Publisher OS™, which converts a one-time buyer into a trial subscriber without a second decision.

### 4.2 Entitlement matrix

| Feature | Minimum tier |
| --- | --- |
| Assessment | Free |
| Publisher Index™ score | Free |
| Category score breakdown | Free |
| Full executive dashboard | Blueprint |
| 90-day roadmap | Blueprint |
| AI strategy documents | Blueprint |
| Publisher Copilot™ chat | Blueprint |
| PDF export | Blueprint |
| Unlimited Copilot™ sessions | OS |
| Progress tracking | OS |
| Blueprint history | OS |
| Reassessment | OS |

Gating is enforced server-side. Paid payloads are never sent to an unentitled client, so hiding a button is a presentation detail rather than the security boundary.

### 4.3 Tier resolution

Tier is resolved authoritatively on the server from two sources, scoped to the caller's own rows and to the current payment environment (sandbox or live):

- Any purchase with status `completed` grants **blueprint**.
- An active subscription grants **os**. Statuses `active`, `trialing`, and `past_due` count as active while the period end is in the future. A `canceled` subscription retains access until its paid period ends rather than terminating immediately.
- A purchase's `included_os_access_until` timestamp grants **os** for the included month.

The highest qualifying tier wins.

### 4.4 Payment flow

Checkout runs through Paddle. On completion, a webhook at `/api/public/payments/webhook` records the transaction, resolves the product to a tier, and writes the purchase or subscription row. Because Paddle does not always include the external product identifier in the webhook payload, the handler falls back to querying the Paddle API for the transaction before it decides to skip an event. The checkout success page polls entitlement state so the user advances as soon as the webhook lands.

### 4.5 Account lifecycle

Users can view invoices pulled live from Paddle, cancel a subscription, and delete their account. Account deletion cancels any active Paddle subscription before removing the account, so a deleted user is never left with a live billing relationship.

Refund terms are published at `/refund-policy` and mirrored in the legal content module.

---

## Part 5 — Architecture (technical)

### 5.1 Stack

- **Framework:** TanStack Start v1 — React 19, file-based routing, SSR, server functions
- **Build:** Vite 7, deployed to an edge worker runtime
- **Styling:** Tailwind CSS v4 with native `@theme` tokens in `src/styles.css`
- **Data layer:** TanStack Query, with route loaders priming the cache
- **Backend:** Lovable Cloud — Postgres, authentication, row-level security
- **AI:** Lovable AI Gateway

### 5.2 Routing model

Routes are files under `src/routes`. The root route (`__root.tsx`) owns shared chrome and head metadata. The pathless `_authenticated` layout owns the session gate and the application shell — sidebar navigation on desktop, a sheet on mobile — and renders an outlet for every protected page. Public API endpoints live under `src/routes/api/public/*`, which bypasses site authentication and therefore verifies its callers inside each handler.

### 5.3 Server boundaries

App-internal server logic uses `createServerFn`. Files declaring server functions are thin wrappers: imports, types, and exported declarations only, with runtime helpers moved into imported `*.server.ts` modules that never reach the client bundle.

Three client postures exist:

1. **Browser client** — RLS applies as the signed-in user. Most reads and writes.
2. **Authenticated server function** — `requireSupabaseAuth` middleware supplies a RLS-scoped client plus verified user ID.
3. **Admin client** — bypasses RLS, loaded dynamically inside a handler only after the caller has been verified. Used for webhook processing and privileged admin operations.

Protected server functions are never called from a public route loader, because SSR and prerender have no session.

### 5.4 Design system

Every color, radius, shadow, and typography value is an OKLCH token in `src/styles.css`, derived from the jeffhallstead.com brand — navy surfaces with cyan and orange accents, set in Barlow, Inter, DM Mono, and Rajdhani. Components reference semantic classes (`bg-surface`, `text-brass`, `surface-panel`) and never hardcode a color. Dark-mode tokens are defined and ready; no user-facing toggle ships in v1.

---

## Part 6 — Data model (technical)

Twenty-two tables in the `public` schema. Every table has row-level security enabled and is scoped to `auth.uid()` unless noted. A trigger creates a profile row on signup.

### 6.1 Identity and organization

| Table | Purpose |
| --- | --- |
| `profiles` | 1:1 with the auth user. Name, job title, avatar, welcome-email idempotency timestamp. |
| `organizations` | Company profile captured in section one — name, website, industry, revenue range, team size. |
| `user_roles` | Role assignments in a separate table, read through a security-definer `has_role` function. Never stored on the profile, to prevent privilege escalation. |

### 6.2 Assessment

| Table | Purpose |
| --- | --- |
| `assessments` | One run of the instrument. Status, current step, version, started and completed timestamps. |
| `assessment_answers` | One row per answered question, stored as JSONB against a section and question key. |
| `assessment_scores` | Computed result: overall score, all six category scores, maturity level and title, config version. |
| `assessment_events` | Section-level progression telemetry for drop-off analysis. |

### 6.3 Blueprint output

| Table | Purpose |
| --- | --- |
| `blueprints` | The generated strategic assessment — publisher level, section scores, top opportunity, top risk, priority, 90-day summary, and the generator that produced it. |
| `recommendations` | Ranked recommendations with category, rationale, impact, effort, and ordering. |
| `roadmaps` | 90-day plan items by month, with owner, status, and position. Editable by the user. |
| `saved_recommendations` | Actions the user has explicitly added to their blueprint from the strategy library or a Copilot deliverable. |

### 6.4 Publisher Copilot™

| Table | Purpose |
| --- | --- |
| `ai_sessions` | A conversation or generation session, bound to an assessment and an objective. |
| `ai_messages` | Both sides of every exchange, with parts, model, and a message key for idempotency. |
| `generated_documents` | Versioned deliverables — kind, title, summary, structured body, rendered markdown, model, version, parent document for regeneration lineage. |
| `prompt_templates` | System and user-authored prompt packs. Five policies distinguish system-owned rows from user-owned rows. |

### 6.5 Commerce

| Table | Purpose |
| --- | --- |
| `purchases` | One-time transactions. Paddle transaction and customer IDs, product, price, amount, status, included-OS expiry, invoice URL, environment. |
| `subscriptions` | Recurring plans with status and period boundaries. |
| `customer_events` | Commercial lifecycle event log — signup, assessment completion, purchase, subscription change. |

### 6.6 Integrations and operations

| Table | Purpose |
| --- | --- |
| `user_integration_credentials` | Per-user tokens for third-party destinations, encrypted at rest with AES-256-GCM. |
| `export_targets` | Per-user destination configuration — Airtable table, Asana project and workspace. |
| `integration_outbox` | Durable async queue. Provider, event, dedupe key, payload, status, attempts, last error, next attempt time. No RLS policies by design — it is service-role only and never read by the browser. |
| `user_feedback` | In-product feedback capture. |

---

## Part 7 — Integrations and AI (technical)

### 7.1 AI gateway

All model calls route through `src/lib/ai-gateway.server.ts`, which is server-only. The Copilot model is `google/gemini-3.6-flash`, declared once so a provider or model swap never touches application code. Structured deliverables build the provider with strict `json_schema` structured outputs — without it, the model omits required fields.

### 7.2 Context assembly

Every AI request rebuilds an organizational briefing server-side from the user's scores, blueprint, roadmap, raw answers, saved recommendations, and prior documents. Two consequences follow: the user never re-explains their business, and the client cannot spoof its own context.

Prompt construction lives in `src/lib/copilot/prompts.server.ts` and encodes the "Chief Content Officer" persona, per-objective instructions, and explicit honesty rules — state assumptions, never guarantee outcomes, never invent figures.

### 7.3 Copilot objectives

Nine objectives are registered in a single catalog that the UI, router, and server prompts all read from, so adding a capability is a configuration change. They produce four output kinds: documents, conversation, simulation, and prompt packs. The simulator is deliberately directional — up, down, or flat with a magnitude — and never predicts a numeric score, because only a re-assessment produces one.

### 7.4 Streaming chat

`/api/public/…`-adjacent chat runs at `src/routes/api/chat.ts`. It authenticates from the bearer token, verifies session ownership before streaming, and persists both sides of each exchange.

### 7.5 Export and third-party destinations

Users can export actions, roadmap items, and KPIs. A unified row model feeds four destinations:

| Destination | Mechanism |
| --- | --- |
| CSV | Generated in the browser, BOM-prefixed for Excel |
| Excel (.xlsx) | Generated in the browser via a lazily imported writer |
| Airtable | Row upsert into a user-selected table |
| Asana | Task creation in a user-selected project |

A provider-agnostic `IntegrationAdapter` contract normalizes five event types across Airtable, Airtable Records, Asana, and HubSpot. Enqueued work lands in `integration_outbox` and is drained asynchronously with retry and dedupe, so a slow or failing third party never blocks a user action.

Credentials are per-user, not per-workspace: each user supplies their own personal access token in Settings, stored encrypted. The export menu detects an unconnected provider and routes the user to Settings rather than failing silently.

### 7.6 Email

Transactional email sends from `notify.jeffhallstead.com` through the managed email service. A welcome email fires after account creation, with idempotency enforced by `profiles.welcome_email_sent_at` so a retry or a duplicate signup event cannot double-send. Templates live in a registry module and are previewable in development.

---

## Part 8 — Known gaps and roadmap

### 8.1 Open items

| # | Gap | Impact | Priority |
| --- | --- | --- | --- |
| 1 | **PDF export is a stub.** The "Export PDF" action is entitled at the Blueprint tier and appears in the UI, but currently emits a toast rather than producing a file. | High — it is a named, paid feature | P0 |
| 2 | **Mobile Google OAuth in embedded previews.** Sign-in works in standalone browsers and on desktop. Inside an embedded mobile preview the token handoff is unreliable; the current mitigation is an explicit "open in browser" path. | Medium — affects preview testing more than production | P1 |
| 3 | **Hydration warning on `/auth`.** A server/client render mismatch is logged on the auth route. Cosmetic today, but it forces a client re-render of that tree. | Low | P2 |
| 4 | **HubSpot is wired but unused.** The adapter exists and conforms to the integration contract; no connection has been configured. | Low — deliberate | P3 |
| 5 | **No peer benchmarking.** Section one collects industry, revenue, and size specifically to benchmark against a peer set, but no comparison is rendered. The data is being captured for a feature that does not exist yet. | Medium — a differentiator left on the table | P1 |
| 6 | **No team collaboration.** Every object is single-owner. There is no way to share a blueprint with a colleague, assign a roadmap item to a real teammate, or have two people work one account. | Medium | P1 |
| 7 | **`integration_outbox` has no RLS policies.** Intentional — the table is service-role only — but it should carry an explicit deny-all policy rather than relying on the absence of grants. | Low — hardening | P2 |
| 8 | **No reassessment flow in the UI.** Reassessment is entitled at the OS tier and the schema versions assessments, but no user-facing "run this again and compare" path ships. | High for OS retention | P0 |
| 9 | **Dark mode is defined but not exposed.** Tokens exist; no toggle. | Low | P3 |

### 8.2 Proposed Phase 7 — close the paid promise

Ship what customers have already been sold: real PDF export, and the OS-tier reassessment flow with a before/after score comparison. These two items are the difference between an honest entitlement matrix and an aspirational one.

### 8.3 Proposed Phase 8 — the benchmarking moat

Use the industry, revenue range, and company size already captured in section one to render peer comparison on the results and dashboard surfaces: "Your Audience score of 41 sits in the bottom quartile for B2B SaaS companies at your revenue." This requires a minimum corpus of completed assessments before it is credible, so the collection is already correct — only the presentation is missing.

### 8.4 Proposed Phase 9 — teams

Introduce a workspace object above the user, invitations, shared blueprint access, and real assignee resolution on roadmap items. This is the natural expansion path from a $49 individual subscription to a seat-based team plan.

### 8.5 Further candidates

- Progress tracking against roadmap items, with quarterly check-ins that feed the next reassessment
- CRM sync activation once HubSpot has a live connection
- A public, shareable read-only blueprint link as an acquisition channel
- Slack or email digest nudges tied to roadmap milestones

---

## Appendix A — Glossary

| Term | Definition |
| --- | --- |
| **Publisher Index™** | The 0–100 composite score produced by the assessment |
| **Publisher Blueprint™** | Both the product name and the $99 tier's core deliverable — the full strategic assessment |
| **Publisher Copilot™** | The AI strategist layer |
| **Publisher OS™** | The $49/month operating subscription |
| **Publisher Test™** | The free tier |
| **Maturity level** | One of five named stages from Observer to Category Leader |
| **Entitlement** | The server-resolved tier that determines feature access |
| **Outbox** | The durable async queue for third-party integration delivery |

## Appendix B — Document control

| Field | Value |
| --- | --- |
| Version | 1.0 |
| Covers | Phases 1–6 |
| Assessment config version | v1 |
| Blueprint rules version | rules-v1 |
| Copilot model | google/gemini-3.6-flash |
| Public schema tables | 22 |

### Version history

| Version | Change |
| --- | --- |
| 1.0 | Initial specification covering the shipped v1 build |
