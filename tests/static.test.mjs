import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('document exposes Vietnamese language, viewport and v8 runtime assets', async () => {
  const html = await read('index.html');
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /name="viewport"/);
  for (const asset of ['enhancements.css','enhancements.js','v4.css','v4.js','v5.css','v5.js','v6.css','v6.js','v7.css','v7.js','v8.css','v8.js','a11y.js']) {
    assert.ok(html.includes(asset), `index should load ${asset}`);
  }
});

test('privacy restore export retention encryption and accessibility controls expose safe actions', async () => {
  const enhancements = await read('src/enhancements.js');
  const v4 = await read('src/v4.js');
  const v5 = await read('src/v5.js');
  const v6 = await read('src/v6.js');
  const v7 = await read('src/v7.js');
  const v8 = await read('src/v8.js');
  const encrypted = await read('src/core/encrypted-backup.js');
  const audit = await read('src/core/audit-explorer.js');
  const a11y = await read('src/a11y.js');
  assert.match(enhancements, /aria-pressed/);
  assert.match(enhancements, /rel="noopener noreferrer"/);
  for (const id of ['v4IntegrityBackup','v4RestoreBackup','v4ReportExport','v4NotificationPermission']) assert.ok(v4.includes(id));
  for (const id of ['v5MemberForm','v5EvidenceForm','v5Dataset','v5ExportCsv','v5ExportJson']) assert.ok(v5.includes(id));
  for (const id of ['v6PruneEvidence','v6ArchiveExport','v6ArchiveInspect','v6PeriodMode','v6PeriodDate']) assert.ok(v6.includes(id));
  for (const id of ['v7RetentionForm','v7RetentionRemove','v7PrintForm']) assert.ok(v7.includes(id));
  for (const id of ['v8AuditJson','v8AuditCsv','v8TaxonomyForm','v8FamilyPlanForm','v8EncryptForm','v8DecryptForm','v8CheckUpdate','v8ApplyUpdate']) assert.ok(v8.includes(id));
  assert.match(v7, /includeHealth:false/);
  assert.match(v7, /confirm\(/);
  assert.match(v8, /decryptPortableBackup/);
  assert.match(v8, /Khôi phục sẽ thay thế dữ liệu cục bộ hiện tại/);
  assert.match(v8, /confirm\(/);
  assert.match(encrypted, /AES-GCM/);
  assert.match(encrypted, /PBKDF2/);
  assert.match(encrypted, /210000/);
  assert.doesNotMatch(encrypted, /localStorage|sessionStorage/);
  assert.match(audit, /SAFE_FIELDS/);
  assert.doesNotMatch(audit, /height|weight|healthRecords|nutritionLogs/);
  assert.match(a11y, /v6-skip-link/);
  assert.match(a11y, /aria-modal/);
  assert.match(a11y, /event\.key !== 'Escape'/);
  assert.match(a11y, /observer\.observe\(document\.body/);
  assert.match(v4, /includeHealth:false/);
  assert.match(v5, /Sức khỏe không nằm trong danh sách xuất nhanh/);
});

test('service worker caches every v8 runtime module and waits for explicit update approval', async () => {
  const sw = await read('sw.js');
  for (const asset of ['enhancements.js','v4.js','v5.js','v6.js','v7.js','v8.js','a11y.js','schema.js','analytics.js','calendar.js','attachments.js','integrations.js','privacy.js','roles.js','reminders.js','backup.js','templates.js','report.js','timeline.js','evidence.js','family-policy.js','export.js','evidence-repair.js','archive.js','timeline-filter.js','consistency.js','retention.js','yearly-summary.js','print-report.js','audit-explorer.js','taxonomy.js','family-planning.js','encrypted-backup.js','release.js']) {
    assert.ok(sw.includes(asset), `service worker should cache ${asset}`);
  }
  assert.match(sw, /growup-mychildren-v8/);
  assert.match(sw, /event\.data\?\.type === 'SKIP_WAITING'/);
  const installBlock = sw.match(/self\.addEventListener\('install',[\s\S]*?\n\}\);/)?.[0] || '';
  assert.doesNotMatch(installBlock, /skipWaiting/);
});

test('package verification includes every v8 runtime and core module', async () => {
  const pkg = JSON.parse(await read('package.json'));
  assert.equal(pkg.version,'0.8.0');
  for (const path of ['src/v8.js','src/core/audit-explorer.js','src/core/taxonomy.js','src/core/family-planning.js','src/core/encrypted-backup.js','src/core/release.js']) {
    assert.ok(pkg.scripts.check.includes(path), `npm check should include ${path}`);
  }
});

test('GitHub Pages workflow verifies deployed html manifest and service worker after deploy', async () => {
  const pages = await read('.github/workflows/pages.yml');
  assert.match(pages, /steps\.deployment\.outputs\.page_url/);
  assert.match(pages, /Verify deployed PWA/);
  assert.match(pages, /app\.webmanifest/);
  assert.match(pages, /sw\.js/);
});
