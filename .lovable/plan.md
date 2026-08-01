## Google sign-in recovery plan

The backend logs confirm Google authentication completed successfully, and the preview has reached `/welcome` in one viewer. The remaining issue is the original sign-in page: its `Connecting to Google…` state only clears after the OAuth helper promise settles, but the popup flow has no timeout and can remain unresolved if its completion message is missed.

1. **Make the Google flow recoverable**
   - Add a bounded timeout around the popup-based OAuth promise.
   - When it expires, re-check the authenticated user/session before showing an error.
   - If authentication succeeded, route to `/welcome` or `/dashboard`; otherwise restore the button and provide a retry message.

2. **Reconcile the session when the user returns**
   - Re-check auth when the sign-in page regains focus or becomes visible after the Google tab/popup.
   - Clear the pending state when no session exists, so the user is never left with a permanently disabled button.
   - Keep the existing auth-state listener as the immediate success path.

3. **Preserve correct routing**
   - Continue using the public origin as the OAuth return URL.
   - Keep first-time users routed through the existing post-auth resolver to `/welcome`, and returning users to `/dashboard`.

4. **Verify the flow**
   - Test successful Google authentication, cancellation/closed popup, and a missed or delayed popup response.
   - Confirm the loading label always resolves and a successful session reaches the correct destination without requiring a refresh.