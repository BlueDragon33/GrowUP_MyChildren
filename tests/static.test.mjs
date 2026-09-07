import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('document exposes Vietnamese language, viewport and v9 runtime assets', async () => {
  const html = await read('index.html');
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /name="viewport"/);
  for (const asset of ['enhancements.css','enhancements.js','v4.css','v4.js','v5.css','v5.js','v6.css','v6.js','v7.css','v7.js','v8.css','v8.js','v9.css','v9-runtime.js','v9-compat.js','a11y.js']) {
    assert.ok(html.includes(asset), `index should load ${asset}`);
  }
  assert.equal(html.includes('src/v9.js'),false,'superseded v9.js must not be loaded');
});

test('v9 runtime keeps domain calendar search and recovery boundaries explicit', async () => {
  const v9 = await read('src/v9-runtime.js');
  const search = await read('src/core/local-search.js');
  const recovery = await read('src/core/recovery-inspector.js');
  const calendar = await read('src/core/calendar.js');
  for (const id of ['learningForm','skillForm','portfolioForm','v9FamilyIcsForm','v9SearchForm','v9RecoveryForm']) assert.ok(v9.includes(id));
  assert.match(v9, /event\.stopImmediatePropagation\(\)/);
  assert.match(v9, /bindDevelopmentDomain/);
  assert.match(v9, /growup_v9_resume_nav/);
  assert.match(v9, /sessionStorage\.setItem\(RESUME_KEY/);
  assert.match(v9, /sessionStorage\.removeItem\(RESUME_KEY\)/);
  assert.match(calendar, /familyPlanItemsToIcs/);
  assert.match(calendar, /X-GROWUP-PLANNED-MINUTES/);
  assert.doesNotMatch(calendar, /healthRecords|nutritionLogs/);
  assert.match(search, /SEARCH_DATASETS/);
  assert.doesNotMatch(search, /healthRecords|nutritionLogs/);
  assert.doesNotMatch(search, /\.note/);
  assert.match(recovery, /runRecoveryDrill/);
  assert.doesNotMatch(recovery, /localStorage\.(?:setItem|getItem|removeItem|clear)|sessionStorage\.(?:setItem|getItem|removeItem|clear)/);
  assert.match(recovery, /preview/);
});

test('service worker caches every active v9 runtime module and waits for explicit update approval', async () => {
  const sw = await read('sw.js');
  for (const asset of ['v7.js','v8.js','v9-runtime.js','v9-compat.js','domain-binding.js','local-search.js','recovery-inspector.js','rc-gate.js','encrypted-backup.js','release.js']) {
    assert.ok(sw.includes(asset), `service worker should cache ${asset}`);
  }
  assert.equal(sw.includes("'./src/v9.js'"),false,'service worker must not cache superseded v9.js');
  assert.match(sw, /growup-mychildren-v9/);
  assert.match(sw, /event\.data\?\.type === 'SKIP_WAITING'/);
  const installBlock = sw.match(/self\.addEventListener\('install',[\s\S]*?\n\}\);/)?.[0] || '';
  assert.doesNotMatch(installBlock, /skipWaiting/);
});

test('package and CI pin the v9 release-candidate tooling profile', async () => {
  const pkg = JSON.parse(await read('package.json'));
  const ci = await read('.github/workflows/ci.yml');
  const release = await read('src/core/release.js');
  const rc = await read('src/core/rc-gate.js');
  const compat = await read('src/v9-compat.js');
  assert.equal(pkg.version,'0.9.0');
  assert.equal(pkg.engines.node,'22.x');
  assert.equal(pkg.devDependencies['@playwright/test'],'1.55.0');
  assert.equal(pkg.devDependencies['@axe-core/playwright'],'4.10.2');
  for (const path of ['src/v9-runtime.js','src/v9-compat.js','src/core/domain-binding.js','src/core/local-search.js','src/core/recovery-inspector.js','src/core/rc-gate.js']) assert.ok(pkg.scripts.check.includes(path));
  assert.equal(pkg.scripts.check.includes('src/v9.js'),false);
  assert.match(ci, /@playwright\/test@1\.55\.0/);
  assert.match(ci, /@axe-core\/playwright@4\.10\.2/);
  assert.match(ci, /node-version: 22/);
  assert.match(release, /APP_VERSION = '0\.9\.0'/);
  assert.match(release, /241653d6fb12f021ebd20704144e47a5a12cc8fd/);
  assert.match(rc, /growup-mychildren-v9/);
  assert.match(rc, /playwrightVersion:'1\.55\.0'/);
  assert.match(compat, /Đã xem v\$\{APP_VERSION\}/);
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
