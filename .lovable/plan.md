## Why this keeps happening

The Google provider is completing authentication successfully; the failure is the browser-side handoff that follows it.

```text
Mobile /auth page inside preview iframe
  → managed auth helper detects “mobile + iframe”
  → opens Google in a new tab
  → requests response_mode=web_message
  → Google login succeeds
  → broker must postMessage tokens back to the original iframe
  → message is not delivered on the affected mobile browser
  → auth helper promise never resolves
  → setSession() is never called
  → no SIGNED_IN event occurs
  → user remains on /auth until the UI timeout
```

### Confirmed failure points

- `@lovable.dev/cloud-auth-js` v1.1.2 selects a special **mobile-in-iframe** branch: it opens `_blank` and waits for a cross-window message (`dist/index.js:118–157`).
- Unlike its native-app fallback, that popup/new-tab branch has **no elapsed-time timeout**; it waits until a message arrives or the child window is detected as closed (`dist/index.js:180–200`). Mobile tab and iframe opener behavior makes that handoff unreliable.
- The app only calls `supabase.auth.setSession(result.tokens)` after that promise resolves (`src/integrations/lovable/index.ts:22–35`). Therefore a successful Google login still produces no local app session when the message is lost.
- The app’s 45-second timer only changes the button/toast (`src/routes/auth.tsx:117–151`). It does not cancel or recover the unresolved managed-auth promise.
- The new `/oauth/callback` page does not fix this failing branch. In the mobile preview iframe, the helper requests `web_message`; it does not use the callback as the session handoff route. The callback currently just polls for a session that was never established (`src/routes/oauth.callback.tsx:40–64`).
- The protected-route guard is behaving correctly: it redirects because no session exists (`src/routes/_authenticated/route.tsx:8–11`). It is an effect, not the root cause.

This also explains why repeated changes to listeners, `getUser()`, callback polling, and route guards have not fixed it: those all run **after** the missing token handoff.

## Implementation plan

1. **Add stage-level auth diagnostics**
   - Record non-sensitive milestones only: flow started, redirected/new-tab path, helper resolved, tokens accepted, session validated, callback mounted, and route entered.
   - Add `pageshow`, visibility, and child-window lifecycle handling so a mobile return can be distinguished from a provider failure.

2. **Replace polling with one supported completion path**
   - Keep the managed Google helper as required, but remove callback logic that merely waits for a session that cannot appear.
   - Reconcile the helper result exactly once, persist the returned session, validate it, and only then navigate.
   - Avoid competing `getUser()` calls and auth listeners during the handoff.

3. **Make mobile return recoverable**
   - On return from the Google tab, re-check the session and reset stale `Connecting to Google…` state.
   - Add a bounded failure state that actually ends the attempt and allows an immediate retry.
   - Preserve `/oauth/callback` only for the genuine top-level redirect path, with explicit URL-result handling rather than blind polling.

4. **Synchronize managed auth configuration**
   - Refresh the Google provider/generated integration after the client changes so redirect and broker configuration remain aligned.
   - Do not introduce a second custom OAuth implementation or expose tokens.

5. **Verify each execution branch**
   - Desktop preview popup: tokens are received, session is persisted, and navigation succeeds.
   - Mobile preview iframe/new tab: returning from account selection completes or presents a recoverable error—never an indefinite spinner.
   - Standalone mobile/top-level redirect: `/oauth/callback` establishes and validates the session.
   - Refresh and protected-route entry retain the authenticated session without bouncing to `/auth`.