import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('document exposes Vietnamese language, viewport and v6 runtime assets', async () => {
  const html = await read('index.html');
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /name="viewport"/);
  for (const asset of ['enhancements.css','enhancements.js','v4.css','v4.js','v5.css','v5.js','v6.css','v6.js']) {
    assert.ok(html.includes(asset), `index should load ${asset}`);
  }
});

test('privacy restore export and v6 accessibility controls expose safe actions', async () => {
  const enhancements = await read('src/enhancements.js');
  const v4 = await read('src/v4.js');
  const v5 = await read('src/v5.js');
  const v6 = await read('src/v6.js');
  assert.match(enhancements, /aria-pressed/);
  assert.match(enhancements, /rel="noopener noreferrer"/);
  for (const id of ['v4IntegrityBackup','v4RestoreBackup','v4ReportExport','v4NotificationPermission']) assert.ok(v4.includes(id));
  for (const id of ['v5MemberForm','v5EvidenceForm','v5Dataset','v5ExportCsv','v5ExportJson']) assert.ok(v5.includes(id));
  for (const id of ['v6PruneEvidence','v6ArchiveExport','v6ArchiveInspect','v6PeriodMode','v6PeriodDate']) assert.ok(v6.includes(id));
  assert.match(v6, /v6-skip-link/);
  assert.match(v6, /aria-modal/);
  assert.match(v6, /event\.key==='Escape'/);
  assert.match(v4, /includeHealth:false/);
  assert.match(v5, /Sức khỏe không nằm trong danh sách xuất nhanh/);
});

test('service worker caches every v6 runtime module', async () => {
  const sw = await read('sw.js');
  for (const asset of ['enhancements.js','v4.js','v5.js','v6.js','schema.js','analytics.js','calendar.js','attachments.js','integrations.js','privacy.js','roles.js','reminders.js','backup.js','templates.js','report.js','timeline.js','evidence.js','family-policy.js','export.js','evidence-repair.js','archive.js','timeline-filter.js']) {
    assert.ok(sw.includes(asset), `service worker should cache ${asset}`);
  }
  assert.match(sw, /growup-mychildren-v6/);
});

test('GitHub Pages workflow verifies deployed html manifest and service worker after deploy', async () => {
  const pages = await read('.github/workflows/pages.yml');
  assert.match(pages, /steps\.deployment\.outputs\.page_url/);
  assert.match(pages, /Verify deployed PWA/);
  assert.match(pages, /app\.webmanifest/);
  assert.match(pages, /sw\.js/);
});
