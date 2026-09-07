# GrowUP My Children — Implementation Report v0.7.0

## Scope
v0.7.0 implements rounds 56–60 on top of v0.6. The release focuses on data hygiene, deliberate retention, neutral longitudinal summaries, explicit printable reporting and stronger accessibility/privacy gates.

## Implemented
- Local consistency scanner for duplicate IDs, malformed dates, duplicate habit logs, dangling selected child/member references and dangling evidence links.
- Scanner is read-only: it reports issues and never silently repairs or deletes data.
- Manual retention policy limited to completed old reminders and old physical-activity records.
- Retention requires explicit dataset selection, preview and confirmation. Before a confirmed removal the application initiates a portable non-health archive download.
- Retention removal uses dataset-scoped IDs, preventing accidental cross-collection deletion when IDs happen to match.
- Year-over-year summaries report differences in recorded events, physical minutes, habit logs, portfolio records and skill updates. They explicitly do not score or rank a child.
- Printable report generator with explicit section selection. Health is not part of the default selection and appears only when explicitly selected.
- Printable user content is HTML-escaped. The local blank print window severs `opener` after creation.
- PWA cache v7 includes all v7 runtime and core modules.

## Pre-production audit gate
- Static privacy audit rejects external runtime scripts and common embedded-secret patterns.
- Tests assert health remains opt-in/excluded by default across printable report, safe interoperability exports and portable archive.
- Source audit verifies destructive flows retain explicit confirmation checks.
- Browser destructive-action regression verifies dismissing profile deletion preserves the profile; only accepting confirmation deletes it.
- Chromium CI installs `@axe-core/playwright` and runs automated accessibility audits on the initial screen and a populated development overview.
- Serious or critical Axe violations block merge.

## Safety boundaries
- Retention is manual only; no background deletion or automatic expiry exists.
- A pre-removal portable archive does not contain health/nutrition by default and is not encrypted unless a future encrypted-backup round is implemented.
- Year-over-year differences describe recorded activity/data volume, not developmental quality, academic ability or child ranking.
- The printable report never includes health merely because health exists in the profile.
- The local consistency scanner does not auto-fix potentially ambiguous data.

## Deployment status
GitHub Pages remains externally blocked: after v0.6 merged, the Pages workflow failed at `Configure Pages`, so upload/deploy/public PWA verification were skipped. Issue #2 remains the configuration blocker. Source CI and browser gates are independent of this repository setting.

## Merge policy
v0.7 must not merge until both `verify` and the Chromium E2E/Axe job pass on the PR head commit. Any gate failure is fixed on the feature branch and rerun rather than bypassed.

## Generated next rounds
Rounds 61–65 cover audit-log inspection/export, versioned development-domain taxonomy, non-ranking family scheduling, optional Web Crypto passphrase-encrypted portable backup, and release/PWA-update/rollback hardening.
