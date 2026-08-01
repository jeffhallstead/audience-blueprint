## What's happening

Your backend auth log shows the Google login itself **succeeded** at 07:05:54 (HTTP 200, `login_method: oidc`). So the failure is on the app side after the token comes back — the sign-in page never moves you off it.

"Please wait…" is the auth page's submit-button label, shown whenever a shared `pending` flag is true. `handleGoogle` sets `pending = true` and only ever clears it on an explicit error. In the preview, Google runs in a popup: if the popup result resolves in a path the current code doesn't handle (or the redirect back lands while the promise is still awaited), nothing clears `pending` and nothing navigates — so the page sits on "Please wait…" even though you are now signed in.

Secondary issue: both `/auth` and `/` check the session exactly once on mount. If the session is set a moment later (popup completing, token exchange finishing), there is no listener to react, so the page stays put.

## Fix

**1. Session-driven navigation instead of promise-driven (`src/routes/auth.tsx`)**
- Register a `supabase.auth.onAuthStateChange` listener on mount; on `SIGNED_IN` (or `INITIAL_SESSION` with a session), resolve the post-auth path and navigate. This makes the redirect fire whenever the session actually appears, regardless of which OAuth path completed it.
- Guard against double navigation with a ref.

**2. Make the Google button honest about its own state**
- Give Google its own `googlePending` state so it no longer hijacks the email/password button's label.
- Wrap the call in `try/finally` so the flag always clears.
- Add a ~20s safety timeout: if no session has arrived, clear the flag and show a "Sign-in didn't complete — try again" toast instead of a permanent spinner.

**3. Same session-awareness on the landing page (`src/routes/index.tsx`)**
- Add the same `onAuthStateChange` listener alongside the existing one-shot `getSession` check, so an OAuth return to `/` forwards you even if the session lands after mount.

**4. Keep the OAuth contract correct**
- `redirect_uri` stays `window.location.origin` (a public URL) — no change needed there; the protected route is reached only after the session is confirmed.

## Technical notes

- No database, schema, or auth-provider configuration changes; Google is already enabled and working server-side.
- No changes to the generated `src/integrations/lovable/index.ts` or Supabase client files.
- `resolvePostAuthPath` logic is unchanged: first-timers → `/welcome`, returning users → `/dashboard`.

## How to test

1. Sign out fully (or use a private window) and open the preview.
2. Go to **Sign in → Continue with Google**, pick `jeffhallstead@gmail.com`.
3. Expect: popup closes, you land on `/welcome` the first time and `/dashboard` thereafter — no lingering "Please wait…".
4. Also verify email/password sign-in still shows "Please wait…" only on its own submit, and that visiting `/` while signed in forwards you into the app.
