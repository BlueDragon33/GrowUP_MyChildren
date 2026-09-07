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
- Lượt 31: GitHub Pages enablement gate. **Blocked by repository Pages setting**; tracked in issue #2. Source workflow and post-deploy verification are ready.
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
- Lượt 50: Production-readiness browser gate. **Completed in v0.5.0: both `verify` and Chromium Playwright E2E passed before merge.**
- Lượt 51: Evidence integrity repair tools. **Completed in v0.6.0 with orphan detection, summary and confirmed prune that never deletes source goal/portfolio/attachment records.**
- Lượt 52: Portable archive manifest. **Completed in v0.6.0 with schema/app metadata, SHA-256 checksum, compatibility validation and health exclusion by default.**
- Lượt 53: Timeline month/quarter/year filters and period summaries. **Completed in v0.6.0 as a derived period explorer without altering raw history.**
- Lượt 54: Keyboard/focus/accessibility hardening. **Completed in v0.6.0 with skip link, main landmark focus target, aria-current navigation, dialog semantics/focus and Escape-to-close.**
- Lượt 55: Deployment verification gate. **Implemented in v0.6.0; the main deployment still fails at `Configure Pages` because repository Pages is not enabled, so public verification is skipped.**
- Lượt 56: Local data consistency scanner. **Completed in v0.7.0; detects duplicate IDs, malformed dates and dangling references without auto-fixing.**
- Lượt 57: Data-retention/archive-policy UI. **Completed in v0.7.0 as manual-only retention with preview, pre-removal safe archive and explicit confirmation; no background deletion.**
- Lượt 58: Year-over-year development summaries. **Completed in v0.7.0 as neutral recorded-data/activity counts, never a score or child ranking.**
- Lượt 59: Printable development report. **Completed in v0.7.0 with explicit section selection; health is unchecked by default and only appears when explicitly selected.**
- Lượt 60: Pre-production accessibility/privacy audit gate. **Completed in v0.7.0; verify + 7/7 Chromium E2E/Axe passed after fixing real WCAG AA color-contrast violations before merge.**
- Lượt 61: Local audit-log explorer and export. **Completed in v0.8.0 with fixed metadata allowlist so raw health/free-text details are not exported.**
- Lượt 62: Versioned development-domain taxonomy/customization. **Completed in v0.8.0 as settings-layer taxonomy version `2026.1`, without rewriting historical records or increasing data schema. Custom IDs are normalized idempotently.**
- Lượt 63: Multi-child family scheduling/resource planning. **Completed in v0.8.0 with time/commitment summaries in profile order and no score/rank/ability comparison.**
- Lượt 64: Optional passphrase-encrypted portable backup. **Completed in v0.8.0 with PBKDF2-SHA-256 + AES-GCM-256, no stored passphrase, checksum verification and confirmed restore; real Chromium download/restore regression passed.**
- Lượt 65: Release/rollback operational hardening. **Completed in v0.8.0 with centralized version metadata, changelog, stable v0.7 rollback point and user-approved service-worker activation.**

## Next generated rounds
- Lượt 66: Bind versioned development-domain IDs to new goals/skills/portfolio records while preserving legacy labels and historical compatibility.
- Lượt 67: Family-plan calendar bridge so selected planning items can be exported to `.ics` without exposing unrelated child data.
- Lượt 68: Privacy-safe local search/index across non-sensitive learning, portfolio, roadmap and planning metadata, with Health/Nutrition excluded by default.
- Lượt 69: Encrypted-backup recovery drill and compatibility inspector, including explicit format/KDF/cipher diagnostics without exposing ciphertext contents or passphrases.
- Lượt 70: Release-candidate operational gate covering service-worker/cache-version consistency, rollback runbook, browser/mobile regression and dependency/tooling reproducibility.
