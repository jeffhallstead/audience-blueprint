# Architecture

Publisher Blueprint™ — executive readiness assessment and roadmap platform.

## Stack

TanStack Start (React 19, file-based routing, SSR) · Tailwind v4 design tokens ·
Lovable Cloud (Postgres + Auth + RLS) · TanStack Query.

## Routing

```
src/routes/
  index.tsx                    public landing page
  auth.tsx                     email/password + Google sign-in
  _authenticated/route.tsx     client-only session gate + AppShell chrome
  _authenticated/welcome.tsx   post-signup orientation
  _authenticated/wizard.tsx    7-section assessment
  _authenticated/processing.tsx  generation interstitial
  _authenticated/dashboard.tsx executive dashboard
  _authenticated/blueprint.tsx full blueprint + recommendations
  _authenticated/roadmap.tsx   editable 90-day timeline
  _authenticated/ai-toolkit.tsx  placeholder AI surface
  _authenticated/resources.tsx placeholder library
  _authenticated/settings.tsx  profile
```

## Data model

`profiles` (1:1 auth user) · `organizations` · `assessments` ·
`assessment_answers` · `blueprints` · `roadmaps` · `recommendations`.

Every table is owner-scoped with RLS on `auth.uid()`; a trigger creates a
profile row on signup. All writes go through the browser client, so RLS is the
authorization boundary.

## Key modules

- `src/lib/wizard-config.ts` — declarative sections/questions. Adding a question
  requires no component changes.
- `src/lib/placeholder-blueprint.ts` — the only source of placeholder output.
  **This is the AI seam:** replace these payloads with generated content.
- `src/lib/assessments.ts` — persistence for a completed wizard run and the
  latest-blueprint read.
- `src/components/blueprint/*` — reusable presentation primitives
  (ScoreCard, DashboardCard, MetricTile, ProgressBar, QuestionCard, Timeline,
  RoadmapCard, RecommendationCard).
- `src/components/layout/*` — AppShell (sidebar + mobile sheet) and PageHeader.

## Design system

All color, radius, shadow, and typography values are oklch tokens in
`src/styles.css`. Components must use semantic classes (`bg-surface`,
`text-brass`, `surface-panel`) — never hardcoded colors. Dark mode tokens are
defined and ready; no toggle is shipped yet.

## Future extension points

- AI generation (OpenAI/Claude via the AI gateway) → replace
  `placeholder-blueprint.ts` payloads and set `blueprints.generated_by`.
- PDF export → the "Export PDF" buttons currently emit a toast.
- Stripe payments, email automation, CRM sync, benchmarking, team collaboration
  → add server functions under `src/lib/*.functions.ts`.
