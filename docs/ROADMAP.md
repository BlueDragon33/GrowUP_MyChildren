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
- Lượt 106: Receipt package import history and rollback-safe local undo. **Completed in stable v1.7.0 with bounded metadata delta history and undo limited to the last managed import; no raw source payload/expected/actual checksum is stored.**
- Lượt 107: Workload preset package import history and explicit undo. **Completed in stable v1.7.0 with `skip`/`rename` source→resolved conflict audit plus signature-safe undo that preserves presets edited after import; neutral validation remains mandatory.**
- Lượt 108: Saved Search integrity receipt package SHA-256 and duplicate-safe receipt import. **Completed in stable v1.7.0 with integrity-before-preview/apply and bounded metadata-only persistence.**
- Lượt 109: Recovery reconciliation report integrity manifest and local verification receipt. **Completed in stable v1.7.0 as report-only SHA-256 verification; receipt keeps only timestamp/format/algorithm/result/rowCount and cannot mutate reminders/calendars.**
- Lượt 110: Compatibility evidence import audit/undo and freshness summary. **Completed in stable v1.7.0 for non-Axe deltas only; Axe remains local-rerun-only, freshness is advisory and actual legacy retirement remains separate. PR #22 exact final head `8c4bef435da4209d9cc6c0d69897fe6365b8b055`, CI run `34215399018` PASS verify + Chromium/Axe; merged main `d59680e4e1bcd122f6adc14ed9a21ede8db26cd7`, post-merge CI run `34215640236` PASS both gates. Pages run `34215640207` remains separately blocked at `Configure Pages` by L31/issue #2.**
- Lượt 111: Managed receipt import-history package export with SHA-256 and metadata-only portability. **Completed in stable v1.8.0 as export/verify/review read-only; package excludes raw source package, source manifest, expected/actual checksum, internal history id and child payload.**
- Lượt 112: Workload preset import-audit package export/integrity and read-only conflict review. **Completed in stable v1.8.0 with source→resolved metadata; package excludes preset config, internal signature, raw package and child-linked scoring semantics.**
- Lượt 113: Saved Search receipt import history with rollback-safe undo. **Completed in stable v1.8.0 with bounded exact-delta history/undo; direct v17 apply form is retired so managed path cannot be bypassed.**
- Lượt 114: Recovery reconciliation verification-receipt management. **Completed in stable v1.8.0 with filter/export/confirmed-clear over metadata-only receipts; report payload/raw checksum remain excluded.**
- Lượt 115: Compatibility evidence freshness policy and stale-evidence review gate. **Completed in stable v1.8.0 with bounded fresh-day policy, missing/stale review and explicit `retirementAllowed:false`/`actionsApplied:false`; Axe still requires actual local rerun. PR #23 exact final head `7fe1d358dc0fe32486ead63a74e087ba5799336c`, CI run `34216959939` PASS verify + Chromium/Axe; merged main `c0cfca3cdf261b462932a480ef56637efbf0d44e`, post-merge CI run `34217171141` PASS both gates. Pages run `34217171172` fails separately at `Configure Pages`; Upload/Deploy/Verify are skipped by L31/issue #2.**

## Next generated rounds
- Lượt 116: Receipt import-history package verification receipt management, metadata-only and bounded; no source package restoration.
- Lượt 117: Preset audit review filters and comparison summaries that remain read-only and neutral; no scoring semantics.
- Lượt 118: Saved Search receipt import-history portability package with SHA-256 while keeping undo local to managed state.
- Lượt 119: Recovery verification-receipt package integrity/verification with metadata-only history and no report/calendar mutation.
- Lượt 120: Compatibility freshness review export/integrity plus explicit local Axe recheck workflow; no automatic legacy retirement.
