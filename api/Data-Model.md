# Data Model — Publisher Blueprint™

**Status:** Active as of Phase 6 v2.0  
**Owner:** Engineering  
**Purpose:** Canonical reference for the `public` schema tables, their relationships, and the RLS boundary.

---

## Overview

The database is PostgreSQL (Lovable Cloud) with 22+ tables in the `public` schema. Every table has row-level security enabled and is owner-scoped to `auth.uid()` unless noted. A trigger creates a `profiles` row on auth signup.

The primary entity is the **Organization** (1:1 with the primary user in v1). Assessments, blueprints, roadmaps, and recommendations all belong to a user and an organization. Commerce and lifecycle state are derived from the immutable `platform_events` stream and cached in dedicated tables.

## Entity relationships

```text
auth.users
  └── profiles (1:1)
  └── user_roles (1:n)
  └── organizations (1:n, primary owner enforced 1:1)
       ├── organization_members (1:n)
       ├── organization_audit (1:n)
       ├── organization_audience_profile (1:1)
       ├── organization_marketing_profile (1:1)
       ├── organization_content_ops_profile (1:1)
       ├── assessments (1:n)
       │    ├── assessment_answers (1:n)
       │    ├── assessment_scores (1:1)
       │    ├── blueprints (1:1)
       │    │    ├── recommendations (1:n)
       │    │    ├── roadmaps (1:n)
       │    │    └── saved_recommendations (1:n)
       │    ├── ai_sessions (1:n)
       │    │    ├── ai_messages (1:n)
       │    │    └── generated_documents (1:n)
       │    └── prompt_templates (1:n)
       ├── customer_lifecycle (1:1)
       ├── customer_qualification (1:1)
       └── platform_events (1:n)
  ├── purchases (1:n)
  ├── subscriptions (1:n)
  ├── export_targets (1:n)
  ├── user_integration_credentials (1:n)
  ├── user_feedback (1:n)
  ├── customer_events (1:n, legacy)
  ├── assessment_events (1:n, legacy)
  └── recommendation_metadata (1:n)

integration_outbox (service-role only, no RLS)
```

## Identity and organization

| Table | Purpose | Key columns |
| --- | --- | --- |
| `profiles` | 1:1 with the auth user. Name, job title, avatar, welcome-email idempotency, acquisition first-touch. | `id`, `full_name`, `job_title`, `avatar_url`, `welcome_email_sent_at`, `first_touch_source/medium/campaign/referrer/landing_path`, `acquisition_captured_at` |
| `organizations` | Company identity captured in intake and extended in Phase 6. | `name`, `website`, `domain`, `industry`, `revenue_range`, `team_size`, `marketer_count`, `business_model`, `region`, `profile_completeness`, `owner_id`, `archived_at` |
| `organization_members` | Future multi-user support; currently one primary member per org. | `organization_id`, `user_id`, `role` |
| `organization_audit` | Change log for organization profile fields. | `organization_id`, `field`, `old_value`, `new_value`, `actor_id` |
| `user_roles` | Role assignments in a separate table, read via `has_role`. | `user_id`, `role` |

## Assessment

| Table | Purpose | Key columns |
| --- | --- | --- |
| `assessments` | One run of the instrument. | `user_id`, `organization_id`, `status`, `current_step`, `version`, `started_at`, `completed_at` |
| `assessment_answers` | One row per answered question. | `assessment_id`, `section`, `question_key`, `value` (JSONB) |
| `assessment_scores` | Computed result of one assessment. | `assessment_id`, `overall_score`, six category scores, `maturity_level`, `maturity_title`, `config_version` |
| `assessment_events` | Section-level progression telemetry (legacy; backfilled to `platform_events`). | `assessment_id`, `event_name`, `section`, `metadata` |

## Blueprint output

| Table | Purpose | Key columns |
| --- | --- | --- |
| `blueprints` | The generated strategic assessment. | `assessment_id`, `publisher_level`, `overall_score`, `section_scores`, `summary`, `top_opportunity`, `top_risk`, `recommended_priority`, `next_90_days`, `generated_by` |
| `recommendations` | Ranked recommendations from the blueprint rule engine. | `blueprint_id`, `category`, `title`, `rationale`, `impact`, `effort`, `position` |
| `roadmaps` | 90-day plan items, editable by the user. | `blueprint_id`, `month`, `title`, `description`, `owner`, `status`, `position` |
| `saved_recommendations` | Actions the user explicitly added to their blueprint. | `user_id`, `title`, `body`, `category`, `impact`, `effort`, `source`, `status`, `document_id`, `session_id` |

## Publisher Copilot™

| Table | Purpose | Key columns |
| --- | --- | --- |
| `ai_sessions` | A conversation or generation session. | `user_id`, `assessment_id`, `objective`, `title`, `status`, `favorite` |
| `ai_messages` | Both sides of every exchange. | `session_id`, `role`, `content`, `parts`, `model`, `message_key` |
| `generated_documents` | Versioned deliverables. | `session_id`, `assessment_id`, `kind`, `title`, `summary`, `body`, `markdown`, `model`, `version`, `parent_document_id`, `status` |
| `prompt_templates` | System and user-authored prompt packs. | `user_id`, `title`, `slug`, `description`, `category`, `body`, `is_system`, `favorite` |

## Commerce

| Table | Purpose | Key columns |
| --- | --- | --- |
| `purchases` | One-time Paddle transactions. | `user_id`, `paddle_transaction_id`, `paddle_customer_id`, `product_id`, `price_id`, `amount_cents`, `currency`, `status`, `environment`, `included_os_access_until`, `invoice_url` |
| `subscriptions` | Recurring Paddle subscriptions. | `user_id`, `paddle_subscription_id`, `paddle_customer_id`, `product_id`, `price_id`, `status`, `environment`, `current_period_start`, `current_period_end`, `cancel_at_period_end` |
| `customer_events` | Legacy commerce event log (backfilled to `platform_events`). | `user_id`, `event_name`, `amount_cents`, `currency`, `price_id`, `tier`, `metadata` |

## Integrations and operations

| Table | Purpose | Key columns |
| --- | --- | --- |
| `user_integration_credentials` | Encrypted third-party tokens. | `user_id`, `provider`, `token_ciphertext`, `account_label`, `airtable_base_id` |
| `export_targets` | Per-user destination config. | `user_id`, `provider`, `airtable_table`, `asana_project_id`, `asana_project_name` |
| `integration_outbox` | Durable async queue for outbound integrations. | `provider`, `event_name`, `payload`, `status`, `dedupe_key`, `attempts`, `last_error`, `next_attempt_at`, `processed_at` |
| `user_feedback` | In-product feedback. | `user_id`, `target_type`, `target_id`, `rating`, `comment`, `metadata` |

## Platform events and derived state

| Table | Purpose | Key columns |
| --- | --- | --- |
| `platform_events` | Immutable, append-only event store. | `event_type`, `event_version`, `product`, `environment`, `source`, `user_id`, `organization_id`, `context`, `payload`, `dedupe_key`, `occurred_at`, `processed_at` |
| `customer_lifecycle` | Cached lifecycle stage derived from events. | `user_id`, `organization_id`, `stage`, `previous_stage`, `highest_stage`, `stage_entered_at`, `stage_reason`, `first_seen_at`, `last_active_at`, `churned_at` |
| `customer_qualification` | Cached qualification tier derived from events and profile. | `user_id`, `organization_id`, `tier`, `previous_tier`, `highest_tier`, `fit_score`, `engagement_score`, `total_score`, `signals`, `scored_at`, `tier_reason` |

## Enums

| Enum | Values |
| --- | --- |
| `app_role` | `admin`, `user` |
| `assessment_status` | `draft`, `in_progress`, `completed` |
| `lifecycle_stage` | `visitor`, `registered`, `assessment_started`, `assessment_completed`, `blueprint_owner`, `os_subscriber`, `churned` |
| `qualification_tier` | `unqualified`, `lead`, `marketing_qualified`, `sales_qualified`, `customer` |

## Key functions

| Function | Purpose |
| --- | --- |
| `has_role(_user_id, _role)` | Security-definer check for role membership. |
| `entitlement_tier(user_uuid, check_env)` | Resolves the caller's current paid tier. |
| `has_active_subscription(user_uuid, check_env)` | Returns true if an active subscription exists. |
| `is_org_member(_org_id, _user_id)` | Returns true if the user is a member of the organization. |

## RLS boundary

- All user-facing tables are owner-scoped: `auth.uid() = user_id`.
- Organization-scoped tables additionally allow access via `is_org_member(organization_id, auth.uid())`.
- `user_roles` is read via `has_role`.
- `integration_outbox` has no RLS and is service-role only; it is never read by the browser.
- Admin reads bypass RLS by using `supabaseAdmin` only after verifying the caller has the `admin` role.

## Migration standards

Every new public-schema table must be created in this order:

1. `CREATE TABLE public.<name>`
2. `GRANT` to `authenticated`, `service_role`, and `anon` only as required.
3. `ALTER TABLE public.<name> ENABLE ROW LEVEL SECURITY`
4. `CREATE POLICY` for the required access patterns.

## Related documents

- Product Constitution v2.0, Section 6 (Database naming standards).
- ADR 005 — Event Architecture.
- ADR 007 — Organization Single-Member Model.
- `/api/Event-Schema.md` — canonical event catalog.
