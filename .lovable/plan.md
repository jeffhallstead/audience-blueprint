## Diagnosis

**Do I know what the issue is? Yes.** Google accepts the login—the recurring failure is the browser handoff back into the app.

There are two different managed-auth paths:

```text
Standalone mobile browser
  → full-page redirect to Google
  → returns to /oauth/callback
  → backend client must detect and persist the returned session
  → callback validates the user
  → protected route opens

Mobile Lovable preview / iframe
  → Google opens in a new tab
  → broker must postMessage tokens to the original iframe
  → mobile browser may lose the opener/message
  → managed helper never resolves
  → app’s 45-second timeout fires
```

The dedicated callback cannot repair the second branch because the iframe flow uses `web_message` rather than navigating the original app to `/oauth/callback`. This is why repeated changes to callback polling, auth listeners, and route guards have not fixed mobile preview sign-in.

The standalone redirect branch also has two timing weaknesses: `/oauth/callback` currently allows only about 10 seconds for session hydration, and the protected-route guard redirects after one unsuccessful user check. Mobile storage/network delays can therefore bounce an otherwise successful login back to `/auth`.

The provider refresh additionally regenerated `src/integrations/lovable/index.ts` with an optional `redirect_uri`, causing a confirmed TypeScript error under the project’s strict optional-property rules.

## Implementation plan

1. **Repair the generated auth wrapper contract**
   - Ensure every managed OAuth call receives a concrete same-origin `redirect_uri`.
   - Keep using the managed Google helper; do not introduce a second OAuth implementation.

2. **Make `/oauth/callback` the authoritative standalone return path**
   - Detect explicit provider errors from the callback URL and show a recoverable message immediately.
   - Wait for the backend client’s URL-session detection, then validate with `getUser()` before navigating.
   - Replace the fixed 10-second polling race with one bounded completion routine and a realistic mobile timeout.
   - Prevent concurrent listener and polling executions from navigating twice.

3. **Handle mobile page restoration**
   - Add `pageshow`/visibility recovery on `/auth` so a page restored from mobile bfcache checks for an authenticated user and clears stale “Connecting…” state.
   - Do the same on the callback route so returning from Google cannot leave a frozen screen.

4. **Harden the protected-route transition**
   - Allow a short, bounded retry only during the immediate OAuth completion window before redirecting to `/auth`.
   - Continue validating access with `getUser()`; do not weaken route protection or trust browser storage alone.

5. **Add non-sensitive stage diagnostics**
   - Record only milestones: auth started, helper redirected/resolved, callback mounted, provider error detected, session found, user validated, and protected route entered.
   - Include elapsed time and execution context (standalone versus iframe), but never tokens, callback fragments, email addresses, or credentials.
   - These signals will distinguish a managed iframe `postMessage` loss from an app callback or route-guard failure on the next mobile attempt.

6. **Remove competing completion behavior**
   - Keep the root auth subscriber for router/cache synchronization.
   - Restrict navigation ownership to the initiating auth page or `/oauth/callback`; remove redundant OAuth-forwarding races where they overlap.

7. **Verify each branch**
   - Confirm the project compiles after correcting the regenerated wrapper.
   - Test desktop preview popup completion.
   - Test standalone mobile-style full-page return through `/oauth/callback` and protected-route entry.
   - Test bfcache restoration and callback/provider-error states.
   - For the Lovable mobile preview iframe branch, verify either successful session receipt or a clean recoverable timeout with diagnostics; if the broker message is still lost, the remaining defect is provider-side rather than fixable by callback code.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>