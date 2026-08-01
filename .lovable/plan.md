## What's actually happening

Your two $99 test payments went through fine at Paddle (both `completed`, both carrying your user id). The problem is on our side, after payment:

- The `purchases` table is empty — no rows at all.
- The payment notification reached our app and returned success, but the log says:
  `[payments] skipping purchase: unknown catalog item` (15:33 and 15:38 today).

So the handler received the payment, failed to recognise which product was bought, and silently skipped recording it. With no purchase row, your tier stays `free` and the Blueprint stays locked.

The catalog names themselves are correct (`publisher_blueprint_onetime` → `publisher_blueprint`), so the failure is in reading the product identifier out of the notification payload — that field is present when we query Paddle directly but is not arriving in the notification the same way. The exact field shape is unconfirmed, so step 1 below is to confirm it before changing logic.

## Plan

1. **Confirm the payload shape.** Log the incoming line item for one payment (or replay a stored notification) to see exactly where the product identifier lives in the notification body. Diagnosis of the precise field is currently unconfirmed — this step settles it.

2. **Make product resolution robust.** Resolve the purchased product in this order:
   - the human-readable id in the notification, if present;
   - otherwise look the internal Paddle price id up against Paddle's API and map it back to our catalog.
   This removes the dependency on one optional field in the notification body.

3. **Stop silently skipping.** When a purchase can't be matched, record the failure loudly (error log with the transaction id, plus a queued alert) instead of returning success with a warning, so an unmatched payment is never invisible again.

4. **Backfill your two test payments.** Insert the matching purchase rows for the two completed sandbox transactions so your account flips to Publisher Blueprint™ immediately and you can test the unlocked experience without paying again.

5. **Tighten the post-checkout wait.** The success page already polls for a few seconds; extend the poll window slightly and show a clear "still confirming" state with a retry link, so a slow notification looks like waiting rather than a failure.

## Technical notes

- Handler: `src/routes/api/public/payments/webhook.ts`, `resolveCatalog()` returning `null` for `transaction.completed`.
- Catalog map: `src/lib/commerce/plans.ts` (`PRICE_PRODUCT`, `PRODUCT_TIER`) — correct, no change expected.
- Price lookup fallback via `gatewayFetch` in `src/lib/paddle.server.ts` (`GET /prices/{id}`), with a small in-memory cache.
- Backfill via a data insert into `public.purchases` for `txn_01kyyzj035e0e8c1xmdfrz5p5h` and `txn_01kyyz92s1wshd7f550p8b5s1n`, environment `sandbox`, including the bundled one-month OS access.
- Entitlement resolution in `src/lib/commerce/entitlement.server.ts` needs no change — it will pick up the rows.

## How to test afterwards

1. Reload `/blueprint` — with the backfill, tier should already read Publisher Blueprint™ and the roadmap/dashboard/AI briefs unlock.
2. For a clean end-to-end run, refund the backfilled test purchase (or use a second test account) and buy again with card `4242 4242 4242 4242`, CVC `123`, any future expiry.
3. Expect the success page to flip to "unlocked" within a few seconds; if it doesn't, the new error logging will name the transaction and reason.
