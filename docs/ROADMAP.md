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

## Planned platform rounds
- Lượt 21: Authentication and family roles.
- Lượt 22: Cloud database and encrypted sync.
- Lượt 23: Fine-grained health-data permissions.
- Lượt 24: Google Calendar integration via explicit account authorization.
- Lượt 25: Notification delivery (web push / device reminders).
- Lượt 26: Evidence/attachment storage for portfolio and assessments.
- Lượt 27: Growth-chart integration using age/sex appropriate pediatric references where legally and clinically appropriate.
- Lượt 28: AI provider gateway with consent, redaction, audit logs and parental controls.
- Lượt 29: Analytics and longitudinal trend visualizations.
- Lượt 30: Accessibility, security and privacy audit before production family use.

## Auto-generated implementation rounds
- Lượt 31: GitHub Pages enablement gate. **Blocked by repository Pages setting**; tracked in issue #2. Source workflow is ready.
- Lượt 32: Schema v2 + backward migration from v1. **Completed in v0.2.0.**
- Lượt 33: Longitudinal development cockpit (goals, 7-day movement, 7-day habits, portfolio, measurement trends). **Completed in v0.2.0.** This advances Lượt 29 without claiming pediatric interpretation.
- Lượt 34: Portable calendar bridge via `.ics` export. **Completed in v0.2.0.** Google account authorization remains Lượt 24.
- Lượt 35: Local-calendar date correctness. **Completed in v0.2.0.** Replaces UTC slicing for daily logs to avoid date drift near local midnight.
- Lượt 36: Screen-privacy controls and sensitive-data presentation hardening. **Completed in v0.3.0 as screen privacy only.** This is not encryption-at-rest.
- Lượt 37: Development-profile editor (strengths, interests, support needs, target outcomes). **Completed in v0.3.0.**
- Lượt 38: Attachment metadata layer and storage adapter interface. **Metadata layer completed in v0.3.0; binary/cloud storage remains Lượt 26.**
- Lượt 39: Cloud/auth provider interfaces with no provider secrets in source. **Provider-neutral calendar/cloud interfaces completed in v0.3.0; real authorization remains Lượt 21/22/24.**
- Lượt 40: Browser smoke tests and accessibility regression gate. **Static/PWA/accessibility smoke gate completed in v0.3.0; true browser E2E remains pending until a browser runner is introduced.**
- Lượt 41: Family-role policy model (owner/parent/guardian/viewer) before external authentication. **Completed in v0.4.0 as a local policy model. Real identity/authentication remains Lượt 21.**
- Lượt 42: Local notification capability layer and reminder due-state engine before push delivery. **Completed in v0.4.0 for due-state and browser permission capability. Background push delivery remains Lượt 25.**
- Lượt 43: Backup integrity manifest, import preview and safer restore workflow. **Completed in v0.4.0 with SHA-256 checksum verification and restore preview.**
- Lượt 44: Age-stage goal templates and development-domain taxonomy without forcing fixed outcomes. **Completed in v0.4.0 as optional templates.**
- Lượt 45: Longitudinal family report export. **Machine-readable JSON completed in v0.4.0; health is excluded by default and printable report remains later work.**

## Next generated rounds
- Lượt 46: Unified developmental event timeline linking learning, health, physical activity, reminders and portfolio milestones without duplicating source records.
- Lượt 47: Evidence linking between learning goals, skills, portfolio items and attachment metadata so progress can be traced to supporting artifacts.
- Lượt 48: Local family-policy editor with safeguards; real users/identity still depend on Lượt 21 authentication.
- Lượt 49: Interoperability exports for selected non-sensitive datasets (CSV/JSON) with explicit field selection and health exclusion by default.
- Lượt 50: Production-readiness gate: true browser E2E, accessibility audit, destructive-action regression tests and deployment verification after GitHub Pages is enabled.
