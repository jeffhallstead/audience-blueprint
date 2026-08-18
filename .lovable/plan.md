# Newsletter Ad Asset for the Publisher Blueprint

A small sponsored-style ad unit you can drop into your newsletter: a branded graphic plus a copy-paste HTML block, both linking to the free Publisher Test.

## Message

Lead with the rented-vs-owned angle, matching the homepage voice.

- Eyebrow: Sponsored — Publisher Blueprint
- Headline: Most brands rent their audience. The ones that win own it.
- Body: The Publisher Test scores your content operation across seven dimensions, shows where you're leaking audience, and hands you a prioritized 90-day plan. Free, about 12 minutes, no account needed to start.
- Button: Take the free Publisher Test
- Footer line: by Jeff Hallstead

## Deliverables

1. `ad-publisher-blueprint-600x400.png` — main graphic in the Executive Obsidian look (near-black surface, indigo-violet accent, Outfit headline / Plus Jakarta Sans body), headline, one-line subhead, and a visible button treatment.
2. `ad-publisher-blueprint-600x150.png` — slim banner variant for tighter newsletter slots.
3. `publisher-blueprint-newsletter-ad.html` — table-based, email-client-safe HTML block: bordered card, headline, body copy, bulletproof CTA button, small disclosure line. Inline styles only, 600px max width, mobile-friendly, with the image variant referenced as an alternative usage note.
4. `publisher-blueprint-newsletter-ad.txt` — plain-text fallback copy for text-only email versions.

All files land in your documents area for download; no changes to the app itself.

## Link

Every CTA points to `https://blueprint.jeffhallstead.com/test`. The HTML block will also include a commented-out UTM variant (`?utm_source=newsletter&utm_medium=email&utm_campaign=publisher_test`) you can swap in if you want attribution later.

## Technical notes

- Graphics generated at 2x and downscaled for retina crispness in email.
- HTML uses nested tables, inline CSS, and VML-free button markup for Outlook tolerance; no web fonts (system font stack with graceful fallback), since email clients strip font imports.
- Each rendered page/image is inspected before delivery to check for clipped text or layout issues.
