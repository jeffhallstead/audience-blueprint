## Mobile Google sign-in fix

The backend auth log confirms Google accepts the login, so the failure is in the browser session handoff after account selection. The current `/auth` page starts the managed OAuth flow but has no dedicated return route or recoverable callback state; protected routes immediately reject any session that has not finished hydrating.

### Implementation
1. **Refresh managed Google auth configuration**
   - Re-run the managed Google provider configuration so the generated auth integration and provider settings are synchronized.
   - Keep using the supported `lovable.auth.signInWithOAuth` helper rather than adding a second custom token parser.

2. **Add a public OAuth callback route**
   - Create `/auth/callback` as the single full-page return target for Google.
   - Wait for the auth client to restore the returned session, validate the user, then route to `/welcome` or `/dashboard` through the existing `resolvePostAuthPath()` logic.
   - Show a short completion state while hydrating and a clear retry link if no valid session arrives within a bounded timeout.

3. **Simplify the sign-in page flow**
   - Point Google’s `redirect_uri` to the public callback route.
   - Keep the managed popup behavior for desktop, but reconcile the session when the popup result returns.
   - Always clear `googlePending` when authentication fails or is cancelled so “Connecting to Google…” cannot remain indefinitely.
   - Remove redundant or silently swallowed session checks that compete with the callback.

4. **Make protected-route entry resilient**
   - Ensure navigation into the authenticated route occurs only after callback validation completes, preventing the route guard from bouncing a legitimate but still-hydrating login back to `/auth`.
   - Preserve the existing server-validated `getUser()` security check once the local session is established.

5. **Verify the complete flow**
   - Check the public callback and auth page for runtime errors.
   - Test desktop popup behavior and a mobile-sized full-page redirect path.
   - Confirm successful login leaves `/auth`, reaches the correct post-auth page, survives refresh, and that cancellation/failure restores the Google button instead of leaving it pending.