# GrowUP My Children — Implementation Report v0.8.0

## Scope
v0.8.0 implements rounds 61–65 on top of the CI/Axe-gated v0.7 baseline. The release focuses on inspectability, evolving development categories, family time/resource planning, optional encrypted backup and safer PWA release operations.

## Lượt 61 — Privacy-safe audit explorer
- Reads the existing local `auditLog` without expanding the data schema.
- JSON/CSV export uses a fixed allowlist of metadata fields.
- Arbitrary notes, measurements, health/nutrition content and unknown detail fields are discarded from audit export.
- Filtering is by event type and optional child ID; the explorer never edits audit history.

## Lượt 62 — Versioned development-domain taxonomy
- Default taxonomy version: `2026.1`.
- Supports renaming default domains, enabling/disabling them, and adding custom domains.
- Taxonomy settings are stored separately from historical learning/portfolio/skill records.
- Existing records are not rewritten when taxonomy names or enabled domains change.
- Data schema remains v5, preserving existing backup/migration compatibility.

## Lượt 63 — Multi-child family time planning
- Stores optional family planning items under `settings.familyPlanItems`.
- Summaries show commitments, planned minutes and days with plans for each child.
- Child display order follows profile order and is never sorted by those values.
- No score, rank, ability comparison or developmental judgment is produced.
- Removing a plan item requires explicit confirmation.

## Lượt 64 — Optional passphrase-encrypted backup
- Uses Web Crypto only; no external encryption provider.
- Key derivation: PBKDF2 + SHA-256, random 16-byte salt, 210,000 iterations.
- Encryption: AES-GCM 256-bit with random 12-byte IV.
- The encrypted envelope contains ciphertext and cryptographic metadata, not plaintext preview data.
- GrowUP never stores the passphrase. Forgotten passphrases cannot be recovered by the app.
- Restore flow: decrypt → parse → verify existing SHA-256 backup checksum → show preview → explicit confirmation → replace local state.
- Wrong passphrase or modified ciphertext is rejected.

## Lượt 65 — Release/update/rollback hardening
- Application version metadata is centralized at v0.8.0 while data schema remains v5.
- Stable rollback point: v0.7.0 commit `adb345c5ec94ccb1933661bad06c8c6473e7ef36`.
- In-app release panel displays version, schema, rollback commit and recent release notes.
- Service worker v8 no longer calls `skipWaiting()` during install.
- A waiting PWA update is activated only when the user selects Apply; the service worker then receives `SKIP_WAITING` and the page reloads after `controllerchange`.
- `CHANGELOG.md` documents release and rollback information.

## Tests and gates
- Unit tests cover audit redaction, taxonomy history preservation, non-ranking family planning, encrypted backup roundtrip/wrong-pass/tamper rejection and release metadata.
- Static tests require v8 assets/modules to be loaded, syntax-checked and PWA-cached.
- Static PWA test rejects an unconditional `skipWaiting()` in the install handler and requires the explicit update message path.
- Privacy tests verify raw health/free-text audit details do not survive export and replacement/destructive flows retain confirmation.
- Chromium E2E covers family planning and a real encrypted-download → local mutation → confirmed restore flow.
- Axe waits until all v8 panels are visible and blocks serious/critical accessibility violations.

## Safety and privacy boundaries
- Encrypted backup may intentionally contain full family data, including Health, because it is an explicit full-backup action; it is not a safe-share/export format.
- Encryption is local file protection, not encrypted cloud sync and not account authentication.
- Taxonomy and family planning are organizational tools, not developmental diagnoses or child rankings.
- Audit export is intentionally lossy to reduce disclosure risk.
- PWA rollback metadata documents a Git point; the UI does not silently downgrade code or data.

## Deployment status
The source and CI paths are independent of GitHub Pages. Public deployment remains blocked until repository Pages is enabled with GitHub Actions as the source (issue #2).

## Merge policy
v0.8 must not merge until `verify` and Chromium E2E/Axe pass on the final PR head. Gate failures are fixed on the feature branch rather than bypassed.
