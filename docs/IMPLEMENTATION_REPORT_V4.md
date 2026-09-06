# GrowUP My Children — Implementation Report v0.4.0

## Scope
v0.4 adds local family-policy modeling, reminder due-state logic, backup integrity verification, optional age-stage goal templates and a privacy-conscious machine-readable family report.

## Completed
1. Schema v4 with backward migration from v1, v2 and v3.
2. Local family policy model with owner/parent/guardian/viewer roles and explicit permissions. This is not authentication.
3. Reminder-state engine for completed, overdue, today, upcoming and unscheduled items.
4. Notification capability/permission detection without claiming background push support.
5. Backup envelope with deterministic JSON serialization and SHA-256 integrity checksum.
6. Restore workflow verifies checksum first, previews schema and record counts, and requires explicit confirmation before replacing local data.
7. Age-stage optional goal templates across development domains. Templates remain suggestions and do not force a fixed educational/career path.
8. Longitudinal family report export in JSON. Health measurements are excluded by default; when explicitly included, free-text health notes are not exported by the report helper.
9. Sidebar utilities for integrity backup, checked restore and report export.
10. Learning page integration for optional stage templates and calendar integration for reminder summary.
11. PWA cache upgraded to v4 with every new runtime/core module included.
12. CI expanded with v4 unit tests and static runtime/cache checks.

## Security and privacy boundaries
- The SHA-256 checksum detects accidental or unauthorized changes to an exported backup; it does not encrypt the backup.
- Local role policy describes intended authorization rules but cannot establish identity without a real authentication provider.
- Browser notification permission is only a capability signal. v0.4 does not promise push delivery after the site is closed.
- Family JSON reports exclude health by default. Users should still treat report and backup files as sensitive family data.

## Compatibility
- Existing v1/v2/v3 local data migrates to v4.
- Existing storage key remains unchanged to avoid orphaning installed clients.
- Unsupported future schema versions are rejected rather than silently downgraded.

## Remaining platform dependencies
Authentication, encrypted cloud sync, fine-grained health authorization, Google Calendar OAuth, real push delivery and binary evidence storage remain separate platform rounds.

## Deployment
Source CI must pass before merge. GitHub Pages deployment is still dependent on enabling Pages with GitHub Actions in repository settings, tracked by issue #2.
