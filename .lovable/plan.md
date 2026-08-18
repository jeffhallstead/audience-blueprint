# Get the ad showing in beehiiv

The image URL itself is fine — it returns a real PNG over https on your domain. What's happening is that beehiiv's Custom HTML block sanitizes the markup: it strips the `<img>` tag and leaves the `src` behind as plain text, which is exactly the "raw URL as text" you're seeing. No amount of rewriting the `<img>` tag will get past that sanitizer.

So the fix is to stop asking the HTML block to render the image.

## Recommended approach: native beehiiv blocks

Build the ad from beehiiv's own blocks instead of one HTML paste:

1. **Image block** — upload `ad-publisher-blueprint-720x400.png` directly (or paste the hosted URL if beehiiv accepts a URL upload), and set its link to `https://blueprint.jeffhallstead.com/test`.
2. **Caption / text block** — "Free 12-minute assessment · No account required".
3. **Button block** — "Take the free Publisher Test" pointing to the same link.

This renders reliably in both the web version and the emailed version, and the graphic already carries the headline and body copy.

## What I'll produce

1. A short step-by-step beehiiv setup note (`beehiiv-ad-setup.md`) with the exact image file, link, caption, and button label to use.
2. A **text-only HTML snippet** (`publisher-blueprint-newsletter-ad-text-only.html`) — same card, headline, copy, and CTA button, with the image row removed — for the case where you'd rather keep a single HTML paste. Buttons built from table cells and background colors usually survive beehiiv's sanitizer even when images don't.
3. Confirmation of whether beehiiv keeps the styled card at all: if the sanitizer also strips inline styles or nested tables, the native-blocks route is the only reliable path, and the setup note will say so plainly.

## Notes

- No app code changes; these are newsletter assets only.
- Uploading the PNG into beehiiv's own media library is the most robust option, since it serves the image from beehiiv's CDN.
- The CTA stays `https://blueprint.jeffhallstead.com/test`, with the UTM variant noted for attribution.
