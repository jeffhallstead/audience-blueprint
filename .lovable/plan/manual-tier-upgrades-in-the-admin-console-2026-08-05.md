# Manual tier upgrades in the Admin Console

Let an admin grant a paid tier (Blueprint or Publisher OS) to any account without a payment, and revoke it later.

## How it works for you

In **Admin → Accounts**, each row gets a **Manage access** action opening a small dialog:

- Choose the tier to grant: Blueprint or Publisher OS
- Optional expiry date (blank = no expiry)
- Optional internal note (e.g. "beta partner", "comped for review")
- If a manual grant already exists, the dialog shows it with a **Revoke** button

The Accounts table Tier column shows the effective tier plus a "Manual" badge when the access came from a grant rather than a payment. Manual grants never create fake payment or revenue records, so revenue metrics stay accurate.

Effective tier = highest of (paid entitlement, active manual grant). Revoking a grant drops the user back to whatever they actually paid for.

## Technical notes

**Database** — new `entitlement_grants` table: `id`, `user_id`, `tier` ('blueprint' | 'os'), `environment`, `granted_by`, `reason`, `expires_at` (nullable), `revoked_at` (nullable), timestamps. RLS: users may SELECT their own rows; all writes are service-role only (admin server functions). GRANTs issued for `authenticated` (select) and `service_role` (all).

**Entitlement resolution** — `resolveEntitlement` in `src/lib/commerce/entitlement.server.ts` additionally reads active grants (not revoked, not expired, matching environment) and raises the resolved tier to the highest granted tier. The `Entitlement` type gains `grantedTier` and `grantExpiresAt` so the UI can label it. Because all feature gates already flow through `resolveEntitlement` / `requireFeature`, every gated surface picks this up automatically.

**Admin server functions** — added to `src/lib/admin/admin.functions.ts`, each behind `assertAdmin`:
- `grantEntitlement({ userId, tier, expiresAt?, reason? })` — upserts an active grant via `supabaseAdmin`
- `revokeEntitlement({ userId })` — sets `revoked_at` on active grants

`getAdminOverview` also selects active grants so `AdminUserRow` can carry `grantedTier` for the badge.

**UI** — new `src/components/admin/grant-access-dialog.tsx`, wired into the Accounts tab in `src/routes/_authenticated/admin.tsx`; invalidates the admin overview query on success.

**Audit** — each grant/revoke emits a `commerce.entitlement_granted` / `commerce.entitlement_revoked` platform event with the acting admin's id, so the change is traceable in the Events tab.

## Testing

1. As admin, grant Blueprint to `uat-free@example.com`; sign in as that user and confirm the full dashboard, roadmap, and paid PDF unlock.
2. Grant OS to the same user and confirm Copilot/OS-only features unlock.
3. Revoke, then confirm the user drops back to the free experience and paid payloads are withheld server-side.
4. Set an expiry in the past on a grant and confirm access is not applied.
5. Confirm admin revenue metrics and the Blueprint-customer count are unchanged by grants.
