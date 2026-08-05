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
- If `jeffhallstead.com` is also hosted on Netlify and uses Netlify's own DNS, adding the new A record pointing away from Netlify's hosting may be unusual but is correct for a third-party Lovable deployment. If you prefer a different setup (e.g., a proxy), let me know before proceeding.
