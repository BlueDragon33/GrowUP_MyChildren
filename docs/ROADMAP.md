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
- Lượt 81: Portability export wizard. **Implemented in v1.2.0 with mandatory unchanged preview before download, child/dataset/record counts and per-dataset field allowlists; Health/Nutrition/free-text ngoài allowlist are excluded. Awaiting final CI/merge gate.**
- Lượt 82: Family workload calendar heatmap. **Implemented in v1.2.0 with neutral minute bands and keyboard/screen-reader text equivalent; no performance score/rank. Awaiting final CI/merge gate.**
- Lượt 83: Saved-search management. **Implemented in v1.2.0 with rename/reorder and confirmed reset to privacy-safe defaults while storing criteria only. Awaiting final CI/merge gate.**
- Lượt 84: Recovery drill reminder integration. **Implemented in v1.2.0 with explicit child target, existing reminder-list integration and source/date deduplication; local-only. Awaiting final CI/merge gate.**
- Lượt 85: Compatibility evidence matrix. **Implemented in v1.2.0 with required Overview/Learning/Skills/Portfolio/mobile/Axe flows; no module can be retired on incomplete evidence or if active anywhere. Awaiting final CI/merge gate.**

## Next generated rounds
- Lượt 86: Safe-export manifest/checksum so recipients can verify export integrity without revealing extra child data.
- Lượt 87: Configurable family workload display bands stored locally, with neutral labels and hard guard against child scoring/ranking.
- Lượt 88: Saved-search folders/pinning and duplicate detection while keeping all saved objects criteria-only.
- Lượt 89: Recovery reminder lifecycle bridge for complete/reschedule/remove actions while preserving source/date lineage and explicit user control.
- Lượt 90: Evidence-driven first legacy retirement candidate review; remove code only if full 6-flow matrix + static dependency graph + final browser/Axe gate prove it unused.
