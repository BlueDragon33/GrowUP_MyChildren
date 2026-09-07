# GrowUP My Children — Implementation Report v1.0.0

## Scope
v1.0.0 implements rounds 71–75 on top of stable v0.9. The focus is taxonomy maintenance visibility, family-plan conflict awareness, search navigation, privacy-safe recovery history and a consolidated runtime bootstrap.

## Lượt 71 — Development-domain coverage
- Counts Learning, Skills and Portfolio records that are bound/unbound to taxonomy domains.
- Summaries can group counts by dataset and domain.
- The feature intentionally does not calculate performance percentage, developmental score or child rank.

## Lượt 72 — Family-plan conflict assistant
- Detects days containing multiple family-plan items and days exceeding a configurable daily planned-minute threshold.
- Suggests nearby dates with more remaining planned-time capacity.
- Suggestions are local calculations only; GrowUP does not automatically modify any plan or calendar.
- No priority judgment is made between children.

## Lượt 73 — Privacy-safe search deep links
- Extends the existing safe search with domain/date/dataset/child filters.
- Search results carry page/source metadata and can navigate to the corresponding child/page.
- After navigation, GrowUP attempts to visually focus the matching source record by title.
- Health, Nutrition, health notes and Portfolio notes remain outside the search index.

## Lượt 74 — Recovery history
- Stores a bounded checklist of recovery-drill metadata under settings.
- Allowed stored fields: timestamp, PASS/FAIL, encrypted-backup format and schema version.
- Passphrase, ciphertext, salt, IV, decrypted payload and detailed preview are never persisted by the history module.

## Lượt 75 — Runtime consolidation
Before v1.0, `index.html` loaded many JS and CSS layers directly. v1.0 changes the bootstrap to:
- one JavaScript entrypoint: `src/runtime-entry.js`;
- one stylesheet entrypoint: `src/runtime.css`.

The entrypoints import active compatibility layers internally in a defined order. This reduces HTML/bootstrap duplication while preserving behavior from v4–v10. Legacy modules are not deleted merely because they are old; future removal requires evidence that no active runtime path depends on them.

## Release profile
- App version: 1.0.0.
- Data schema: v5; no migration required for rounds 71–75.
- Service-worker cache: `growup-mychildren-v10`.
- Node: 22.x.
- Playwright: 1.55.0.
- Axe Playwright: 4.10.2.
- Stable rollback point: v0.9.0 commit `c7cdab1c2b5aedf4952d9f276bef6d444b27713a`.

## Test gates
- Unit tests cover domain coverage, family conflict detection, reschedule candidates, advanced safe-search filters/deep links and bounded recovery-history output.
- Static tests require exactly one HTML JavaScript entrypoint and one stylesheet entrypoint.
- Static dependency tests verify runtime import order, SW cache coverage, package syntax coverage and v1.0 release/cache consistency.
- Chromium E2E covers v10 coverage/conflict panels, advanced search deep links and record highlight, recovery-history rendering and 390px mobile layout.
- Axe overview audit waits for v8, v9 and v10 panels before checking serious/critical violations.
- Existing encrypted backup, destructive-action, privacy, v9 calendar/search/recovery and earlier regression tests remain in the suite.

## Safety/privacy boundaries
- Coverage and conflict summaries are operational metadata, not child-development judgments.
- Search deep links do not broaden the existing safe-search index.
- Recovery history is deliberately lossy and contains no recovery secrets or recovered data.
- Runtime consolidation changes bootstrap/dependency loading, not child data schema.

## Deployment
GitHub Pages remains blocked separately at repository configuration (`Settings → Pages → Source: GitHub Actions`), tracked by issue #2. This does not block source/CI completion.

## Merge policy
PR #11 must pass `verify` and Chromium E2E/Axe on the final documentation/code head. No failure is bypassed because a change is documentation-only.
