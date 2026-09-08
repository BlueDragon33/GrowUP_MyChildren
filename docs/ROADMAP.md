# Delivery roadmap

## Completed in Skeleton v1
- Lượt 01–20: repository/PWA shell, child model/profiles, 3–18 timeline, learning, skills, health, physical, nutrition, habits, assessment, portfolio, roadmap, reminders, local advisor, backup, responsive/offline and CI/Pages workflow.

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
- Lượt 32–35: schema migration, development cockpit, portable `.ics`, local-date correctness. **Completed in v0.2.0.**
- Lượt 36–40: screen privacy, development profile editor, attachment metadata, provider-neutral integration interfaces, static/PWA smoke gate. **Completed in v0.3.0.**
- Lượt 41–45: local family policy, reminder capability, backup integrity, age-stage templates, longitudinal family report. **Completed in v0.4.0.**
- Lượt 46–50: unified timeline, evidence links, family policy safeguards, safe exports, Chromium production gate. **Completed in v0.5.0.**
- Lượt 51–55: evidence repair, portable archive SHA-256, period filters, keyboard/focus hardening, deployment verification workflow. **Completed/implemented in v0.6.0; public Pages remains blocked by L31.**
- Lượt 56–60: consistency scanner, manual retention, neutral yearly summary, printable report, privacy/accessibility Axe gate. **Completed in v0.7.0.**
- Lượt 61–65: privacy-safe audit export, versioned taxonomy, family planning, encrypted backup, release/rollback hardening. **Completed in v0.8.0.**
- Lượt 66–70: versioned domain binding, selective family-plan `.ics`, privacy-safe search, recovery inspector/drill, reproducible RC gate. **Completed in v0.9.0.**
- Lượt 71–75: taxonomy coverage, family-plan conflict assistant, safe-search deep links, recovery history and one-entrypoint runtime consolidation. **Completed in v1.0.0 with final verify + Chromium/Axe PASS.**
- Lượt 76–80: child data portability map, 7/14/30-day workload windows, saved safe-search views, recovery schedule/checklist and runtime compatibility observation. **Completed in v1.1.0 with final PR gate + CI hậu merge PASS.**
- Lượt 81–85: safe-export wizard, neutral workload calendar, saved-search management, recovery reminder integration and six-flow compatibility evidence matrix. **Completed in stable v1.2.0; PR #13 final head `4c169fe104bdd766c628fa5454a43c18224fc066`, CI run `34133139602`, verify + Chromium/Axe PASS; merged main `483a6a9e9225da2641348686bcbe8e331ea9e821`.**
- Lượt 86: Safe-export manifest/checksum. **Completed in stable v1.3.0 with SHA-256 manifest and local verification; safe-export allowlists/privacy exclusions remain unchanged.**
- Lượt 87: Configurable family workload display bands. **Completed in stable v1.3.0 as local-only neutral minute thresholds/labels; no score/rank/performance classification.**
- Lượt 88: Saved-search folders/pinning/duplicate detection. **Completed in stable v1.3.0 while persisting normalized criteria only; no result/snippet cache.**
- Lượt 89: Recovery reminder lifecycle. **Completed in stable v1.3.0 with explicit complete/reschedule/remove operations, source/date lineage and metadata-only lifecycle history.**
- Lượt 90: Evidence-driven legacy retirement review. **Completed in stable v1.3.0 as review-only: full six-flow evidence plus runtime dependency graph are required; referenced/incomplete modules remain `retain`; no automatic deletion. PR #14 final head `9e9a17be87eec23919ba2a8ac50416cae196f91f`, CI run `34174215483` PASS both gates; code merged `9244e094c00c4d620a6ceaac6ced7de8f8dabdbc`; docs finalized on stable main `51e4a80609d40915106663e983dbfa1202fee228`, final post-doc CI `34174644985` PASS both gates. Pages remains separately blocked at Configure Pages by L31.**
- Lượt 91: Safe-export verification receipt history. **Completed in stable v1.4.0 with bounded 50-entry metadata-only history (`at`, `format`, `algorithm`, valid/invalid); raw checksum, file payload, child data and free-text are never persisted.**
- Lượt 92: Family workload display presets and reset. **Completed in stable v1.4.0 as local-only reversible neutral presets; no child-specific or performance/ranking semantics.**
- Lượt 93: Portable Saved Search criteria package. **Completed in stable v1.4.0 with format/version validation, preview-before-apply, safe dataset normalization, duplicate skipping and criteria-only persistence; no cached result/snippet payload.**
- Lượt 94: Recovery lifecycle calendar bridge. **Completed in stable v1.4.0 as explicit-selection `.ics` export preserving source/origin-date lineage metadata; no background calendar write, Google authorization, auto restore, child name or backup payload.**
- Lượt 95: Legacy retirement dry-run package. **Completed in stable v1.4.0 as report-only evidence/dependency/proposed-diff metadata; no removal is applied. PR #16 exact final head `dd78abd320779b0f1f37fce74b3d32ccb7ce6272`, CI run `34175696805` PASS both gates; merged main `612a9a8783a6bf02617f2725a4f53c7bb6114b9c`, post-merge CI `34175820489` PASS both gates. Pages run `34175820460` remains separately blocked at Configure Pages by L31.**
- Lượt 96: Verification receipt management. **Completed in stable v1.5.0 with local filter/export/confirmed-clear; receipt package remains bounded metadata-only and excludes raw checksums, source payload and child data.**
- Lượt 97: Custom workload preset library. **Completed in stable v1.5.0 with strict neutral-name/label validation, local-only storage and previewed import/export; child-linked keys and scoring/performance/health semantics are rejected.**
- Lượt 98: Saved-search criteria integrity. **Completed in stable v1.5.0 with SHA-256 manifest, tamper detection and metadata-only import verification receipts; safe-search normalization still strips results/snippets and unsafe datasets.**
- Lượt 99: Recovery `.ics` reconciliation preview. **Completed in stable v1.5.0 as read-only local-file comparison of id/date/completed/originDate; no external calendar access and no apply/change API.**
- Lượt 100: Bounded six-flow compatibility evidence persistence. **Completed in stable v1.5.0 with max 120 metadata records, dedupe by module+flow, runtime capture for Overview/Learning/Skills/Portfolio/mobile and Axe evidence only after actual Axe PASS in browser regression; retirement remains non-destructive. PR #18 exact final head `654eefa19ea4408c1bfcfe94c87faac92c33784d`, CI run `34177381954` PASS both gates; merged main `38f129c0d66118c53af03efd4846f51b6d6674d3`, post-merge CI `34177525276` PASS both gates. Pages run `34177525318` remains separately blocked at Configure Pages by L31.**
- Lượt 101: Metadata-only verification receipt package integrity/checksum and duplicate-safe receipt import preview. **Completed in stable v1.6.0 with SHA-256, integrity-before-preview/import, invalid/trùng filtering and bounded metadata-only apply.**
- Lượt 102: Custom workload preset integrity manifest plus conflict-resolution preview. **Completed in stable v1.6.0 with SHA-256 and explicit `skip`/`rename`; no silent overwrite and persisted preset is limited to id/name/config.**
- Lượt 103: Saved Search integrity receipt management. **Completed in stable v1.6.0 with local filter/export/confirmed-clear over bounded metadata-only history.**
- Lượt 104: Recovery reconciliation report export. **Completed in stable v1.6.0 for explicit user-selected rows only; report excludes child name/title/raw ICS, file changes invalidate old preview and there is still no apply/external calendar write.**
- Lượt 105: Compatibility evidence package export/import. **Completed in stable v1.6.0 with SHA-256 and module/flow/observed/active/timestamp validation; imported Axe evidence is intentionally rejected and must be regenerated by a real local Axe PASS; no legacy removal path. PR #20 exact final head `704509d83df38f3c0497b55adb2e5bf27d5a111c`, CI run `34202531673` PASS both gates; merged code main `1e0fb588baa4a83c91a445930214ef4165431d2c`, post-merge CI `34202894669` PASS both gates. Pages run `34202894688` remains separately blocked at Configure Pages by L31.**

## Next generated rounds
- Lượt 106: Receipt package import history and rollback-safe local undo for the last receipt import, storing only metadata deltas and never raw source payload/checksum.
- Lượt 107: Workload preset package import history with explicit undo of the last local import and deterministic conflict-decision audit metadata; still no child-linked scoring semantics.
- Lượt 108: Saved Search integrity receipt package SHA-256 and duplicate-safe receipt import preview, preserving metadata-only bounds.
- Lượt 109: Recovery reconciliation report integrity manifest plus local verification receipt; still report-only with no reminder/calendar mutation.
- Lượt 110: Compatibility evidence import audit/undo for non-Axe records and evidence freshness summary; Axe must always be regenerated locally and actual legacy retirement stays a separate exact-head full-gate change.
