# GrowUP My Children — Implementation Report v0.5.0

## Scope
v0.5.0 completes rounds 46–50 on top of the stable v0.4 branch. The release focuses on traceability, interoperable non-sensitive exports and a real browser regression gate.

## Implemented
- Schema v5 with backward migration from v1–v4 and `evidenceLinks` normalization.
- Unified development timeline derived from existing source records. No duplicate timeline records are persisted.
- Health timeline entries expose only the existence/date of a health record, not measurements.
- Learning-goal ↔ portfolio/attachment evidence links with validation and orphan detection helpers.
- Local family-policy editor with final-owner protection. This remains a policy model and is not authentication.
- Safe CSV/JSON exports for allowlisted datasets only; health data is intentionally excluded from the default quick-export allowlist.
- v5 runtime/styles loaded by the static PWA and included in service-worker cache v5.
- Regression fix: enhancement overview matching now accepts the real application title `Tổng quan phát triển`.
- Node unit/static tests expanded for schema v5, timeline, evidence links, policy safeguards and safe export behavior.
- Chromium Playwright E2E job added to GitHub Actions.

## Browser E2E coverage
The browser flow creates a child profile, verifies the v2/v5 overview panels, creates a learning goal, creates a portfolio item, links the goal to evidence, reloads through the application flow and verifies the persisted schema-v5 evidence link. A second browser flow adds a non-owner family-policy member and verifies owner protection remains visible.

## Safety boundaries
- No external child data is sent to an AI service in this release.
- No authentication claim is made by the local family-role policy.
- No encryption claim is made for localStorage or checksum backup.
- Health data is not included in quick CSV/JSON export datasets.
- Health timeline entries do not expose height, weight or BMI values.
- Attachment evidence remains metadata/link based; binary storage remains a later platform round.

## Gate status
- `npm run verify`: required in CI.
- Chromium Playwright E2E: required in CI before merge.
- GitHub Pages deployment: still requires repository Pages to be enabled with GitHub Actions as the publishing source; tracked separately in issue #2.

## Follow-up rounds
Rounds 51–55 are generated in `docs/ROADMAP.md` for evidence repair, long-term archive manifests, timeline period filters, keyboard/accessibility hardening and public deployment verification.
