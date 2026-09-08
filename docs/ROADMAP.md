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
- Lượt 90: Evidence-driven legacy retirement review. **Completed in stable v1.3.0 as review-only: full six-flow evidence plus runtime dependency graph are required; referenced/incomplete modules remain `retain`; no automatic deletion. PR #14 final head `9e9a17be87eec23919ba2a8ac50416cae196f91f`, CI run `34174215483` PASS both gates; merged main `9244e094c00c4d620a6ceaac6ced7de8f8dabdbc`, post-merge CI `34174310765` PASS both gates. Pages run `34174310745` remains separately blocked at Configure Pages by L31.**

## Next generated rounds
- Lượt 91: Safe-export verification receipt history storing only timestamp, format, algorithm and checksum result; never persist exported child payload or free-text preview.
- Lượt 92: Family workload display presets and reset workflow kept local-only, neutral and reversible; presets must not encode child performance or ranking semantics.
- Lượt 93: Portable saved-search criteria package with schema/version validation and duplicate-safe import preview; never include cached search results/snippets.
- Lượt 94: Recovery lifecycle calendar bridge for explicit user-selected reminder events, preserving lineage and preventing automatic restore or background calendar writes.
- Lượt 95: Legacy retirement dry-run package: candidate diff/dependency evidence report only; any actual removal remains a separate commit requiring full verify + Chromium/Axe on the exact removal head.
