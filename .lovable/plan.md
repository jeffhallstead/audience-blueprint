# Connect Custom Domain: blueprint.jeffhallstead.com

Goal: serve the published Publisher Blueprint™ site from `blueprint.jeffhallstead.com` and redirect the current `.lovable.app` URL to it.

Current state: site is live at `https://audience-blueprint-pro.lovable.app`, publicly visible.
Target: `https://blueprint.jeffhallstead.com`.
DNS control: Netlify (external to Lovable).

## Plan

1. Start the Lovable domain flow
   - Open Project Settings → Project → Domains (or the Publish dialog → Add custom domain).
   - Click **Connect Domain** and enter `blueprint.jeffhallstead.com`.

2. Copy the DNS records Lovable provides
   - Lovable will generate a verification TXT record (e.g., `_lovable.blueprint`) and an A record pointing to `185.158.133.1`.
   - Keep these values ready for Netlify.

3. Add the DNS records in Netlify
   - Sign in to the Netlify account that manages `jeffhallstead.com`.
   - Navigate to the domain's DNS settings.
   - Add the A record for `blueprint` → `185.158.133.1`.
   - Add the TXT verification record for `_lovable.blueprint` with the exact value from Lovable.
   - Save and note that full DNS propagation can take up to 72 hours.

4. Verify the domain in Lovable
   - Return to Project Settings → Domains and click **Verify** for the new domain.
   - Wait for the status to move from `Verifying` to `Active`.

5. Provision SSL and set the primary domain
   - Lovable automatically provisions SSL once verification succeeds.
   - Set `blueprint.jeffhallstead.com` as the **Primary** domain so the old `audience-blueprint-pro.lovable.app` URL redirects to it.

6. Final verification
   - Open `https://blueprint.jeffhallstead.com` in a fresh browser window and confirm the Publisher Blueprint™ site loads.
   - Confirm `https://audience-blueprint-pro.lovable.app` redirects to the new subdomain.
   - Smoke-test `/auth`, `/dashboard`, `/pricing`, `/terms`, `/refund-policy`, `/privacy` and the Paddle checkout flow.

## Notes / risks

- I cannot directly edit Netlify DNS; you will need to paste the records Lovable gives you.
- Do not delete the old `.lovable.app` URL in Lovable; setting the new domain as Primary will handle the redirect.
- Because `jeffhallstead.com` is already hosted on Netlify, the A-record for `blueprint` will point that subdomain away from Netlify's hosting. This is the recommended setup for Lovable deployments. Using a Netlify proxy/rewrite instead would add a middle layer that can interfere with SSL, auth redirects, and Paddle checkout, so the direct A-record approach is preferred.

## Proxy alternative (not recommended)

If you later want to keep all traffic flowing through Netlify for analytics or rewriting, you could proxy `blueprint.jeffhallstead.com` to the Lovable origin. Trade-offs:

- SSL must be configured and renewed on Netlify for the proxy.
- Lovable's auto-managed SSL and domain verification would not apply.
- WebSocket, auth cookies, and Paddle webhook signatures can fail or require extra headers.
- This is more complex than the direct A-record approach and is only worthwhile if you need Netlify-specific edge rules.
