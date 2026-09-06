import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('document exposes Vietnamese language, viewport and v3 enhancement assets', async () => {
  const html = await read('index.html');
  assert.match(html, /<html lang="vi">/);
  assert.match(html, /name="viewport"/);
  assert.match(html, /src\/enhancements\.css/);
  assert.match(html, /src\/enhancements\.js/);
});

test('v3 controls include accessible privacy state and labeled forms', async () => {
  const source = await read('src/enhancements.js');
  assert.match(source, /aria-pressed/);
  assert.match(source, /id="v3ProfileForm"/);
  assert.match(source, /id="v3AttachmentForm"/);
  assert.match(source, /rel="noopener noreferrer"/);
});

test('service worker caches every v3 runtime module', async () => {
  const sw = await read('sw.js');
  for (const asset of ['enhancements.js','schema.js','analytics.js','calendar.js','attachments.js','integrations.js','privacy.js']) {
    assert.ok(sw.includes(asset), `service worker should cache ${asset}`);
  }
  assert.match(sw, /growup-mychildren-v3/);
});
