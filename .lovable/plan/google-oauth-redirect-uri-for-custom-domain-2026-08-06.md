# Google OAuth Redirect URI for Custom Domain

## Current State
- The custom domain `blueprint.jeffhallstead.com` is already live and listed in the project URLs.
- The app already uses `https://blueprint.jeffhallstead.com/oauth/callback` as the Google sign-in callback in `src/routes/auth.tsx` (line 190) for non-embedded browsers.
- This project uses **Lovable Cloud managed Google OAuth**. There is no separate Google Cloud Console OAuth 2.0 client for you to edit.
- The previous plan incorrectly assumed a self-managed Google OAuth client existed in your Google Cloud Console.

## Managed OAuth Behavior
- Lovable Cloud handles the Google OAuth client, Site URL, and redirect allow-list automatically.
- For custom domains, the OAuth broker infrastructure intercepts `/~oauth/initiate` and `/~oauth/callback` and routes through `oauth.lovable.app`, so the managed client accepts the callback.
- The managed flow is designed to work on `*.lovable.app`, custom domains, and previews without manual Google Cloud Console changes.

## Recommended Action

1. **No manual Google Cloud Console action is required** for the managed OAuth path.
2. Verify Google sign-in on the custom domain after the domain is set to primary:
   - Open an incognito window at `https://blueprint.jeffhallstead.com/auth`.
   - Click **Continue with Google** and complete the sign-in.
   - Confirm the callback returns to `/oauth/callback` and then redirects into the app.
3. If Google sign-in fails with a `redirect_uri_mismatch` error, notify Lovable support so they can confirm the managed OAuth client includes the custom domain callback.

## Optional: Use Your Own Google OAuth Client

If you prefer to use your own Google OAuth client for branding or control:

1. In Google Cloud Console, create a new project (or use an existing one).
2. Go to **APIs & Services → OAuth consent screen** and configure the consent screen:
   - User Type: External
   - App name: Publisher Blueprint
   - User support email: your email
   - Authorized domains: add `jeffhallstead.com` and `blueprint.jeffhallstead.com`
3. Go to **APIs & Services → Credentials** and click **Create Credentials → OAuth client ID**.
   - Application type: Web application
   - Name: Publisher Blueprint
   - Authorized redirect URIs: add exactly:
     ```
     https://blueprint.jeffhallstead.com/oauth/callback
     https://audience-blueprint-pro.lovable.app/oauth/callback
     https://id-preview--6d4e5e38-ebb7-4aa9-b55b-9a7cad324fe2.lovable.app/oauth/callback
     ```
4. Copy the **Client ID** and **Client Secret**.
5. In Lovable Cloud, open **Cloud → Users → Auth Settings → Sign In Methods → Google**, switch from managed credentials to your own credentials, and paste the Client ID and Secret.
6. Save and re-test sign-in on the custom domain.

## Notes
- The existing app code uses `/oauth/callback` (not `/auth/callback`). Any custom OAuth client must use `/oauth/callback` exactly.
- If you stay on managed credentials, no code or console changes are needed for the custom domain to work.
