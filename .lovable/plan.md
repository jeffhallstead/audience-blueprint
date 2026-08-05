# Switch payments from Paddle to built-in Stripe

## Why

Paddle rejected `blueprint.jeffhallstead.com` at domain review, and their terms exclude businesses whose primary offering is human services. Publisher Blueprint™ is effectively B2B SaaS, but rather than argue the classification, moving to Lovable's built-in Stripe integration removes the risk entirely. No live sales have happened yet (the account never reached final review), so nothing has to be migrated — only test-mode data exists.

## Trade-off to accept first

Paddle acts as merchant of record and handles sales tax/VAT for you. Stripe does not — you become the seller of record. Stripe Tax can calculate and collect tax automatically, but registration and remittance in the jurisdictions where you cross thresholds becomes your responsibility. For a US-based LLC selling mostly to US customers at $49, this is a manageable trade; it is the main real change.

## Steps

### 1. You disconnect Paddle
From the Payments dashboard, use the three-dots menu in the top right and disconnect Paddle. Only one payment provider can be active at a time, so this has to happen before Stripe can be enabled. Tell me when it's done.

### 2. Enable built-in Stripe
No Stripe account setup, API keys, or webhook configuration on your side — Lovable manages it. Preview stays in test mode; the published site uses live mode.

### 3. Recreate the catalog
- `publisher_blueprint` / `publisher_blueprint_onetime` — $49 one-time, tax code for SaaS
- `publisher_os` / `publisher_os_monthly` — $49/month (kept in the catalog even though the pricing page currently hides the OS tier)

Product and price IDs stay identical, so `src/lib/commerce/plans.ts`, feature gating, and entitlement mapping need no changes.

### 4. Rewrite the payment layer
- Replace `src/lib/paddle.ts` / `src/lib/paddle.server.ts` with Stripe equivalents.
- `src/lib/commerce/use-checkout.ts` → Stripe Checkout, still passing the signed-in user's id so purchases attribute correctly.
- `src/routes/api/public/payments/webhook.ts` → Stripe events (`checkout.session.completed`, `customer.subscription.*`, `charge.refunded`), writing to the same `purchases` / `subscriptions` / `customer_events` tables and emitting the same `commerce.*` platform events.
- `src/lib/commerce/payments.functions.ts` → Stripe billing portal session + invoice list.
- `src/lib/commerce/account.functions.ts` → cancel Stripe subscription before account deletion.
- `payment-test-mode-banner.tsx` and `checkout.success.tsx` polling adapt to the new environment signal.
- Entitlement resolution, feature gates, and admin manual grants stay exactly as they are.

### 5. Database
Add Stripe identifier columns alongside the existing Paddle ones (`stripe_customer_id`, `stripe_subscription_id`, `stripe_payment_intent_id`) rather than dropping the old columns, so existing test rows and the admin console keep working. Paddle columns become nullable/unused.

### 6. Legal pages
`/terms`, `/privacy`, and `/refund-policy` currently name Paddle as merchant of record and data processor. These get rewritten to name Momentive Ventures LLC as seller and data controller, with Stripe as payment processor. Refund window stays as-is.

### 7. Test, then publish
Test-mode checkout with Stripe test cards for both the one-time purchase and the subscription; confirm entitlement unlocks, invoice list, billing portal, cancellation, and account deletion. Then publish and run one small live transaction.

## Technical notes

`src/lib/commerce/plans.ts`, `entitlement.server.ts`, `use-entitlement.ts`, `feature-gate.tsx`, and the admin grant flow are provider-agnostic and remain untouched. The provider-specific surface is roughly six files plus the webhook route. Old Paddle code and env vars are removed in the same pass to avoid a half-migrated state.
