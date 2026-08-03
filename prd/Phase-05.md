# Phase 05 — Commercialization, Payments & Customer Portal

## Status

Shipped

## Goal

Monetize the product with a one-time purchase and recurring subscription, gated by server-side entitlements, and give customers a self-service portal.

## Scope

### In scope

- Three-tier model: Publisher Test™ (free), Publisher Blueprint™ ($99 one-time), Publisher OS™ ($49/month).
- Paddle sandbox integration for checkout, subscriptions, and webhooks.
- Public pricing page (`/pricing`).
- Checkout success page with entitlement polling.
- Server-side entitlement resolution (`src/lib/commerce/entitlement.server.ts`).
- Billing panel, invoices, subscription cancellation, and account deletion in `/settings`.
- Webhook handler at `/api/public/payments/webhook` with fallback Paddle API calls for missing transaction data.
- Legal pages: `/terms`, `/privacy`, `/refund-policy`.
- `purchases`, `subscriptions`, and `customer_events` tables.

### Out of scope

- Live Paddle environment (sandbox only).
- Multiple currencies or localized pricing.
- Usage-based billing.
- In-app upgrades from OS to a higher tier.

## Success criteria

- A user can complete a $99 purchase and immediately unlock Blueprint.
- A user can subscribe to Publisher OS™ at $49/month.
- Subscription status is respected through period end after cancellation.
- Account deletion cancels any active Paddle subscription.
- Entitlements are enforced server-side; paid payloads are never sent to free users.

## Technical notes

- Tier resolution: completed purchase → blueprint; active subscription → os; included OS access → os.
- Paddle webhook payloads may omit `externalId`; the handler queries Paddle's API as a fallback.
- Invoices are fetched from Paddle on demand.
- Account deletion cancels the subscription before removing the user.

## Non-goals

- No promotional codes or trials outside the included OS month.
- No affiliate tracking.
- No sales tax logic in the app (Paddle handles merchant-of-record).

## Compliance

- Product taxonomy: Section 4.
- Database standards: Section 6.
- Event naming: Section 7 (`commerce.*`).
- Engineering standards: Section 9 (webhook verification, server-side entitlement).
