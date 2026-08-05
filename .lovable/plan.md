# Set blueprint.jeffhallstead.com as Primary Domain

Current state: `blueprint.jeffhallstead.com` is listed as **Live** in Lovable Domains, which means DNS verification and SSL provisioning have already completed. The **Verify** button is not shown because no manual verification is needed.

Goal: make `blueprint.jeffhallstead.com` the canonical URL for the Publisher Blueprint™ site and redirect the old `.lovable.app` URL to it.

## Steps

1. **Set the domain as Primary in Lovable**
   - Open **Project Settings → Project → Domains** (or the Publish dialog → Domains).
   - Find `blueprint.jeffhallstead.com` in the list.
   - Click **Set as Primary**.
   - Confirm the change. Lovable will automatically redirect the previous `.lovable.app` URL to `blueprint.jeffhallstead.com`.

2. **Update Lovable Cloud Auth redirect URLs**
   - Open **Cloud → Users → Auth Settings → URL Configuration**.
   - Add `https://blueprint.jeffhallstead.com` to the **Site URL**.
   - Add `https://blueprint.jeffhallstead.com` to **Allowed Redirect URLs** (or ensure it is covered by the existing wildcard if one is used).

3. **Update Google OAuth authorized redirect URIs**
   - In the Google Cloud Console OAuth 2.0 client for this project, add `https://blueprint.jeffhallstead.com/auth/callback` to the authorized redirect URIs.
   - This is required for Google sign-in to work on the new domain.

4. **Allow the domain in Paddle checkout settings**
   - In the Paddle Dashboard, open **Checkout → Settings → Allowed checkout domains**.
   - Add `blueprint.jeffhallstead.com` so the "Unlock for $49" checkout can load on the new domain.

5. **Final verification**
   - Visit `https://blueprint.jeffhallstead.com` and confirm the Publisher Blueprint™ landing page loads.
   - Visit `https://audience-blueprint-pro.lovable.app` and confirm it redirects to `https://blueprint.jeffhallstead.com`.
   - Test Google sign-in on the new domain.
   - Test the paid checkout flow on the new domain.
   - Test a protected route such as `/dashboard` after signing in.

## Notes

- The existing `.lovable.app` URL should not be deleted. Setting the new domain as Primary handles the redirect automatically.
- Because the app already uses `window.location.origin` for OAuth and checkout redirects, no code changes are needed for the new domain to work.
- If Paddle checkout still shows a domain error after adding it, try a hard refresh or an incognito window; Paddle's domain allow-list can take a few minutes to propagate.
