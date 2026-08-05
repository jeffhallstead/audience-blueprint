# Help section + in-app feedback

Two additions for signed-in users: a Help page with a getting-started guide, FAQ and a contact route, plus a floating Feedback button available on every app page. Feedback is stored in the backend, visible in the Admin Console, and pushed to the CRM base in Airtable.

## 1. Help section (`/help`, signed-in only)

A new page in the app shell, added to the sidebar under Resources with a question-mark icon.

**Getting started** — a numbered walkthrough matching the real product flow:
1. Complete the Publisher Index™ assessment
2. Review your Blueprint dashboard and category readings
3. Work the 90-day roadmap
4. Use Publisher Copilot™ to generate strategy documents
5. Save actions, export to Excel/Airtable/Asana, download or email your PDF report

Each step links to the route it describes so Help doubles as navigation.

**FAQ** — accordion, grouped into: Scoring & the Index, Plans & billing, Reports & exports, Account & privacy. Content covers how the score is calculated, what free vs Blueprint access includes, refunds, how the PDF/email report works, how connections are stored, and how to delete an account.

**Contact support** — short panel with a direct email link plus a link to consulting at jeffhallstead.com/contact. Anything more involved routes users to the feedback form.

## 2. Floating feedback button

A persistent launcher in the bottom-right corner of the app shell (all signed-in pages). Clicking it opens a dialog with:
- Sentiment: works well / confusing / bug / idea
- Comment (required, 1000-char limit, live counter)
- Automatically captured context: current route, browser, timestamp — no manual entry
- Submit and a "Thanks" confirmation state

It sits above page content but out of the way, and collapses to an icon on mobile.

## 3. Where feedback lands

- Stored in the existing `user_feedback` table, which is already in the database but currently unused by the app.
- A new **Feedback** tab in the Admin Console lists submissions newest-first with the user's email, sentiment, page, and comment, filterable by sentiment.
- Each submission is queued to Airtable through the existing integration outbox, so rows appear in the CRM base alongside leads. Failures are retried by the outbox and never block the user's submit.

## Technical notes

- `src/routes/_authenticated/help.tsx` — new route with its own head metadata; content split into small components under `src/components/help/`.
- `src/components/feedback/feedback-widget.tsx` — dialog + launcher, rendered once inside `AppShell` so it appears on every gated page.
- `src/lib/feedback/feedback.functions.ts` — `submitFeedback` server function with `requireSupabaseAuth`, zod validation on comment length and sentiment enum, insert into `user_feedback` (`target_type: "app"`, page path and user agent in `metadata`), then `enqueueIntegrationEvent` for the Airtable records provider.
- Migration: `user_feedback` currently has one policy; add an admin-read policy via `has_role(auth.uid(), 'admin')` so the Admin Console can list all rows, and confirm insert is scoped to `auth.uid()`.
- Admin listing added to `src/lib/admin/admin.functions.ts` (admin-verified server function) and a new tab in `src/routes/_authenticated/admin.tsx` using the existing panel components.
- A `feedback.submitted` entry added to the platform events catalog and emitted on submit, matching how other product events are audited.
- All styling uses existing Executive Obsidian tokens and shadcn primitives — no new colors.
