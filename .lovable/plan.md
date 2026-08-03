Pre-publish readiness & UAT

Goal: publish the current Publisher Blueprint™ build to a public Lovable URL and begin structured user acceptance testing in the Paddle sandbox environment.

1. Pre-publish readiness checks
   - Run a fresh security scan. The most recent scan is from 2026-08-01 and is marked stale. The previous scan had no findings, but a fresh scan should complete before publishing.
   - Verify the public policy pages (Terms, Refund Policy, Privacy) are accessible at the root routes `/terms`, `/refund-policy`, `/privacy` and include the correct seller identity (Momentive Ventures LLC) with the "by Jeff Hallstead" brand endorsement preserved on marketing surfaces.
   - Confirm the effective publish visibility is `public` (current setting). If this is not intentional, change visibility before publishing.
   - Confirm the build is green and the route tree is valid for a production deployment.

2. Publish the project
   - Use the Lovable Publish flow to deploy the current build to the public Lovable URL.
   - After publishing, verify the homepage, public legal pages, and authenticated routes are reachable from the live URL.

3. UAT scope — test these flows in the published sandbox environment
   - Anonymous: homepage, pricing, public legal pages, and shared deep links load correctly.
   - Authentication: Google sign-up and sign-in on desktop and mobile; deep-link redirect after auth.
   - Assessment: start a new assessment, complete the multi-step wizard, and verify the Publisher Index score and maturity level appear.
   - Dashboard: after completing the assessment, the strategic dashboard, opportunity matrix, and 90-day roadmap render.
   - Copilot: generate a strategy report, view the "Added" / "View my report" states, and test the numbered walkthrough.
   - Commerce: from the public pricing page, click the $99 Blueprint unlock and complete checkout with the Paddle test card `4242 4242 4242 4242` / any future expiry / any CVC. Verify entitlement unlocks the dashboard.
   - Settings: update organization profile, verify completeness percentage, review audit history, and manage integration credentials.
   - Admin (internal): confirm the lifecycle/qualification data and platform events monitor load.
   - Account deletion: verify subscription cancellation is handled cleanly.

4. Mobile-specific checks
   - Re-test Google sign-in on a mobile browser because this flow was previously fixed for iframe handoff issues.
   - Verify the checkout overlay, dashboard, and settings panels are usable on a narrow viewport.

5. Commerce expectations
   - Payments will run in Paddle test/sandbox mode on the preview and published Lovable URLs. The test card is `4242 4242 4242 4242`.
   - Real/live checkout will NOT work until the Paddle go-live steps are completed (readiness check, verification, domain review, identity/business verification). The go-live status is currently "not started".

6. Post-UAT decisions
   - If UAT passes, begin the Paddle go-live process from the Payments tab to enable real money.
   - If issues are found, triage into Phase 7 backlog or fix-forward before go-live.
