# Finalize Signature Offer Deck Placeholders

Update `scripts/build-offer-deck.py` with the provided values and regenerate the PDF.

## Placeholder fills

- `[PRICE]` → `$5,000/month`
- `[DURATION / SESSION CADENCE]` → `90 days, 60-minute sessions once a week`
- `[YEARS]` → `15+ years`
- `[PROOF]` and the existing line "I ran newsrooms before I advised brands" → `I advised cable and TV networks before I advised brands`
- `[N]` → remove or reframe, since no engagements-led count exists yet

## Steps

1. Read `scripts/build-offer-deck.py` to locate all placeholder occurrences.
2. Apply the replacements above.
3. For `[N]`, either delete the engagements-led bullet or rewrite it as a credibility line tied to media/audience background (decide with user if unclear).
4. Regenerate `/mnt/documents/publisher-blueprint-signature-offer.pdf`.
5. Visually inspect the regenerated pages for text overflow or reflow issues.

## Open question

For `[N]` ("engagements led"), should I remove the bullet entirely or replace it with a non-numeric credibility line such as "Advised publishers, networks, and brand teams on owned-audience strategy"?
