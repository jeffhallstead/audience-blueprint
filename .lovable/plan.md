## Confirmed current state

- The app uses Lovable Cloud’s managed Google OAuth helper, not a direct `supabase.auth.signInWithOAuth` call (`src/routes/auth.tsx:167`, `src/integrations/lovable/index.ts:14`).
- In the installed mobile wrapper, that helper already:
  - detects the `LovableApp/` user agent,
  - changes the callback to `lovable://oauth-callback`,
  - opens the authorization URL with `window.open(url, "_blank")`, and
  - waits for the wrapper’s validated authorization response before the app persists the returned session.
- Its public API does **not** expose Supabase’s `skipBrowserRedirect` option. Replacing it with raw Supabase OAuth would bypass the managed broker and break the supported Lovable preview flow.
- The login page currently declares failure after 20 seconds even though the managed mobile bridge waits up to 120 seconds (`src/routes/auth.tsx:154`). This can show a false timeout while the external-browser/deep-link handoff is still active.
- Session synchronization already exists globally (`src/routes/__root.tsx:125`) and on the auth page (`src/routes/auth.tsx:69`), while the protected route validates the user with bounded retries (`src/routes/_authenticated/route.tsx:10`).

## Implementation plan

1. **Keep the supported managed OAuth path**
   - Continue invoking `lovable.auth.signInWithOAuth("google", ...)` from the original button gesture.
   - Do not add raw `supabase.auth.signInWithOAuth`, a second popup, iframe detection workaround, or app-owned deep-link parser; the managed helper already performs the equivalent of `skipBrowserRedirect + external browser + deep-link return` for the Lovable mobile wrapper.

2. **Remove the competing 20-second failure race**
   - Refactor the Google click handler so the managed helper owns completion timing.
   - Keep the button pending while the bridge is active and only show an error when the helper explicitly returns one, the popup is cancelled, or the wrapper’s own bounded timeout expires.
   - Prevent stale timers or restored pages from overwriting a newly authenticated state.

3. **Make session completion idempotent**
   - Consolidate auth-page completion through one guarded routine that validates with `getUser()`, resolves the post-auth destination, and navigates once.
   - Let `SIGNED_IN`, page restoration, and the helper result all call that same routine without racing or producing duplicate navigation/errors.

4. **Improve wrapper return recovery**
   - On `pageshow`, visibility return, and window focus, re-check the authenticated user before clearing pending state.
   - If the external browser returns without a session, restore the sign-in controls with a recoverable message instead of leaving “Connecting…” frozen.
   - Preserve the existing standalone-browser fallback for users who choose “Open sign-in in browser.”

5. **Keep diagnostics safe and useful**
   - Record wrapper detection, external handoff started, app resumed, session observed, user validated, cancellation, and bridge timeout.
   - Continue excluding tokens, callback fragments, email addresses, and credentials.

6. **Verify the supported branches**
   - Confirm desktop preview popup sign-in still works.
   - Confirm Lovable mobile preview opens Google outside the embedded webview and returns through the managed `lovable://oauth-callback` bridge.
   - Confirm return/resume produces one authenticated navigation and no false 20-second timeout.
   - Confirm cancellation and genuine timeout return the UI to a retryable state.
   - Confirm standalone mobile Safari/Chrome still completes through the public `/oauth/callback` route.