# Finalize Signature Offer Deck Placeholders

Update `scripts/build-offer-deck.py` with the provided values and regenerate the PDF.

## Placeholder fills

- `[DURATION / SESSION CADENCE]` → `90 days, 60-minute sessions once a week`
- `[YEARS]` → `15+ years`
- `[PROOF]` and the existing line "I ran newsrooms before I advised brands" → `I advised cable and TV networks before I advised brands`
- `[N]` → `Built audience systems for publishers, networks, and brand teams across multiple revenue stages` (non-numeric credibility line)
- `[PRICE]` → tiered monthly retainer based on client size:
  - Under $10M → `$3,500/month`
  - $10M–$50M → `$5,000/month`
  - $50M–$150M → `$7,500/month`
  - $150M–$500M → `$10,000/month`
  - $500M+ → `$12,500/month`

## Steps

1. Read `scripts/build-offer-deck.py` to locate all placeholder occurrences.
2. Apply the replacements above.
3. For the price slide, render the tiered pricing as a clean table or list aligned with the intake-survey revenue brackets.
4. Regenerate `/mnt/documents/publisher-blueprint-signature-offer.pdf`.
5. Visually inspect the regenerated pages for text overflow or reflow issues, especially the pricing and proof slides.

## Open question

Do you want the deck to show the full tiered pricing table, or lead with "$5,000/month" as the anchor for the $10M–$50M bracket and mention "scaled to client size" with the other tiers in smaller text?
