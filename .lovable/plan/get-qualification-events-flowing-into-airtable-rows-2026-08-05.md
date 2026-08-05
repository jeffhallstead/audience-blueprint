# Get qualification events flowing into Airtable rows

## Where things stand today

Verified against the live backend:

- 11 `qualification.scored` events and 9 `lifecycle.stage_changed` events exist (most recent today, 17:44 UTC).
- The CRM mapping is wired: the event emitter calls `syncCrmFor`, which maps `qualification.scored` to a `qualification.tier_changed` contact push.
- Airtable credentials are present (connector key, base ID, table name "Publisher Blueprint Contacts").
- A cron job runs every 5 minutes and posts to `/api/public/integrations/dispatch` on the production URL.
- **`integration_outbox` is completely empty — 0 rows, ever.** So nothing has ever reached the dispatcher, and dispatch/Airtable has never been exercised.

So the break is upstream of dispatch: events are produced, but the queue row is never written.

## Likely cause (to confirm first)

The queue write upserts with `onConflict: "provider,dedupe_key"`, but the matching unique index on `integration_outbox` is **partial** (`WHERE dedupe_key IS NOT NULL`). Postgres/PostgREST generally reject an `ON CONFLICT` target that only matches a partial index, and the enqueue code swallows the error into a console log — which matches the symptom exactly: every enqueue path (qualification, assessment, purchase, export) silently produces zero rows.

This is a strong hypothesis, not yet proven. Step 1 proves or disproves it before anything is changed.

## Plan

### 1. Confirm the failure (no code changes)
Trigger one qualification rescore and read the server logs for the `[integrations] enqueue failed:` line. The Postgres error code in that message tells us definitively whether it is the conflict-target mismatch or something else (permissions, payload shape).

### 2. Fix the enqueue write
Depending on step 1:
- If it is the conflict target: make the index and the upsert agree — either add a full unique constraint on `(provider, dedupe_key)` (with a stable non-null dedupe key for every enqueue) or switch the enqueue to an explicit "check then insert" so a partial index is not used as a conflict target.
- If it is something else: fix that instead, then re-run step 1.

Also stop swallowing the failure: surface enqueue errors loudly enough that a future break is visible rather than silent.

### 3. Prove one row lands in Airtable end to end
- Rescore a test user, confirm a `pending` row appears in `integration_outbox` for provider `airtable`.
- Invoke the dispatch endpoint manually (same auth header the cron uses), confirm the row flips to `delivered` and a new record appears in the Airtable base.
- Confirm the field mapping matches the base's columns (Email, Name, Event, Occurred At, Organization, Publisher Index, Maturity Level, Tier). Any mismatch shows up as an Airtable 422 in `last_error`.

### 4. Backfill existing qualified leads
The 6 existing qualified accounts predate a working queue. Add an admin-triggered backfill that re-enqueues a current-state contact push for each qualified user, so Airtable starts from the real lead list rather than only future transitions.

### 5. Make the pipeline observable in `/admin`
Add a small integrations status view: Airtable configured yes/no, pending / delivered / failed / skipped counts, last dispatch time, and the last error text. This is what turns "no rows in Airtable" from a silent condition into something visible.

## Technical notes

- Files touched: `src/lib/integrations/outbox.server.ts` (enqueue + error surfacing), a migration for the unique constraint if that is the fix, `src/lib/admin/*.functions.ts` plus an admin panel for backfill and status.
- `syncCrmFor`, `airtable.server.ts`, the dispatch route, and the cron job are all correct as written and are not being changed.
- HubSpot stays enqueued-and-skipped; only Airtable is a live destination.
