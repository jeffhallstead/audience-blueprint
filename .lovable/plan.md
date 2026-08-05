# Switch payments from Paddle to built-in Stripe

Paddle is disconnected. This sprint replaces the commerce layer with Lovable's built-in Stripe payments, keeping the existing entitlement, admin, and lifecycle logic intact.

Note on your existing account: built-in Stripe provisions a Lovable-managed Stripe account for this project rather than using `acct_1EtJ3i…`. You get a test environment immediately and later claim the account to take live payments and receive payouts. Your existing dashboard stays untouched.

## 1. Enable Stripe and rebuild the catalog

- Enable built-in Stripe payments (creates a test environment right away).
- Recreate the catalog with the same internal IDs the app already uses:
  - Publisher Blueprint — one-time, $49 (`publisher_blueprint` / `publisher_blueprint_onetime`)
  - Publisher OS — $49/month (`publisher_os` / `publisher_os_monthly`)
- Set a tax code on each product and enable Stripe's tax calculation and collection at checkout, so tax is computed and collected automatically. (Full compliance handling can be turned on once the account is claimed and verified.)

## 2. Replace the provider layer

- Remove `src/lib/paddle.ts` and `src/lib/paddle.server.ts`; add Stripe equivalents.
- Rewrite `payments.functions.ts` to create Stripe Checkout Sessions, and `use-checkout.ts` to redirect to the hosted checkout and return to `/checkout/success`.
- Rewrite `src/routes/api/public/payments/webhook.ts` to verify Stripe signatures and handle: completed checkout, subscription created/updated/canceled, invoice paid/failed, and refunds — writing the same `purchases`, `subscriptions`, `platform_events`, and lifecycle rows as today so entitlements, admin console, and Airtable sync keep working unchanged.
- Point the billing portal in `billing-panel.tsx` and subscription cancellation in `account.functions.ts` at Stripe's customer portal.

## 3. Database

One migration adding Stripe identifier columns alongside the existing Paddle ones (`stripe_customer_id`, `stripe_payment_intent_id` on `purchases`; `stripe_customer_id`, `stripe_subscription_id` on `subscriptions`), and relaxing the Paddle columns so they are no longer required. No data migration is needed — there are no live Paddle sales.

## 4. Copy, legal, and docs

- Update `/terms`, `/privacy`, and `/refund-policy` to name Stripe as the payment processor and Momentive Ventures LLC as the seller.
- Update the test-mode banner wording, `ADR-004`, `README`, product spec, and the UAT checklist's payment steps.

## 5. Verify

- Test-mode purchase of Blueprint from a free account → entitlement flips to `blueprint`, dashboard and PDF unlock.
- Test-mode OS subscription → `os` tier, portal opens, cancel returns to the correct tier at period end.
- Manual admin grants and the existing UAT accounts still behave correctly.
- Refund in test mode revokes access.

## Going live

Live checkout requires claiming the Stripe account and completing business verification for Momentive Ventures LLC. Everything above works in test mode before that, and `blueprint.jeffhallstead.com` needs no Paddle-style domain approval.
