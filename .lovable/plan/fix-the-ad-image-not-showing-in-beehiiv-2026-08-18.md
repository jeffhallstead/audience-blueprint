# Fix the ad image not showing in beehiiv

The HTML block still contains the placeholder `YOUR_HOSTED_URL/ad-publisher-blueprint-600x400.png` as the image source. Email platforms can't resolve that, so beehiiv shows the raw text/broken link instead of the graphic. The image needs a real, public https URL.

## What I'll do

1. Create (or reuse) a public storage bucket in the backend for marketing assets.
2. Upload both ad graphics — the 720x400 web version and the 600x400 version — and get their public URLs.
3. Update the newsletter ad HTML to a new version (`publisher-blueprint-newsletter-ad-v2.html`) with:
   - The real hosted image URL in the hero `<img>`, wrapped in the CTA link.
   - The 720x400 image used as the primary hero (web newsletter width), with the 600x400 URL noted as an alternative.
   - Width/height and alt text set so beehiiv renders it correctly before images load.
4. Give you the plain image URLs separately, so you can also paste the graphic directly into beehiiv's image block if you prefer that over the HTML embed.

## Notes

- The CTA continues to point to `https://blueprint.jeffhallstead.com/test`, with the UTM variant kept as a comment.
- I'll verify the uploaded URLs return the image over plain https before handing them off.
