# Homepage social metadata update

## Changes
- Copy the uploaded PNG byte-for-byte to `public/og-image.png` and verify its dimensions and checksum.
- Replace only the homepage `head().meta` entries with the supplied title, descriptions, Open Graph fields, and Twitter fields.
- Preserve the homepage canonical link and JSON-LD exactly as they are.
- Do not alter visible content, styling, or other routes.

## Technical note
A default `og:image` or `twitter:image` will not be added to the root route because root metadata is inherited and can override leaf-route social previews. The homepage will contain the requested absolute image URLs directly.

## Verification
- Confirm the source and saved image are byte-identical and 1200×627.
- Confirm the rendered homepage head contains the requested metadata and unchanged canonical/JSON-LD.
