## What's happening now

Two separate things are blocking the flow you expected:

1. **Google sign-in never lands on Welcome.** The sign-in button asks the OAuth broker to return the browser to the site root (`/`). `/` is the public marketing landing page and has no session awareness, so after Google succeeds you're dropped back on the homepage looking signed-out. In the popup path (editor preview) the code sends you to `/dashboard` — never `/welcome`, regardless of whether you clicked "Sign in" or "Create account".
   - Confirmed in the data: both accounts have `welcome_email_sent_at` empty, meaning nobody has ever reached the Welcome screen — so the welcome email has never sent either.
2. **Email + password signup requires an emailed confirmation link**, so it shows a "Check your inbox" screen instead of signing you in.

## The plan

### 1. Turn on immediate sign-in for email signup
Enable auto-confirm on the backend so `signUp()` returns a live session. The "Check your inbox" screen becomes unreachable for normal signups and new users go straight into the app.

Trade-off to be aware of: email addresses are no longer proven to belong to the person signing up. Password reset still works normally.

### 2. Send new users to Welcome, returning users to Dashboard
Introduce one shared "where do I go after auth?" rule used by every sign-in path:
- First time in (no Welcome visit recorded yet) → `/welcome`
- Otherwise → `/dashboard`

Applied to: email signup, email sign-in, and Google (both the popup path used in the editor preview and the full-page redirect path used on the live site).

### 3. Make the OAuth return actually complete
Google must return to a public URL, so it will keep returning to `/`. The landing page gets session awareness: when a session exists on load it immediately forwards to Welcome or Dashboard by the rule above, instead of showing the marketing page to a signed-in user. The header also switches from "Sign in / Create account" to a signed-in state so a completed login is visibly a completed login.

### 4. Record the Welcome visit reliably
The Welcome screen already stamps `welcome_email_sent_at` when it fires the welcome email. That stamp becomes the "has been welcomed" marker used in step 2, so a second login goes to the dashboard rather than looping through Welcome. It will be set even if email delivery fails, so a failed send can't trap someone on Welcome forever.

## Technical notes

- `supabase--configure_auth` with `auto_confirm_email: true` (other settings unchanged — signups stay open, anonymous users stay off).
- New `src/lib/auth/post-auth.ts`: `resolvePostAuthPath()` reads the current user's `profiles.welcome_email_sent_at` via the browser client and returns `/welcome` or `/dashboard`.
- `src/routes/auth.tsx`: replace the three hardcoded `navigate({ to: "/dashboard" })` calls (and the `/welcome` one) with `resolvePostAuthPath()`; drop the `checkEmail` branch's role as the default signup outcome; keep `redirect_uri: window.location.origin` for Google.
- `src/routes/index.tsx`: add a client-side session check on mount; if a session exists, `navigate({ to: resolved, replace: true })`. Keep the route public/SSR so SEO and the shareable landing page are unaffected.
- `src/lib/email/welcome.functions.ts`: stamp `welcome_email_sent_at` regardless of send outcome (still send once per account).

## How to test in the preview

1. **Google, brand-new account** — open the preview, Create account → Continue with Google, pick a Google account that has never signed in here. Expect to land on Welcome, with the welcome email queued.
2. **Google, returning account** — sign out, sign in with the same account. Expect Dashboard, no second Welcome.
3. **Email signup** — Create account with an email + 8+ character password. Expect to be signed in instantly and land on Welcome, with no "check your inbox" screen.
4. **Sign out** — confirm the header returns to signed-out state and the landing page shows again rather than bouncing.

Your two existing accounts have never been marked as welcomed, so both will route to Welcome once on their next sign-in, then to Dashboard afterwards.
