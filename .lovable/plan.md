# Footer Update Plan

## Goal
Add the consulting website URL (https://jeffhallstead.com/) to the app's footer so users can return to the main site.

## Current State
- The landing page footer is in `src/routes/index.tsx` (lines 181–199).
- It currently shows copyright text and links to internal pages (Pricing, Terms, Refund Policy, Privacy).

## Proposed Changes
1. Add an external link to "Jeff Hallstead Consulting" in the landing page footer, alongside the existing internal links.
2. Open the link in a new tab using `target="_blank"` and `rel="noopener noreferrer"`.
3. Keep the existing styling and links intact.

## Implementation Notes
- Add the link inside the existing `<nav>` in `src/routes/index.tsx`.
- Use an inline `<a>` tag (external link) rather than the internal `<Link>` component.

## Out of Scope
- No other pages or components will be modified unless requested.
- No backend or schema changes required.

## Verification
- Visual check of the landing page footer to confirm the link appears and is clickable.
