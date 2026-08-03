# ADR 0002: TanStack Start + Supabase for Full-Stack Architecture

## Status

Accepted

## Context

Publisher Blueprint™ started as a concept for a strategic assessment tool that needed a premium, fast frontend, a managed backend, and robust authentication. The team had to choose a full-stack framework and a backend provider without over-engineering the MVP. Options considered included Next.js, Remix, SvelteKit, and pure Vite + custom API. For the backend, options included a custom server, Firebase, and Supabase.

## Decision

We will use **TanStack Start v1** as the full-stack React framework and **Supabase** as the managed backend, authentication, and database layer. TanStack Start provides file-based routing, server functions, and Vite-native development without Next.js complexity. Supabase provides PostgreSQL, auth, row-level security, and managed storage, with a generous free tier and edge-compatible deployment.

## Consequences

- **Positive**: Single-language stack (TypeScript) across frontend and backend.
- **Positive**: Supabase RLS and policies make authorization co-located with data.
- **Positive**: TanStack Start server functions keep the frontend and backend code tightly coupled and type-safe.
- **Positive**: Worker-friendly deployment model aligns with Cloudflare edge runtime.
- **Negative**: TanStack Start is newer than Next.js, so examples and third-party plugins are fewer.
- **Negative**: Supabase migrations must be run with care and explicit GRANT statements; the Data API does not grant default privileges.
- **Neutral**: Vendor lock-in on auth and database is accepted in exchange for operational speed.

## Related records

- ADR 0005: Platform Event Architecture — builds on the Supabase PostgreSQL backend.
- ADR 0008: Airtable as Primary CRM — integration is wired via server functions and Supabase-backed credential storage.

## PRD origin

Original MVP build (Phase 1) and foundational technology stack decision.
