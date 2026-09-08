import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('document exposes Vietnamese language, viewport and consolidated v1 runtime', async () => {
  const html = await read('index.html');
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /\.\/src\/runtime\.css/);
  assert.match(html, /\.\/src\/runtime-entry\.js/);
  assert.equal((html.match(/<script[^>]+src=/g)||[]).length,1);
  assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1);
  for (const old of ['src/v4.js','src/v8.js','src/v9-runtime.js','src/v9-compat.js']) assert.equal(html.includes(old),false,`${old} must not be a direct HTML entrypoint`);
});

test('v9 runtime keeps domain calendar search and recovery boundaries explicit', async () => {
  const v9 = await read('src/v9-runtime.js');
  const search = await read('src/core/local-search.js');
  const recovery = await read('src/core/recovery-inspector.js');
  const calendar = await read('src/core/calendar.js');
  for (const id of ['learningForm','skillForm','portfolioForm','v9FamilyIcsForm','v9SearchForm','v9RecoveryForm']) assert.ok(v9.includes(id));
  assert.match(v9, /event\.stopImmediatePropagation\(\)/);
  assert.match(v9, /growup_v9_resume_nav/);
  assert.match(calendar, /familyPlanItemsToIcs/);
  assert.doesNotMatch(calendar, /healthRecords|nutritionLogs/);
  assert.doesNotMatch(search, /healthRecords|nutritionLogs|\.note/);
  assert.match(search, /searchDeepLink/);
  assert.match(recovery, /runRecoveryDrill/);
  assert.doesNotMatch(recovery, /localStorage\.(?:setItem|getItem|removeItem|clear)|sessionStorage\.(?:setItem|getItem|removeItem|clear)/);
});

test('service worker caches active v17 runtime and waits for explicit update approval', async () => {
  const sw = await read('sw.js');
  for (const asset of ['runtime-entry.js','runtime.css','v15-runtime.js','v16-runtime.js','v17-runtime.js','export-verification-package-integrity.js','receipt-import-history.js','workload-preset-package-integrity.js','workload-preset-import-history.js','saved-search-integrity-receipt-management.js','saved-search-receipt-package-integrity.js','recovery-reconciliation-report.js','recovery-reconciliation-report-integrity.js','compatibility-evidence-package.js','compatibility-evidence-import-history.js','v9-runtime.js','v9-compat.js']) assert.ok(sw.includes(asset));
  assert.match(sw, /growup-mychildren-v17/);
  assert.match(sw, /event\.data\?\.type === 'SKIP_WAITING'/);
  const installBlock = sw.match(/self\.addEventListener\('install',[\s\S]*?\n\}\);/)?.[0] || '';
  assert.doesNotMatch(installBlock, /skipWaiting/);
});

test('package and CI pin the current v1.7 release-candidate tooling profile', async () => {
  const pkg = JSON.parse(await read('package.json'));
  const ci = await read('.github/workflows/ci.yml');
  const release = await read('src/core/release.js');
  const rc = await read('src/core/rc-gate.js');
  assert.equal(pkg.version,'1.7.0');
  assert.equal(pkg.engines.node,'22.x');
  assert.equal(pkg.devDependencies['@playwright/test'],'1.55.0');
  assert.equal(pkg.devDependencies['@axe-core/playwright'],'4.10.2');
  for (const path of ['src/runtime-entry.js','src/v15-runtime.js','src/v16-runtime.js','src/v17-runtime.js','src/core/export-verification-package-integrity.js','src/core/receipt-import-history.js','src/core/workload-preset-package-integrity.js','src/core/workload-preset-import-history.js','src/core/saved-search-integrity-receipt-management.js','src/core/saved-search-receipt-package-integrity.js','src/core/recovery-reconciliation-report.js','src/core/recovery-reconciliation-report-integrity.js','src/core/compatibility-evidence-package.js','src/core/compatibility-evidence-import-history.js']) assert.ok(pkg.scripts.check.includes(path));
  assert.match(ci, /@playwright\/test@1\.55\.0/);
  assert.match(ci, /@axe-core\/playwright@4\.10\.2/);
  assert.match(ci, /node-version: 22/);
  assert.match(release, /APP_VERSION = '1\.7\.0'/);
  assert.match(release, /4e579b512b6fff64161350b7ca5df51b17375f1e/);
  assert.match(rc, /growup-mychildren-v17/);
  assert.match(rc, /4e579b512b6fff64161350b7ca5df51b17375f1e/);
});

test('existing privacy and deployment gates remain present', async () => {
  const v4 = await read('src/v4.js');
  const v5 = await read('src/v5.js');
  const v7 = await read('src/v7.js');
  const v8 = await read('src/v8.js');
  const encrypted = await read('src/core/encrypted-backup.js');
  const pages = await read('.github/workflows/pages.yml');
  assert.match(v4, /includeHealth:false/);
  assert.match(v5, /Sức khỏe không nằm trong danh sách xuất nhanh/);
  assert.match(v7, /includeHealth:false/);
  assert.match(v7, /confirm\(/);
  assert.match(v8, /Khôi phục sẽ thay thế dữ liệu cục bộ hiện tại/);
  assert.match(encrypted, /AES-GCM/);
  assert.match(encrypted, /PBKDF2/);
  assert.doesNotMatch(encrypted, /localStorage|sessionStorage/);
  assert.match(pages, /Verify deployed PWA/);
  assert.match(pages, /app\.webmanifest/);
  assert.match(pages, /sw\.js/);
});
