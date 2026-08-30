# LinkedIn Featured thumbnail — Publisher Test (502×262)

A minimal Executive Obsidian thumbnail for LinkedIn's Featured section. The user picked "Logo + CTA only," so the card carries only the brand wordmark/eyebrow and one CTA button — no headline — for maximum legibility at small size.

## Visual spec (matches existing ad)

- **Canvas:** 502 × 262 px (LinkedIn Featured thumbnail ratio).
- **Surface:** near-black Executive Obsidian (#0a0a0a / #09090b) with thin dark border and rounded corners.
- **Brand mark:** "PUBLISHER BLUEPRINT" eyebrow, small caps, wide tracking, indigo-violet (#a5a6f6).
- **CTA button:** indigo-violet fill (#6366f1), white text "Begin the Publisher's Test", rounded.
- **Byline:** "by Jeff Hallstead" small grey, bottom corner (optional, only if it reads clean at this size).
- **No headline copy** (per the user's choice).

## Approach

Build it as a deterministic Python/PIL canvas (not AI image-gen) so the short CTA text renders pixel-perfect and brand-consistent:

1. Render at 2x (1004×524) using brand fonts — Outfit (sans, available in the canvas-design font bundle) for eyebrow/button, plus a serif for any wordmark accent if it helps balance.
2. Downscale to exactly 502×262 with LANCZOS for crisp retina-on-LinkedIn edges.
3. Visually QA the rendered PNG (check for clipping, button padding, contrast, nothing touching edges) and refine before delivering.

## Deliverables

- `/mnt/documents/publisher-test-linkedin-thumbnail-502x262.png` — the final thumbnail, posted in chat for download.
- No app changes; this is a marketing asset only.

## Notes

- LinkedIn Featured links to a URL, not the image — the recommended link is `https://blueprint.jeffhallstead.com/test`.
- LinkedIn will display the thumbnail in its Featured card frame; keeping a safe interior margin so nothing is clipped.
