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
- Lượt 66–70: versioned domain binding, selective family-plan `.ics`, privacy-safe search, recovery inspector/drill, reproducible RC gate. **Completed in v0.9.0; verify + 14/14 Chromium E2E/Axe passed before merge.**
- Lượt 71: Development-domain coverage dashboard. **Implemented in v1.0.0 with bound/unbound counts by dataset/domain only; no child score/rank/comparison.**
- Lượt 72: Family-plan conflict assistant. **Implemented in v1.0.0 with same-day/overload detection and nearby lighter-date suggestions; no automatic calendar changes.**
- Lượt 73: Privacy-safe search deep links and advanced filters. **Implemented in v1.0.0 with child/domain/date/dataset filters and source-page navigation/highlight while preserving the safe index allowlist.**
- Lượt 74: Backup recovery-history checklist. **Implemented in v1.0.0; stores only timestamp, PASS/FAIL, format and schema metadata with bounded history.**
- Lượt 75: Runtime consolidation and release hygiene. **Implemented in v1.0.0: HTML now loads one JS entrypoint and one CSS entrypoint; v4–v10 become internal compatibility dependencies; SW/package/release dependency gates updated. Final CI/Axe required before merge.**

## Next generated rounds
- Lượt 76: Child-profile data portability map showing which modules are local-only, safe-exportable, encrypted-backup-only or future-cloud-capable.
- Lượt 77: Family-plan workload windows (7/14/30 days) with neutral capacity summaries and no child ranking.
- Lượt 78: Saved privacy-safe search views and quick filters stored locally without caching result contents or sensitive datasets.
- Lượt 79: Recovery drill schedule/checklist metadata with optional local reminder creation; still no passphrase storage or automatic restore.
- Lượt 80: Runtime compatibility retirement plan: instrument active legacy modules, identify genuinely unused v4–v9 code paths, remove only evidence-proven dead paths, then run full desktop/mobile/Axe regression.
