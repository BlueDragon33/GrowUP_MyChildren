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
- Lượt 76: Child-profile data portability map. **Implemented in v1.1.0 with explicit local-only / safe-export / encrypted-backup-only / future-cloud labels; no automatic cloud upload.**
- Lượt 77: Family-plan workload windows. **Implemented in v1.1.0 for 7/14/30-day neutral summaries; no child ranking or automatic rescheduling.**
- Lượt 78: Saved privacy-safe search views. **Implemented in v1.1.0; only normalized criteria are stored, never search result contents or unsafe datasets.**
- Lượt 79: Recovery drill schedule/checklist metadata. **Implemented in v1.1.0 with optional local reminder candidate metadata; no passphrase storage and no automatic restore.**
- Lượt 80: Runtime compatibility retirement evidence. **Implemented in v1.1.0 as selector/side-effect observation only; no v4–v9 module is removed without multi-flow regression evidence.**

## Next generated rounds
- Lượt 81: Portability export wizard that previews exactly which safe datasets will leave the device before download.
- Lượt 82: Family workload calendar heatmap using neutral time bands only, with keyboard-accessible text equivalent and no performance scoring.
- Lượt 83: Saved-search management with rename/reorder and explicit one-click reset to privacy-safe defaults.
- Lượt 84: Recovery drill due-state integration with existing reminder list, deduplicated by source/date and still local-only.
- Lượt 85: Compatibility evidence matrix collected across Overview/Learning/Skills/Portfolio/mobile/Axe flows; retire only modules proven unused across all gates.
