# GrowUP My Children — Implementation Report v0.3.0

## Scope
This increment strengthens privacy presentation, child-development profiling, portfolio evidence metadata and provider-neutral integration contracts while keeping the app static/offline-first.

## Completed
1. Schema v3 with backward migration from v1 and v2.
2. Child records now include an `attachments` collection from creation time and after migration.
3. Screen-privacy mode using session state: health/nutrition pages and health summaries can be visually obscured without changing stored data.
4. Development-profile editor in the Assessment area for strengths, interests, support needs, target outcomes and family notes.
5. Portfolio evidence metadata editor for project/certificate/image/video/document/link references.
6. Attachment URL validation accepts only http/https references; no executable URL schemes are stored through the v3 helper.
7. Provider-neutral integration descriptors for local storage, Google Calendar and future cloud sync. No OAuth token, API key or secret is committed to source.
8. Calendar screen now reports integration boundaries while preserving `.ics` export.
9. PWA cache upgraded to v3 and includes every new runtime module.
10. Automated tests cover schema migration, attachment validation, integration scopes and privacy helpers.
11. Static smoke/accessibility gate checks Vietnamese document language, viewport, runtime assets, `aria-pressed` privacy state, safe external-link attributes and service-worker cache coverage.

## Privacy boundary
Screen privacy is a shoulder-surfing/presentation feature only. It does not encrypt localStorage and must not be described as data-at-rest protection. Real authentication, encrypted cloud sync and fine-grained medical-data authorization remain later platform rounds.

## Storage boundary
v0.3 stores attachment metadata and optional https links only. It does not upload file bytes. Binary/object storage will require a provider, authorization rules, quotas, deletion lifecycle and encryption decisions.

## Integration boundary
The provider layer describes capabilities and connection state but performs no external account login. Google Calendar OAuth and cloud authentication remain explicit later rounds so credentials are never hard-coded into the static site.

## Validation gate
Before merge, GitHub Actions must pass syntax checks for all v3 modules and all Node tests. True browser E2E remains pending; the v0.3 gate is static/PWA/accessibility regression coverage.
