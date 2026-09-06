# Architecture — GrowUP My Children

## 1. Product boundary
GrowUP My Children is a longitudinal family application for ages 3–18. It combines learning planning, skills, health records, physical activity, nutrition, habits, assessment, portfolio and future roadmap without collapsing them into one child-ranking score.

## 2. v1 architecture
- Static PWA, deployable on GitHub Pages.
- Zero runtime dependencies.
- ES modules in `src/`.
- Browser `localStorage` for v1 data persistence.
- Service worker for offline shell caching.
- JSON export/import for user-controlled backup.
- Rules-based local advisor; no child data is sent to external AI services in v1.

## 3. Modules
1. Family / child profile
2. Development timeline
3. Learning goals
4. Skills
5. Health records
6. Physical activity
7. Nutrition logs
8. Habits
9. Assessment summaries
10. Portfolio
11. Future roadmap
12. Calendar / reminders
13. Local development advisor
14. Backup / restore

## 4. Data ownership & privacy
Child and health data are sensitive. v1 deliberately avoids cloud sync and third-party analytics. A later backend must implement authentication, family roles, encryption in transit/at rest, auditable access, data export/deletion, and separate permissions for health data.

## 5. Future service boundaries
When cloud features are introduced, preserve module boundaries and expose them behind APIs rather than coupling UI directly to database tables. Suggested services: identity, family, child profile, learning, wellness, portfolio, roadmap, notifications, integrations, and AI orchestration.
