import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('document exposes Vietnamese language, viewport and v4 runtime assets', async () => {
  const html = await read('index.html');
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /src\/enhancements\.css/);
  assert.match(html, /src\/enhancements\.js/);
  assert.match(html, /src\/v4\.css/);
  assert.match(html, /src\/v4\.js/);
});

test('privacy and v4 utility controls expose accessibility and safe actions', async () => {
  const enhancements = await read('src/enhancements.js');
  const v4 = await read('src/v4.js');
  assert.match(enhancements, /aria-pressed/);
  assert.match(enhancements, /id="v3ProfileForm"/);
  assert.match(enhancements, /id="v3AttachmentForm"/);
  assert.match(enhancements, /rel="noopener noreferrer"/);
  for (const id of ['v4IntegrityBackup','v4RestoreBackup','v4ReportExport','v4NotificationPermission']) {
    assert.ok(v4.includes(id), `v4 runtime should expose ${id}`);
  }
  assert.match(v4, /checksum/i);
  assert.match(v4, /includeHealth:false/);
});

test('service worker caches every v4 runtime module', async () => {
  const sw = await read('sw.js');
  for (const asset of ['enhancements.js','v4.js','schema.js','analytics.js','calendar.js','attachments.js','integrations.js','privacy.js','roles.js','reminders.js','backup.js','templates.js','report.js']) {
    assert.ok(sw.includes(asset), `service worker should cache ${asset}`);
  }
  assert.match(sw, /growup-mychildren-v4/);
});
