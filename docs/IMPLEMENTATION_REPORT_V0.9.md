# GrowUP My Children — Implementation Report v0.9.0

## Scope
v0.9.0 implements rounds 66–70 on top of the v0.8 baseline. The release focuses on versioned domain binding, selective family-calendar export, privacy-safe local search, encrypted-backup recovery inspection, and a reproducible release-candidate gate.

## Lượt 66 — Versioned development-domain binding
- New Learning, Skill and Portfolio records may store `developmentDomainId`, `developmentDomainLabelSnapshot`, and `developmentTaxonomyVersion`.
- Existing records remain untouched and continue to use their historical subject/name/type labels.
- A later taxonomy rename does not rewrite the label snapshot stored on historical records.
- Data schema remains v5 because the new fields are optional additive metadata.

## Lượt 67 — Family-plan calendar bridge
- Family planning items can be selectively exported to `.ics`.
- Export requires explicit item selection.
- The calendar file contains only event title, date, category and planned minutes for selected items.
- Child name, unrelated plan items, notes, Health and Nutrition data are not included.

## Lượt 68 — Privacy-safe local search
- Local-only index covers Learning, Skills, Portfolio title/type metadata, Roadmap and Family Plan metadata.
- Health, Nutrition, health notes and Portfolio notes are excluded from the search index.
- Search result ranking is only internal query matching and is removed from returned result objects; it is not a child score or developmental rank.

## Lượt 69 — Encrypted-backup compatibility inspector and recovery drill
- Inspector reads format/KDF/cipher metadata without exposing ciphertext in the result object.
- Supported profile requires PBKDF2 + SHA-256, 100k–1M iterations, AES-GCM 256 and valid ciphertext metadata.
- Recovery drill uses the existing v0.8 decrypt + checksum path in memory and returns only a structural preview/schema result.
- Recovery drill never writes to localStorage and never performs restore.
- The actual encrypted download/confirmed restore browser regression from v0.8 remains part of the v0.9 browser suite.

## Lượt 70 — Release-candidate operational gate
- App version: v0.9.0.
- Data schema: v5.
- Service-worker cache: `growup-mychildren-v9`.
- Node: 22.x.
- Playwright: 1.55.0.
- Axe Playwright: 4.10.2.
- Stable rollback point: v0.8.0 commit `241653d6fb12f021ebd20704144e47a5a12cc8fd`.
- CI installs pinned browser/a11y tooling rather than unversioned latest packages.
- A compatibility module keeps the legacy release-panel label synchronized with the current `APP_VERSION`.

## Tests and gates
- Unit/static coverage: domain binding history semantics, selective ICS export, local-search allowlist, backup inspector diagnostics, RC profile consistency and v9 runtime/cache/tooling integration.
- Browser coverage: domain binding, selected `.ics` export, safe-search exclusions, backup compatibility inspector and 390px mobile overflow regression.
- Existing encrypted backup browser roundtrip/restore regression remains active.
- Axe gate waits for all v8 and v9 overview tools before scanning and blocks serious/critical violations.

## Safety and privacy boundaries
- Domain taxonomy is organizational metadata, not a diagnosis or score.
- Family calendar export is opt-in per item.
- Local search intentionally sacrifices recall to avoid indexing sensitive/free-text data.
- Recovery drill verifies recoverability but does not modify user data.
- RC gate does not auto-deploy or auto-rollback.

## Deployment status
Public GitHub Pages deployment remains separately blocked by repository Pages configuration (issue #2). The application source and CI gates can still be completed and merged independently.

## Merge policy
v0.9 must not merge until final-head `verify` and Chromium E2E/Axe both pass. Any failure is fixed on this branch and re-run on the new final SHA.
