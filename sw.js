const CACHE = 'growup-mychildren-v9';
const ASSETS = [
  './', './index.html', './app.webmanifest', './assets/icon.svg',
  './src/styles.css', './src/enhancements.css', './src/v4.css', './src/v5.css', './src/v6.css', './src/v7.css', './src/v8.css', './src/v9.css',
  './src/app.js', './src/enhancements.js', './src/v4.js', './src/v5.js', './src/v6.js', './src/v7.js', './src/v8.js', './src/v9.js', './src/a11y.js',
  './src/core/model.js', './src/core/store.js', './src/core/schema.js', './src/core/analytics.js',
  './src/core/calendar.js', './src/core/attachments.js', './src/core/integrations.js', './src/core/privacy.js',
  './src/core/roles.js', './src/core/reminders.js', './src/core/backup.js', './src/core/templates.js', './src/core/report.js',
  './src/core/timeline.js', './src/core/evidence.js', './src/core/family-policy.js', './src/core/export.js',
  './src/core/evidence-repair.js', './src/core/archive.js', './src/core/timeline-filter.js',
  './src/core/consistency.js', './src/core/retention.js', './src/core/yearly-summary.js', './src/core/print-report.js',
  './src/core/audit-explorer.js', './src/core/taxonomy.js', './src/core/family-planning.js', './src/core/encrypted-backup.js', './src/core/release.js',
  './src/core/domain-binding.js', './src/core/local-search.js', './src/core/recovery-inspector.js', './src/core/rc-gate.js',
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
