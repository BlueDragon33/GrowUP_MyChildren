const CACHE = 'growup-mychildren-v17';
const ASSETS = [
  './', './index.html', './app.webmanifest', './assets/icon.svg',
  './src/runtime.css', './src/styles.css', './src/enhancements.css', './src/v4.css', './src/v5.css', './src/v6.css', './src/v7.css', './src/v8.css', './src/v9.css', './src/v10.css', './src/v11.css', './src/v12.css', './src/v13.css', './src/v14.css', './src/v15.css', './src/v16.css',
  './src/runtime-entry.js', './src/app.js', './src/enhancements.js', './src/v4.js', './src/v5.js', './src/v6.js', './src/v7.js', './src/v8.js', './src/v9-runtime.js', './src/v9-compat.js', './src/v10-runtime.js', './src/v11-runtime.js', './src/v12-runtime.js', './src/v13-runtime.js', './src/v14-runtime.js', './src/v15-runtime.js', './src/v16-runtime.js', './src/v16-guard.js', './src/v17-runtime.js', './src/a11y.js',
  './src/core/model.js', './src/core/store.js', './src/core/schema.js', './src/core/analytics.js',
  './src/core/calendar.js', './src/core/attachments.js', './src/core/integrations.js', './src/core/privacy.js',
  './src/core/roles.js', './src/core/reminders.js', './src/core/backup.js', './src/core/templates.js', './src/core/report.js',
  './src/core/timeline.js', './src/core/evidence.js', './src/core/family-policy.js', './src/core/export.js',
  './src/core/evidence-repair.js', './src/core/archive.js', './src/core/timeline-filter.js',
  './src/core/consistency.js', './src/core/retention.js', './src/core/yearly-summary.js', './src/core/print-report.js',
  './src/core/audit-explorer.js', './src/core/taxonomy.js', './src/core/family-planning.js', './src/core/encrypted-backup.js', './src/core/release.js',
  './src/core/domain-binding.js', './src/core/local-search.js', './src/core/recovery-inspector.js', './src/core/rc-gate.js',
  './src/core/domain-coverage.js', './src/core/family-conflicts.js', './src/core/recovery-history.js',
  './src/core/portability-map.js', './src/core/family-workload.js', './src/core/saved-search.js', './src/core/recovery-schedule.js', './src/core/runtime-compatibility.js',
  './src/core/export-wizard.js', './src/core/export-integrity.js', './src/core/export-verification-history.js', './src/core/export-verification-management.js', './src/core/export-verification-package-integrity.js', './src/core/receipt-import-history.js',
  './src/core/workload-calendar.js', './src/core/workload-band-settings.js', './src/core/workload-presets.js', './src/core/workload-preset-library.js', './src/core/workload-preset-package-integrity.js', './src/core/workload-preset-import-history.js',
  './src/core/recovery-reminder.js', './src/core/recovery-reminder-lifecycle.js', './src/core/recovery-calendar-bridge.js', './src/core/recovery-ics-reconciliation.js', './src/core/recovery-reconciliation-report.js', './src/core/recovery-reconciliation-report-integrity.js',
  './src/core/saved-search-organizer.js', './src/core/saved-search-package.js', './src/core/saved-search-package-integrity.js', './src/core/saved-search-integrity-receipt-management.js', './src/core/saved-search-receipt-package-integrity.js',
  './src/core/compatibility-evidence.js', './src/core/compatibility-evidence-store.js', './src/core/compatibility-evidence-package.js', './src/core/compatibility-evidence-import-history.js', './src/core/retirement-review.js', './src/core/retirement-dry-run.js',
  './src/core/insights.js'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html'))));
});