const CACHE = 'growup-mychildren-v5';
const ASSETS = [
  './', './index.html', './app.webmanifest', './assets/icon.svg',
  './src/styles.css', './src/enhancements.css', './src/v4.css', './src/v5.css',
  './src/app.js', './src/enhancements.js', './src/v4.js', './src/v5.js',
  './src/core/model.js', './src/core/store.js', './src/core/schema.js', './src/core/analytics.js',
  './src/core/calendar.js', './src/core/attachments.js', './src/core/integrations.js', './src/core/privacy.js',
  './src/core/roles.js', './src/core/reminders.js', './src/core/backup.js', './src/core/templates.js', './src/core/report.js',
  './src/core/timeline.js', './src/core/evidence.js', './src/core/family-policy.js', './src/core/export.js',
  './src/core/insights.js'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
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
