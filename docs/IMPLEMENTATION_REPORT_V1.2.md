# GrowUP My Children — Implementation Report v1.2.0

## Scope
v1.2.0 implements rounds 81–85 on top of stable v1.1.0. The focus is controlled export, workload visualization, saved-search management, recovery-reminder integration and evidence-driven compatibility retirement.

## Lượt 81 — Safe-export wizard
- Users explicitly select child profiles and safe datasets.
- Preview shows child count, dataset count, record count and the exact field allowlist per dataset.
- Download remains disabled until a valid preview has been generated.
- Any change in child/dataset selection invalidates the previous preview and requires another preview before download.
- Safe export package format: `growup-safe-export-v2`.
- Health/Nutrition are not accepted datasets.
- Fields outside each allowlist are removed; Portfolio free-text `note` is deliberately excluded.

## Lượt 82 — Family workload calendar
- Month calendar aggregates family-plan minutes per day.
- Bands are descriptive only: none, up to 60 minutes, 61–180 minutes, over 180 minutes.
- No score, ranking, quality judgment or child comparison is generated.
- Visual heatmap is decorative/aria-hidden; a keyboard-focusable text list provides equivalent date/items/minutes/band information.

## Lượt 83 — Saved-search management
- Existing saved safe-search views can be renamed and reordered.
- Reset requires explicit confirmation.
- Reset restores the safe dataset criteria boundary and removes saved views.
- Stored objects continue to contain criteria only; result rows, snippets and unsafe datasets are not cached.

## Lượt 84 — Recovery reminder integration
- Recovery schedule can be inserted into the existing child reminder list only after selecting a target child profile.
- Created reminders use `source: recovery-drill` and `type: recovery`.
- Same source/date is deduplicated rather than creating another reminder.
- Reminder state uses the existing reminder engine (overdue/today/upcoming/completed).
- No passphrase is stored; the reminder never runs recovery or restore automatically.

## Lượt 85 — Compatibility evidence matrix
- Required flows: Overview, Learning, Skills, Portfolio, mobile and Axe.
- A module is retirement-eligible only when all six flows were observed and it was inactive in every flow.
- Missing even one flow prevents retirement eligibility.
- Active evidence in any flow prevents retirement eligibility.
- v1.2 does not remove any legacy module automatically.
- `legacyModuleDefinitions()` exposes a read-only copy of production selector definitions so E2E evidence collection cannot silently drift from runtime definitions.

## Release profile
- App version: 1.2.0.
- Data schema: v5, unchanged.
- Service-worker cache: `growup-mychildren-v12`.
- Node: 22.x.
- Playwright: 1.55.0.
- Axe Playwright: 4.10.2.
- Stable rollback: v1.1.0 main commit `359ea99f041654108c517d5c16be5e819932bb64`.

## Test coverage
Unit/static tests verify:
- safe export field allowlists and omission of health/nutrition/free-text;
- workload minute-band semantics without score/rank fields;
- saved-search rename/reorder/reset and unsafe-dataset rejection;
- recovery reminder creation and source/date deduplication;
- six-flow retirement eligibility semantics;
- runtime/SW/package/release/RC consistency.

Chromium E2E verifies:
- preview → download safe export and absence of free-text/health content;
- workload visual bands plus keyboard-focusable text equivalent;
- saved-search rename/reorder/reset persistence;
- recovery reminder creation and deduplication in local state;
- compatibility evidence collection across Overview/Learning/Skills/Portfolio/mobile/Axe;
- populated overview Axe scan after all v8–v12 panels are visible.

## Deployment boundary
GitHub Pages remains independent of source readiness. Issue #2 is still open because repository Pages has not been enabled with GitHub Actions as the source. Source CI must not be treated as proof that a public Pages URL is live.

## Merge policy
v1.2 must not merge until both `verify` and Chromium E2E/Axe pass on the exact final PR head. Any failure is fixed on the feature branch rather than bypassed.
