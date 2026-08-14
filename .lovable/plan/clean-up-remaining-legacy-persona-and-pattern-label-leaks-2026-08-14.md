# Clean up remaining legacy persona and pattern-label leaks

A full sweep of the codebase found the app itself is clean — no customer-facing "persona", "Orphaned Audience", "Stalled Studio", or "Funded Builder" wording remains in any route, component, or library under `src/`. The only remaining hits in `src/lib/publisher-patterns.ts` are the intentional legacy alias map that keeps historical stored values resolvable, and they stay.

The leaks that remain are in the sellable guide generator and the sales documentation.

## 1. The Publisher Blueprint Guide PDF generator

`scripts/build-guide.py` was only partly updated. Its `PATTERNS` list already holds the correct six patterns (Paid Media Plateau, Campaign Factory, Borrowed Audience, Invisible Studio, Fragmented Builder, Category Leader), but the surrounding narrative still describes eight:

- The "Level x weakest dimension" routing table still lists `06 Curious Observer` and `07 Internal Champion` and numbers Category Leader as `08`, with page numbers that no longer match the six pattern pages.
- Body copy in three places still says "one of eight patterns" / "The eight patterns" / "The eight<br/>patterns" section divider.

Fix: rewrite the routing table to the six real patterns with correct ids and page references, and change every "eight" reference to "six". The callout explaining that patterns are output clusters rather than personality types stays — it is the right framing — but its sentence is updated to say six.

The "orphaned relaunch" heading in the mistakes section is a plain-English description of a failure mode, not a pattern label, and is left alone.

## 2. Sales Material Kit

`docs/Sales-Material-Kit.md` still routes on the two retired segments:

- Rows for `Signal: Curious Observer` and `Signal: Internal Champion` in the routing table.
- A rule that shows "Curious Observer language" for Observer-tier users.
- Section 4, "Internal Champion and Category Leader routing", including a `P7` label from the old numbering.

Per the pattern model, Observer-tier users now resolve to a real pattern (usually Fragmented Builder) rather than a maturity-state label, and Internal Champion is an outreach signal only — never shown to a customer. Fix: replace the Observer-tier rule with pattern-based routing, keep Internal Champion strictly as an internal buying-authority signal with clearly internal-only naming, and drop the stale `P` numbering.

## 3. Internal-only "persona" references

`ARCHITECTURE.md`, `Product-Specification-v2.0.md`, `Product-Roadmap.md`, `prd/Phase-04.md`, and `adr/ADR-009` use "persona" to mean the Copilot's own Chief Content Officer voice. That constant was already renamed to `COPILOT_SYSTEM_VOICE` in code, so the docs are updated to match ("system voice") to avoid the term being reused later. No customer impact.

## Deliberately unchanged

- Legacy alias map in `src/lib/publisher-patterns.ts` and the legacy-id column in `docs/publisher-patterns.csv`.
- The "Replaces the former ..." notes and legacy mapping table in `docs/Publisher-Patterns.md` — these document the migration.
- `personal data`, `personalization`, `personal access token` wording.

## Verification

Regenerate the guide PDF from the updated script, confirm the pattern routing table and page numbers line up with the six pattern pages, then re-run the full sweep and confirm the only surviving hits are the deliberate ones listed above.
