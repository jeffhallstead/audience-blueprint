# Finalize Signature Offer Deck Placeholders

Update `scripts/build-offer-deck.py` with the provided values and regenerate the PDF.

## Placeholder fills

- `[DURATION / SESSION CADENCE]` → `90 days, 60-minute sessions once a week`
- `[YEARS]` → `15+ years`
- `[PROOF]` and the existing line "I ran newsrooms before I advised brands" → `I advised cable and TV networks before I advised brands`
- `[N]` → `Built audience systems for publishers, networks, and brand teams across multiple revenue stages` (non-numeric credibility line)
- `[PRICE]` → `$5,000/month` (anchor retainer for the $10M–$50M bracket; tiered pricing applied based on client size but not shown in the external deck)

## Steps

1. Read `scripts/build-offer-deck.py` to locate all placeholder occurrences.
2. Apply the replacements above.
3. Keep the price slide to a single, clean monthly retainer line — no tiered table in the external deck.
4. Regenerate `/mnt/documents/publisher-blueprint-signature-offer.pdf`.
5. Visually inspect the regenerated pages for text overflow or reflow issues, especially the pricing and proof slides.
