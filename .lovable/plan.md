# Brand Scout: internal teardown agent

## What you get
A new **Brand Scout** tab in the Admin Console (admin/analyst only). You enter basic brand info, click "Run teardown", and get a ready-to-send written email teardown grounded in the Blueprint framework.

## Intake form (under 60 seconds)
- Brand name, website, social handles
- Vertical (Beauty, Fashion, Food, Wellness, Other)
- Quick checkboxes: editorial newsletter vs discount popup only; recurring series/franchise; heavy paid ads; active community
- Free-text notes (what you observed)

## What the agent returns
1. Estimated Publisher Index (0-100) with the six dimension scores
2. Diagnosed Publisher Pattern with a one-line reason
3. Top two 90-day priorities for that pattern
4. **Written email teardown**: subject line, short observation hook, the leak and why it matters, two specific moves, soft CTA to take the free Publisher Test (blueprint.jeffhallstead.com/test)
5. Copy buttons for subject and body; you can edit before copying

## Saving
- Each teardown is saved to a history list in the tab so you can reopen past brands.
- "Add to Leads" button creates an outreach entry in the existing Lead Workbench with the score, pattern, and teardown attached.

## Technical details
- New table `brand_teardowns` (inputs, scores, pattern, email subject/body, created_by) with RLS: admin/analyst only.
- Server function with requireSupabaseAuth + role check; calls Lovable AI (Gemini) with structured output. Prompt reuses the six dimensions from the assessment config, the six patterns from publisher-patterns.ts, and the copilot's Chief Content Officer voice. Pattern must be one of the six known IDs; scores are clamped and Publisher Index is recomputed with the existing scoring weights, not trusted from the model.
- New component `src/components/admin/brand-scout-panel.tsx`, added as a tab in `admin.tsx`.
- "Add to Leads" writes to the existing lead_outreach table.
- No Loom script, no PDF, no public page.
