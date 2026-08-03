# ADR 0004: Paddle Sandbox Commerce

## Status

Accepted

## Context

Publisher Blueprint™ needs to sell a one-time purchase ($99) and a recurring subscription ($49/month) with minimal operational overhead. The founder is not a payments engineer and wants a provider that handles sales tax, VAT, invoicing, and subscriptions. Stripe and Paddle were the primary candidates. Stripe requires more custom work for tax, invoices, and billing portal. Paddle advertises itself as a merchant-of-record solution for SaaS with built-in tax handling and a customer portal.

## Decision

We will use **Paddle** in sandbox mode for all commerce operations. The product catalog includes a $99 one-time purchase for Publisher Blueprint™ and a $49/month subscription for Publisher OS™. Webhook events will be received at a TanStack public route and used to update entitlements and customer lifecycle events. Invoices will be fetched from Paddle's API on demand for the customer portal.

## Consequences

- **Positive**: Paddle handles merchant-of-record responsibilities (tax, VAT) for supported markets.
- **Positive**: Built-in customer portal and hosted checkout reduce frontend code.
- **Positive**: Sandbox mode allows realistic testing with test cards before going live.
- **Negative**: Paddle's webhook payloads are not always complete; the implementation had to add async fallback API calls to resolve missing `externalId` and transaction data.
- **Negative**: Refund and subscription-cancellation flows must be handled in the app rather than relying solely on Paddle's UI.
- **Neutral**: The commerce schema is Paddle-centric, so migrating to another provider later would require a data migration.

## Related records

- ADR 0006: Customer Lifecycle and Qualification Engine — purchase events are key inputs to lifecycle transitions.
- ADR 0008: Airtable as Primary CRM — Paddle customers are synced to CRM records where applicable.

## PRD origin

PRD Phase 5 — Commercialization, Payments & Customer Portal.
