# Add Google OAuth Redirect URI for Custom Domain

## Current State
- The custom domain `blueprint.jeffhallstead.com` is already live and listed in the project URLs.
- The app already uses `https://blueprint.jeffhallstead.com/oauth/callback` as the Google sign-in callback in `src/routes/auth.tsx` (line 190) for non-embedded browsers.
- The Lovable Cloud / Supabase-managed Google provider is configured for the app.
- The missing piece is the **Google Cloud Console OAuth 2.0 client** redirect URI allow-list, which only the project owner can edit.

## Remaining Manual Action

1. Open Google Cloud Console at https://console.cloud.google.com/ and sign in to the account that owns the Google OAuth 2.0 client used for this project.
2. Navigate to **APIs & Services → Credentials**.
3. Find the **OAuth 2.0 Client ID** used for this app (likely the one created when Google sign-in was first enabled).
4. Click the client to edit it.
5. Under **Authorized redirect URIs**, add the following URL exactly:
   ```
   https://blueprint.jeffhallstead.com/oauth/callback
   ```
   - Do not include a trailing slash unless it matches the app callback exactly.
   - Keep the existing `https://audience-blueprint-pro.lovable.app/oauth/callback` URI if it is present, so sign-in continues to work on the old `.lovable.app` domain.
6. Click **Save**.

## Verification After Saving

- Wait 1–2 minutes for Google’s allow-list to propagate, then open an incognito window.
- Visit `https://blueprint.jeffhallstead.com/auth` and click **Continue with Google**.
- Confirm the sign-in completes and redirects to the app dashboard or onboarding flow.
- If Google shows a **redirect_uri_mismatch** error, double-check the exact URI in the Google Cloud Console matches the one above.

## Notes
- No code changes are required for this step; the route `/oauth/callback` already exists and is wired for the managed OAuth callback.
- If you are using the managed Lovable Cloud Google OAuth credentials (recommended), the same Google Cloud Console is used by the Lovable managed OAuth project, so adding the URI there is the correct path.
- If you are using your own custom OAuth client, this is the same client you already configured.
