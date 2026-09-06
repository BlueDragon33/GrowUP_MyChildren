# Delivery roadmap

## Completed in Skeleton v1
- Lượt 01: Repository initialization and branch policy.
- Lượt 02: Static PWA application shell.
- Lượt 03: Core longitudinal child data model.
- Lượt 04: Child profile onboarding and selector.
- Lượt 05: Age 3–18 development timeline.
- Lượt 06: Learning goal engine.
- Lượt 07: Skill tracking.
- Lượt 08: Health records with calculation-only BMI.
- Lượt 09: Physical activity tracking.
- Lượt 10: Nutrition daily log.
- Lượt 11: Habits and daily completion.
- Lượt 12: Assessment summary without child ranking.
- Lượt 13: Portfolio milestones.
- Lượt 14: Backward-planning roadmap.
- Lượt 15: Calendar and reminders.
- Lượt 16: Local rules-based advisor.
- Lượt 17: JSON backup / restore and profile deletion.
- Lượt 18: Responsive UI and PWA offline shell.
- Lượt 19: Automated checks and tests.
- Lượt 20: GitHub Pages deployment workflow.

## Planned platform rounds requiring external/platform capabilities
- Lượt 21: Authentication and family roles.
- Lượt 22: Cloud database and encrypted sync.
- Lượt 23: Fine-grained health-data permissions.
- Lượt 24: Google Calendar integration via explicit account authorization.
- Lượt 25: Notification delivery (web push / device reminders).
- Lượt 26: Evidence/attachment binary storage for portfolio and assessments.
- Lượt 27: Growth-chart integration using age/sex appropriate pediatric references where legally and clinically appropriate.
- Lượt 28: AI provider gateway with consent, redaction, audit logs and parental controls.
- Lượt 29: Analytics and longitudinal trend visualizations.
- Lượt 30: Accessibility, security and privacy audit before production family use.

## Auto-generated implementation rounds
- Lượt 31: GitHub Pages enablement gate. **Blocked by repository Pages setting**; tracked in issue #2. Source workflow is ready.
- Lượt 32: Schema v2 + backward migration from v1. **Completed in v0.2.0.**
- Lượt 33: Longitudinal development cockpit. **Completed in v0.2.0.**
- Lượt 34: Portable calendar bridge via `.ics` export. **Completed in v0.2.0.** Google authorization remains Lượt 24.
- Lượt 35: Local-calendar date correctness. **Completed in v0.2.0.**
- Lượt 36: Screen-privacy controls. **Completed in v0.3.0 as presentation privacy only; not encryption-at-rest.**
- Lượt 37: Development-profile editor. **Completed in v0.3.0.**
- Lượt 38: Attachment metadata layer. **Completed in v0.3.0; binary/cloud storage remains Lượt 26.**
- Lượt 39: Provider-neutral integration interfaces. **Completed in v0.3.0; real authorization remains Lượt 21/22/24.**
- Lượt 40: Static/PWA/accessibility smoke gate. **Completed in v0.3.0; browser E2E promoted to Lượt 50.**
- Lượt 41: Family-role policy model. **Completed in v0.4.0 as local policy; real identity remains Lượt 21.**
- Lượt 42: Reminder due-state + notification capability. **Completed in v0.4.0; push delivery remains Lượt 25.**
- Lượt 43: Backup integrity manifest and safer restore. **Completed in v0.4.0 with SHA-256 checksum and preview.**
- Lượt 44: Age-stage goal templates. **Completed in v0.4.0 as optional templates.**
- Lượt 45: Longitudinal family JSON report. **Completed in v0.4.0; health excluded by default.**
- Lượt 46: Unified developmental event timeline. **Completed in v0.5.0 as a derived view without duplicating source records; health events contain no measurements.**
- Lượt 47: Evidence linking between learning goals and portfolio/attachment metadata. **Completed in v0.5.0 with validation and orphan detection.**
- Lượt 48: Local family-policy editor safeguards. **Completed in v0.5.0; it cannot create a new owner and cannot remove the final owner.**
- Lượt 49: Interoperability exports for selected non-sensitive datasets. **Completed in v0.5.0 for CSV/JSON; health is excluded from the default safe dataset allowlist.**
- Lượt 50: Production-readiness browser gate. **Chromium E2E is implemented in v0.5.0 and must PASS in GitHub Actions before v0.5 is merged. GitHub Pages deployment verification remains blocked until Pages is enabled.**

## Next generated rounds
- Lượt 51: Evidence integrity repair tools: identify and optionally prune orphan goal/evidence links after source deletion.
- Lượt 52: Portable export manifest with schema/version metadata and compatibility checks for long-term archival.
- Lượt 53: Timeline filters and period summaries so parents can inspect month/quarter/year without altering raw history.
- Lượt 54: Keyboard/focus/accessibility hardening for dialogs, navigation and dynamically inserted panels.
- Lượt 55: Deployment verification gate that confirms the public PWA URL, service worker and offline shell after GitHub Pages is enabled.
