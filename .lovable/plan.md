# Email Report to User — Feasibility & Implementation Plan

## Feasibility Assessment
Straightforward. The app already has:
- A verified sender domain (`jeffhallstead.com`) and transactional email infrastructure (`src/lib/email-templates/`).
- A browser-side PDF generator (`src/lib/export/pdf.ts`).
- User authentication via Lovable Cloud, so the user's email is available server-side.

The main constraint is that the Lovable managed email API does **not** support file attachments. Therefore, the PDF cannot be attached directly to the email. We can solve this by uploading the generated PDF to a private storage bucket and emailing a secure, time-limited download link.

## Recommended Approach: PDF + Signed Storage Link

### How it works
1. User clicks **"Email my report"** on the dashboard.
2. Browser generates the PDF using the existing `downloadBlueprintPdf` logic.
3. PDF is uploaded to a private Supabase Storage bucket (e.g., `report-pdfs`) with a path scoped to the user.
4. Server creates a signed download URL (e.g., 7-day expiry).
5. Server sends a transactional email to the user's email address with a branded message and the download link.

## Why this approach
- The PDF reaches the user without requiring them to download it immediately.
- The attachment limitation is bypassed using Supabase Storage.
- Reuses the existing PDF generator and email infrastructure.
- Signed URL keeps the file private and auto-expires.

## Implementation Steps

### 1. Backend & Storage
- Create a private Supabase Storage bucket `report-pdfs` with RLS so users can only read/write their own files.
- Add a `sendReportPdf` server function in `src/lib/email/report.functions.ts` that:
  - Accepts a base64 PDF payload from the browser.
  - Uploads it to the storage bucket under `user/{user_id}/{timestamp}.pdf`.
  - Creates a signed URL with a 7-day expiry.
  - Calls `sendTemplateEmail` with a new `report-delivered` template.

### 2. Email Template
- Add `src/lib/email-templates/report-delivered.tsx` with the Publisher Blueprint™ brand styling.
- Subject: "Your Publisher Blueprint™ report is ready".
- Body: greeting, summary of what the report contains, primary CTA button linking to the signed PDF URL, and a fallback text link.
- Register the template in `src/lib/email-templates/registry.ts`.

### 3. Dashboard UI
- Add an **"Email my report"** button next to the existing **"Download PDF"** button on the dashboard.
- On click, generate the PDF in the browser, then call the new `sendReportPdf` server function.
- Show loading, success, and error states via toast notifications.
- Track the event with existing analytics (`trackRecommendationExport` or a new `trackReportEmail` event).

### 4. Tiering
- Free users: receive the same limited PDF they would download (current PDF generator already supports `locked` tiering).
- Paid users: receive the full Blueprint report.

### 5. Cleanup (optional, can be later)
- Add a scheduled cleanup for expired signed URLs is not required; PDFs remain in the bucket until explicitly deleted.
- Consider deleting old PDFs after a retention window to keep storage costs down.

## Estimated Effort
- Small-to-medium: roughly one focused implementation session.
- The bulk of the work is wiring the PDF upload, signed URL creation, and the new email template. The PDF generation and email plumbing already exist.

## Out of Scope
- No changes to the PDF content itself.
- No attachment support (platform limitation).
- No marketing automation or recurring email digests.

## Testing Plan
- Unit test the server function upload path against a local Supabase storage bucket.
- Send a test email to a sandbox address and verify the link resolves the PDF.
- Test free and paid tiers to confirm tiered PDF content.
- Test the flow on mobile to ensure PDF generation + upload works reliably.
