# Product Roadmap — Publisher Blueprint™

**Status:** Current as of Phase 6 v2.0 complete  
**Owner:** Jeff Hallstead  
**Audience:** Founder, product, and engineering  

---

## Roadmap horizons

```text
Shipped      Now          Next         Later
──────────── ──────────── ──────────── ──────────────
Phase 1      Phase 6      PDF export   Team plans
Phase 2      CRM sync     Mobile OAuth Peer benchmarking
Phase 3      Admin        OS renewal   White-label
Phase 4                   reassessment API
Phase 5
```

## Shipped

### Phase 1 — MVP foundation
Assessment wizard, profiles, organizations, basic blueprint, roadmap, settings, and premium executive UI.

### Phase 2 — Publisher Index™ assessment engine
Config-driven scoring, six categories, five maturity levels, radar chart, autosave, and assessment events.

### Phase 3 — Strategic dashboard and 90-day roadmap
Executive dashboard, opportunity matrix, KPI grid, editable roadmap, and the blueprint rule engine.

### Phase 4 — Publisher Copilot™ AI strategy engine
Streaming chat, generated documents, scenario simulator, prompt packs, and the "Chief Content Officer" system voice.

### Phase 5 — Commercialization and customer portal
Paddle payments, entitlements, customer billing panel, invoices, refund policy, and legal pages.

### Phase 6 v2.0 — Organization Intelligence Platform
Organization profiles, platform event store, customer lifecycle, qualification engine, CRM sync wiring, admin console, and acquisition tracking.

## Now

### Finish CRM sync operationalization
Move Airtable/HubSpot sync from ad-hoc call sites to a fully event-driven outbox consumer. Live Airtable should receive lifecycle and qualification changes automatically.

### Stabilize mobile OAuth
The embedded mobile preview has unreliable handoff after Google sign-in. Implement a robust standalone-browser flow and recovery listeners so the mobile sign-in success rate matches desktop.

## Next

### PDF export
The "Export PDF" button exists at the Blueprint tier but currently emits a toast. Build a server-side PDF renderer for the full blueprint and roadmap.

### OS renewal and reassessment experience
Add reassessment flow for Publisher OS™ subscribers, blueprint history, and progress tracking against the roadmap.

### Admin console hardening
Add organization detail view, platform event monitor, and audit log browser to `/admin`.

## Later

### Team plans and multi-member organizations
Move from enforced single-member organizations to true team accounts with invites, roles, and shared billing.

### Peer benchmarking
Use the industry, revenue, and team-size data collected in Section 1 to render anonymized peer comparisons on the results and dashboard.

### White-label and API
Expose the Publisher Index™ assessment engine and blueprint generation through a partner API for agencies and platforms.

---

## Open gaps with priority

| # | Gap | Priority | Horizon |
| --- | --- | --- | --- |
| 1 | PDF export is a stub | P0 | Next |
| 2 | Mobile OAuth handoff in embedded previews | P1 | Now |
| 3 | Hydration warning on `/auth` | P2 | Next |
| 4 | HubSpot adapter is dormant | P3 | Now / Next |
| 5 | No peer benchmarking | P1 | Later |

## Dependencies

- Team plans require the organization members table to be enabled beyond a single primary member.
- Peer benchmarking requires enough anonymized data to create meaningful cohorts.
- White-label API requires formalizing the event schema and entitlement API for external callers.
