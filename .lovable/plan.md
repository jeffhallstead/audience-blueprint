## Confirmed diagnosis

The current workaround targets the wrong completion mechanism for the failing context. The installed managed-auth helper detects a mobile browser inside the preview iframe, opens Google in a separate tab, and waits for an `authorization_response` message before setting the app session (`@lovable.dev/cloud-auth-js`, installed v1.1.2). It does not return the session to the iframe as URL tokens in that path. Therefore `consumeOAuthRedirect()` in `src/lib/auth/oauth-redirect.ts` cannot repair this mobile-preview flow.

The app also has multiple competing completion paths—root token consumption, `/auth` session listeners, focus reconciliation, a 150-second timeout, and immediate protected-route navigation. This makes session hydration and navigation timing fragile even though the backend logs confirm Google authentication itself succeeds.

## Implementation plan

1. **Refresh the managed Google auth integration**
   - Re-run the Lovable Cloud Google provider configuration so the generated integration and supported auth package are current.
   - Keep Google OAuth routed through the generated `lovable.auth.signInWithOAuth` helper; do not replace it with a raw provider call or custom popup.

2. **Remove the incorrect redirect workaround**
   - Remove the custom URL-token consumer from the root route and delete its helper if it has no remaining callers.
   - Stop relying on focus/visibility events or a competing app-level timeout to infer whether OAuth completed.

3. **Make `/auth` session-confirmed and deterministic**
   - Call the managed helper directly from the Google button with the public same-origin return URL.
   - Treat `redirected` as a handoff and otherwise wait for the helper to finish setting the session.
   - Confirm the authenticated identity with `auth.getUser()` before navigating.
   - Navigate only after identity confirmation; otherwise keep the user on `/auth`, restore the button, and show a useful error rather than silently looping.
   - Preserve one guarded post-auth navigation so duplicate auth events cannot race each other.

4. **Harden the public return landing**
   - On `/`, forward users only after a validated authenticated user is available, rather than using a locally cached session as sufficient proof.
   - Resolve the correct destination (`/welcome` or `/dashboard`) only after that confirmation so the protected layout does not bounce the user back to `/auth` during hydration.

5. **Verify the complete flow**
   - Check that signed-out users remain on `/auth` and the Google button recovers after cancellation/error.
   - Verify successful Google completion establishes a persisted session, reaches `/welcome` or `/dashboard`, and survives refresh.
   - Test both desktop popup behavior and mobile/full-page behavior, and inspect browser/auth signals for any remaining redirect or session errors.