# Publisher Blueprint™

A self-serve executive assessment and strategy platform for marketing leaders who want to evaluate their organization's publishing maturity, receive a consulting-grade strategic plan, and operate it quarter after quarter.

Built with TanStack Start, React 19, Tailwind CSS v4, and Lovable Cloud (Supabase).

---

## Product

Publisher Blueprint™ helps marketing, brand, and communications leaders answer three questions:

1. How mature is our publishing operation, honestly, relative to where it should be?
2. Which gap is costing us the most right now?
3. What specifically do we do in the next 90 days?

The product combines a **Publisher Index™** assessment, an executive dashboard, a 90-day roadmap, and **Publisher Copilot™** — an AI strategist grounded in the user's own data. The commercial model is a $99 one-time purchase for the Blueprint and a $49/month **Publisher OS™** subscription for ongoing execution.

## Documentation

| Document | Purpose |
| --- | --- |
| `Product-Constitution-v2.0.md` | Brand, taxonomy, naming, messaging, database, event, AI, and engineering standards. Every PRD must comply with this. |
| `Product-Specification-v2.0.md` | Full product specification: executive summary, product surface, scoring, commercial model, architecture, data model, AI, integrations, and roadmap. |
| `Product-Roadmap.md` | Horizon-based roadmap: shipped, now, next, later. |
| `prd/Phase-01.md` through `prd/Phase-07.md` | Per-phase PRD-lite documents covering the shipped build and planned Phase 7. |
| `adr/` | Architecture Decision Records covering the major technical and product decisions. |
| `design/Design-System.md` | Executive Obsidian design system tokens and component rules. |
| `api/Event-Schema.md` | Canonical platform event catalog and `platform_events` table reference. |
| `api/Data-Model.md` | Full `public` schema data model, relationships, enums, and RLS boundary. |
| `api/airtable-template.md` | Airtable template schema and setup guide for the Publisher Blueprint CRM and Actions tables. |
| `ARCHITECTURE.md` | Technical architecture overview and key module map. |
| `AGENTS.md` | Project-level guidance for AI agents and contributors. |

## Stack

- **Framework:** TanStack Start v1 (React 19, file-based routing, SSR, server functions)
- **Build:** Vite 7
- **Styling:** Tailwind CSS v4 with OKLCH-friendly tokens
- **Data:** TanStack Query
- **Backend:** Lovable Cloud (Postgres, Auth, RLS, Storage)
- **AI:** Lovable AI Gateway (Google Gemini)
- **Commerce:** Paddle (sandbox)
- **Email:** Managed transactional email on `notify.jeffhallstead.com`

## Key principles

- The assessment is configuration, not code (`src/lib/assessment/config.ts`).
- Every significant action is recorded as an immutable `platform_event`.
- Lifecycle and qualification are derived from the event stream.
- Entitlements are enforced server-side; paid payloads never reach unentitled clients.
- Roles live in a separate `user_roles` table and are checked via a security-definer function.
- Integration credentials are encrypted at rest with AES-256-GCM.
- AI is honest, grounded, and never predictive of a numeric score.

## Development

```sh
git clone https://github.com/jeffhallstead/audience-blueprint.git
cd audience-blueprint
npm i
npm run dev
```

The local dev server runs on `http://localhost:8080`.

## Build with Lovable

This project was built with [Lovable](https://lovable.dev). Continue developing it in the [Lovable editor](https://lovable.dev/projects/6d4e5e38-ebb7-4aa9-b55b-9a7cad324fe2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.
