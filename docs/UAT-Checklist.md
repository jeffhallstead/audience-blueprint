# UAT Checklist — Four Seeded Test Users

Run this against the published site: https://audience-blueprint-pro.lovable.app

All four accounts use email/password sign-in (password `UatTest!2026`) and are email-confirmed. All commerce data is sandbox-only.

| Account | Expected state |
| --- | --- |
| uat-free@example.com | Free tier, no purchase |
| uat-blueprint@example.com | Blueprint purchase + 1 month OS included |
| uat-os@example.com | Blueprint purchase + active OS subscription |
| uat-admin@example.com | Free tier + internal admin role |

Use a fresh private/incognito window per account so sessions don't overlap.

---

## 1. Authentication

For each of the four accounts:

1. Open the site signed out. Confirm the marketing home page renders and shows a sign-in entry point.
2. Visit `/dashboard` directly while signed out. Expect a redirect to `/auth`, no flash of dashboard content.
3. On `/auth`, sign in with the account email and password. Expect landing in the app (welcome or dashboard).
4. Hard-refresh the page. Expect to stay signed in, not bounce to `/auth`.
5. Sign out. Expect return to a public page and `/dashboard` again redirecting to `/auth`.

Repeat step 3 once on a phone browser with any one account to confirm mobile sign-in.

## 2. Authorization by tier

### uat-free@example.com
- `/pricing` shows both paid plans as purchasable (no "current plan" state).
- Assessment wizard is fully accessible; can complete all seven sections.
- After completing, the results page shows the Publisher Index score, maturity level, and category breakdown.
- Full dashboard, 90-day roadmap, Copilot document generation, and PDF export are locked with upgrade prompts.
- Visiting `/blueprint`, `/roadmap`, and `/copilot` directly still shows the paywall — no paid content is rendered.
- `/admin` is not reachable.

### uat-blueprint@example.com
- Billing/account panel in `/settings` shows the Blueprint purchase and the included OS access end date.
- Full dashboard, opportunity matrix, 90-day roadmap, Copilot documents, and PDF export are all unlocked.
- Pricing page reflects ownership of Blueprint.
- `/admin` is not reachable.

### uat-os@example.com
- Billing panel shows both the purchase and an active monthly subscription with a renewal date.
- Everything Blueprint has, plus OS-only features: unlimited Copilot sessions, progress tracking, blueprint history, reassessment.
- Manage-subscription action opens the Paddle portal in a new tab.
- `/admin` is not reachable.

### uat-admin@example.com
- `/admin` loads. Confirm overview metrics, users list, organizations, events feed, lifecycle, qualification, and outbox panels all render.
- The users table lists all four UAT accounts with the expected tier for each.
- Confirm the admin account itself still sees free-tier gating in the product surfaces (admin role is not an entitlement).

Negative check: while signed in as free/blueprint/os, request `/admin` directly and confirm access is denied, not merely hidden in navigation.

## 3. Blueprint dashboard end to end

Do this with **uat-blueprint@example.com** (repeat abbreviated with uat-os for OS extras):

1. Start a new assessment. Confirm organization intake captures company details.
2. Answer part of one section, leave the page, return — confirm autosave restored the answers and the step position.
3. Complete all seven sections and submit. Confirm the processing screen resolves to results.
4. On results: index score 0-100, five-level maturity label, six category scores, radar chart all render and agree with each other.
5. Open the executive dashboard: KPI tiles, category cards, opportunity matrix, top opportunity and top risk populated — no placeholder or empty states.
6. Open the 90-day roadmap: items grouped by month, each with owner and status. Edit an item's status and owner, refresh, confirm persistence.
7. Add a recommendation to the blueprint from the strategy library; confirm it appears in saved actions and the button flips to an added state.
8. Generate a Copilot document; return to the Copilot page and confirm the "View my report" button appears for the existing document.
9. Export recommendations: CSV and XLSX download; Airtable and Asana show a connect prompt in `/settings` if not connected.
10. Export the executive PDF and confirm content matches the on-screen dashboard.

## 4. Cross-cutting checks

- No console errors on any page visited during the run.
- Every page has a distinct browser tab title.
- Mobile viewport: dashboard, roadmap, and results remain readable and scrollable.
- Legal pages `/terms`, `/refund-policy`, `/privacy` load and name Momentive Ventures LLC.

## 5. Recording results

For each item, record: pass/fail, account used, device, and a screenshot for anything that fails. Group failures into blocking (auth, payment gating, data loss) versus cosmetic, and report blocking items first.
