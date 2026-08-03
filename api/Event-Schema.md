# Event Schema — Platform Events

**Status:** Active  
**Owner:** Engineering  
**Purpose:** Canonical reference for the immutable `platform_events` table and the event types emitted by the Publisher Blueprint™ application.

---

## Table: `public.platform_events`

The platform event store is the single source of truth for significant business, product, and system events. It is append-only and immutable.

### Columns

| Column | Type | Description |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `event_type` | `text` | Dot-namespaced event name (e.g., `assessment.completed`) |
| `event_version` | `int` | Version of the payload schema for this event type |
| `product` | `text` | Product identifier (`publisher-blueprint`) |
| `environment` | `text` | `sandbox` or `live` |
| `source` | `text` | `app`, `server`, `webhook`, or `backfill` |
| `user_id` | `uuid` | Acting user, nullable |
| `organization_id` | `uuid` | Affected organization, nullable |
| `context` | `jsonb` | Who/where context (route, section, assessment id, etc.) |
| `payload` | `jsonb` | Domain data for the event |
| `dedupe_key` | `text` | Optional idempotency key |
| `occurred_at` | `timestamptz` | Client/server timestamp of the event |
| `created_at` | `timestamptz` | Database insertion timestamp |
| `processed_at` | `timestamptz` | Nullable; set when downstream consumers finish |

### Rules

1. **Immutable rows.** Once inserted, rows are not updated or deleted.
2. **Idempotent emits.** A `dedupe_key` prevents duplicate rows within a window.
3. **Versioned payloads.** Every `event_type` has a version in `src/lib/events/catalog.ts`. When the payload shape changes, the version increments and a new ADR should be considered.
4. **Backfill compatibility.** Legacy rows from `assessment_events` and `customer_events` carry a `legacy.` prefix and version `0`.
5. **No ad-hoc names.** All event types must be declared in `PLATFORM_EVENTS` before production use.

## Event catalog

### Organization

| Event | Version | Description |
| --- | --- | --- |
| `organization.created` | 1 | A new organization identity was created |
| `organization.updated` | 1 | The organization profile was updated |
| `organization.profile_completed` | 1 | Profile completeness reached 100% |
| `organization.archived` | 1 | The organization was soft-archived |

### Assessment

| Event | Version | Description |
| --- | --- | --- |
| `assessment.started` | 1 | User began a new assessment |
| `assessment.section_completed` | 1 | A section was completed |
| `assessment.question_answered` | 1 | An individual answer was saved |
| `assessment.completed` | 1 | Assessment submitted and scored |
| `assessment.abandoned` | 1 | No activity detected for a defined period |
| `assessment.revisited` | 1 | User returned to a draft or completed assessment |

### Blueprint / product engagement

| Event | Version | Description |
| --- | --- | --- |
| `blueprint.dashboard_viewed` | 1 | User opened the executive dashboard |
| `blueprint.index_viewed` | 1 | User viewed the Publisher Index |
| `blueprint.roadmap_viewed` | 1 | User opened the roadmap |
| `blueprint.resources_viewed` | 1 | User opened the strategy library |
| `blueprint.history_viewed` | 1 | User viewed blueprint history |
| `blueprint.resource_clicked` | 1 | User clicked a resource |
| `blueprint.section_expanded` | 1 | User expanded a blueprint section |

### Commerce

| Event | Version | Description |
| --- | --- | --- |
| `commerce.pricing_viewed` | 1 | Pricing page was viewed |
| `commerce.upgrade_cta_clicked` | 1 | Upgrade call-to-action clicked |
| `commerce.upgrade_prompt_viewed` | 1 | Paywall prompt shown |
| `commerce.checkout_started` | 1 | Checkout initiated |
| `commerce.purchase_confirmed` | 1 | Purchase confirmed by webhook |
| `commerce.purchase_completed` | 1 | Purchase fully recorded |
| `commerce.purchase_unmatched` | 1 | Webhook purchase could not be matched |
| `commerce.purchase_refunded` | 1 | Purchase refunded |
| `commerce.payment_failed` | 1 | Payment attempt failed |
| `commerce.subscription_activated` | 1 | Subscription became active |
| `commerce.subscription_updated` | 1 | Subscription changed |
| `commerce.subscription_past_due` | 1 | Subscription entered past due |
| `commerce.subscription_canceled` | 1 | Subscription canceled |
| `commerce.portal_opened` | 1 | Customer portal opened |
| `commerce.cancel_started` | 1 | Cancellation flow initiated |

### Copilot

| Event | Version | Description |
| --- | --- | --- |
| `copilot.session_started` | 1 | A Copilot session began |
| `copilot.document_generated` | 1 | A deliverable was generated |
| `copilot.recommendation_saved` | 1 | A recommendation was saved from Copilot |

### Analytics & recommendations

| Event | Version | Description |
| --- | --- | --- |
| `analytics.acquisition_captured` | 1 | First-touch UTM/referrer data captured |
| `recommendation.viewed` | 1 | A recommendation was viewed |
| `recommendation.exported` | 1 | A recommendation was exported |
| `recommendation.completed` | 1 | A recommendation was marked complete |

### Derived lifecycle & qualification

| Event | Version | Description |
| --- | --- | --- |
| `lifecycle.stage_changed` | 1 | Customer lifecycle stage transitioned |
| `qualification.scored` | 1 | Qualification tier was recomputed |

## Downstream consumers

The following systems consume `platform_events`:

1. **Customer lifecycle** (`src/lib/lifecycle/`) — recomputes stage on qualifying events.
2. **Qualification engine** (`src/lib/qualification/`) — recomputes tier on qualifying events.
3. **CRM sync** (`src/lib/integrations/crm-sync.server.ts`) — enqueues Airtable/HubSpot updates via `integration_outbox`.
4. **Analytics** — future aggregation and funnel analysis.

## Adding a new event

1. Add the event to `PLATFORM_EVENTS` in `src/lib/events/catalog.ts` with version `1`.
2. Update this document with the event, domain, and description.
3. Emit the event from the appropriate producer using `emitPlatformEvent` or `emitPlatformEvents`.
4. If the event should affect lifecycle or qualification, add it to the derivation logic in `src/lib/lifecycle/` or `src/lib/qualification/`.
5. If the event should be synced to a CRM, add a mapping in `src/lib/integrations/crm-sync.server.ts`.

## Related documents

- Product Constitution v2.0, Section 7 (Event naming conventions).
- ADR 005 — Event Architecture.
- `/api/Data-Model.md` — full data model reference.
