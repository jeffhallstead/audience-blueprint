# Custom Domain: Complete Lovable Setup

Target: `https://blueprint.jeffhallstead.com` is now resolving, which means Step 3 (Netlify DNS records) is complete. The remaining work is inside Lovable and the connected providers.

## Remaining steps

1. **Verify in Lovable**
   - Open Project Settings → Project → Domains (or Publish dialog → Domains).
   - Find `blueprint.jeffhallstead.com` and click **Verify**.
   - Wait for status to move from `Verifying` → `Setting up` → `Active`.

2. **Set as Primary domain**
   - Once Active, set `blueprint.jeffhallstead.com` as the **Primary** domain.
   - This keeps the old `.lovable.app` URL but redirects it to the new subdomain.

3. **Update Supabase Auth redirect URLs**
   - Lovable Cloud: Cloud → Users → Auth Settings → URL Configuration.
   - Add `https://blueprint.jeffhallstead.com` to Site URL and Allowed Redirect URLs.

4. **Update Paddle checkout domains**
   - Paddle Dashboard → Checkout settings.
   - Allow `blueprint.jeffhallstead.com` as a checkout domain.

5. **Final verification**
   - Open `https://blueprint.jeffhallstead.com` and confirm the Publisher Blueprint™ site loads.
   - Confirm the old `.lovable.app` URL redirects to the new subdomain.
   - Smoke-test `/auth`, `/dashboard`, `/pricing`, and the Paddle checkout flow.

## Notes

- If the domain is still showing `Verifying`, DNS may be resolving locally but not yet visible to Lovable; give it a few more minutes, then click **Verify** again.
- Do not delete the old `.lovable.app` URL; setting the new domain as Primary handles the redirect.
