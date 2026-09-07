# Implementation report v1.1.0

## Scope
Rounds 76–80 extend the local-first family platform without changing data schema v5.

## Lượt 76 — Data portability map
- Adds an explicit module-by-module portability classification.
- `safe-export`: profile/learning/skills/portfolio metadata/attachment metadata.
- `encrypted-backup-only`: health, nutrition and audit metadata.
- `local-only`: family planning until a future authorized sync layer exists.
- Future-cloud labels are descriptive capability targets only; no upload is performed.

## Lượt 77 — Family workload windows
- Adds 7/14/30-day summaries of commitments, minutes, active days and average minutes per active day.
- No score, rank, percentile or comparison between children.
- No automatic rescheduling.

## Lượt 78 — Saved safe-search views
- Stores only normalized search criteria: name, query, child, allowlisted datasets, domain/date filters and limit.
- Unsafe datasets are dropped during normalization.
- Search results, snippets and sensitive dataset contents are never persisted in saved views.

## Lượt 79 — Recovery drill schedule
- Stores enabled flag, cadence, next date, reminder-enabled flag and three checklist booleans.
- Optional reminder output is a local candidate metadata object only.
- Passphrases are never stored and schedule actions never restore data automatically.

## Lượt 80 — Runtime compatibility evidence
- Adds a non-destructive observation snapshot for legacy runtime modules.
- A module can be `active-observed` or `not-observed-this-view`.
- A single snapshot is explicitly insufficient evidence to delete a legacy module.
- v1.1 removes no v4–v9 compatibility module; retirement requires evidence across multiple navigation/mobile/accessibility regression flows.

## Release profile
- App version: `1.1.0`
- Data schema: `5` (unchanged)
- Service Worker cache: `growup-mychildren-v11`
- Rollback: v1.0.0 merge commit `605c4948cbcc60164d8a34ba220558d39d8eeeb5`
- Node: 22.x
- Playwright: 1.55.0
- Axe Playwright: 4.10.2

## Gates
- Unit/static tests cover portability privacy boundaries, neutral workload summaries, saved-search allowlisting, recovery schedule metadata and compatibility observation.
- Browser tests cover rendered v11 panels, saved-search roundtrip, recovery schedule storage and 390px mobile overflow.
- Existing Chromium/Axe regression remains mandatory before merge.
- GitHub Pages remains a separate repository-setting blocker tracked by issue #2.
