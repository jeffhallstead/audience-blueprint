# Markdown version of the Signature Offer Deck

Create a text/markdown companion to the signature offer PDF so the content can be pasted into email, Notion, a proposal doc, or a website page.

## What gets created

- `/mnt/documents/publisher-blueprint-signature-offer.md` — the full deck content in markdown, one `##` section per slide, in the same order as the PDF (cover, problem, diagnostic, phases 1–3, deliverables, fit, why me, getting started, close).
- `docs/Signature-Offer.md` — same content committed in the repo so it stays with the project.

## Content rules

- Copy is identical to the finalized deck: `$5,000/month · 90 days, 60-minute sessions once a week`, the "I advised cable and TV networks before I advised brands" positioning, the 15+/Multi-stage/Networks stats, the scope-boundary language (advisory only, production handled by client team or a partner), and the "not a fit" list.
- No tiered pricing table — external-facing anchor price only.
- Bullets and phase metrics carried over as markdown lists; the phase slides become `### Days 1–30 / 31–60 / 61–90` subsections.

## Technical detail

Add a `--markdown` output path to `scripts/build-offer-deck.py` (or a small sibling emitter in the same file) that renders the existing content constants — `DELIVERABLES`, phases, stats, fit lists — to markdown, so the PDF and markdown never drift. Re-running the script regenerates both.
