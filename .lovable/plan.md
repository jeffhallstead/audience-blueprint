# Admin Lead Workbench

## Current state

The platform already identifies and elevates qualified leads automatically:

- The **Publisher Index™ assessment** completes and emits `assessment.completed`.
- The **qualification engine** scores every account on profile fit + engagement and assigns a tier: unqualified → lead → marketing_qualified → sales_qualified → customer.
- Qualification changes emit `qualification.scored` platform events.
- **CRM sync** maps those events to `qualification.tier_changed` outbox events and pushes them to Airtable (live) or HubSpot (dormant-ready) if configured.
- The **Admin Console** has a **Qualification** tab that shows tier distribution, top-scoring accounts, and recent tier transitions.

What is missing is a dedicated sales workflow *inside* the Admin Console: a place to see the qualified leads as a work list, copy their contact details, open their CRM record, and track the status of your outreach.

## Goal

Give the operator a single Admin Console view that answers: "Who is newly qualified, why, and what should I do next?" — with lightweight status tracking so follow-up does not get lost.

## What we will build

### 1. Database: lead_outreach table

A small admin-only status table keyed by user:

```text
lead_outreach
- id uuid pk
- user_id uuid not null unique -> auth.users.id
- status enum: new | contacted | responded | meeting_booked | no_fit | nurtured
- notes text
- last_contacted_at timestamptz
- created_at / updated_at
```

GRANT to `authenticated` and `service_role`, enable RLS, and restrict writes/reads to admins via `has_role('admin')`. The table is independent of the derived `customer_qualification` table so rescoring never wipes outreach history.

### 2. Server functions: admin leads API

Add to `src/lib/admin/admin.functions.ts` (or a new `src/lib/admin/leads.functions.ts`):

- `getQualifiedLeads`: returns users whose current tier is `marketing_qualified` or higher, joined to profiles, organizations, latest assessment scores, and their `lead_outreach` status. Includes fit/engagement scores and the reason/signals from `customer_qualification`.
- `updateLeadOutreach`: lets an admin set status, notes, and `last_contacted_at`.

### 3. Admin UI: new "Leads" tab

Add a **Leads** tab to `/admin` between **Accounts** and **Organizations**. The panel shows:

- Filters by tier (`marketing_qualified`, `sales_qualified`, `customer`) and status (`new`, `contacted`, etc.).
- A table with columns: name / email, organization, tier, Publisher Index™, fit + engagement, qualification reason, outreach status, last contacted.
- Inline actions per row:
  - Copy email to clipboard.
  - Open organization detail (existing org panel).
  - Open Airtable/CRM record link (if `AIRTABLE_BASE_ID` is configured, deep-link to the contact table).
  - Mark as contacted / responded / meeting booked / no fit / nurtured.
- A detail drawer (or inline expansion) showing the qualification signals and a notes textarea.

### 4. Enrich CRM payload with CRM record URL

When Airtable receives a `qualification.tier_changed` event, the existing `Airtable` adapter already upserts a record. We will add a `CRM Record URL` field to the Airtable payload so the admin can open the exact record from the Leads panel. We will store the Airtable record id returned by the API in a new column on `integration_outbox` or, simpler, deep-link to the table and let Airtable search resolve it.

### 5. Out-of-scope

- No email sending from the admin console.
- No task/assignment ownership.
- No automated sequences or drip campaigns.

## Suggested order

1. Migration + server functions for `lead_outreach` and qualified-lead list.
2. Admin UI "Leads" tab with filters and status actions.
3. Airtable deep-link and CRM record URL enrichment.
4. Verify with an admin session and a test account that hits `marketing_qualified`.

## Acceptance criteria

- An admin can open `/admin`, click **Leads**, and see all users at `marketing_qualified` or higher.
- Each row shows why the user qualified (reason + signals) and their current outreach status.
- An admin can update status and add notes; the row persists across rescoring.
- Clicking a contact action copies the email or opens the CRM record.
- Non-admin users cannot read or write `lead_outreach`.
