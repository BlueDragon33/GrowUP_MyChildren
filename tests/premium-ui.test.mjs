import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('premium UI is loaded after feature runtimes and before accessibility enhancer', async () => {
  const entry = await read('src/runtime-entry.js');
  const premium = entry.indexOf("import './premium-ui.js';");
  const v110 = entry.indexOf("import './v110-runtime.js';");
  const a11y = entry.indexOf("import './a11y.js';");
  assert.ok(premium > v110, 'premium UI must decorate the final feature runtime DOM');
  assert.ok(a11y > premium, 'accessibility enhancer must see the premium DOM');
});

test('premium UI assets are part of the public CSS entrypoint and offline precache', async () => {
  const css = await read('src/runtime.css');
  const sw = await read('sw.js');
  assert.match(css, /premium-ui\.css/);
  assert.match(sw, /\.\/src\/premium-ui\.css/);
  assert.match(sw, /\.\/src\/premium-ui\.js/);
});

test('premium UI remains presentation-only and reads the established local state', async () => {
  const js = await read('src/premium-ui.js');
  assert.match(js, /growup_mychildren_v1/);
  assert.match(js, /localStorage\.getItem/);
  assert.doesNotMatch(js, /localStorage\.setItem/);
  assert.doesNotMatch(js, /fetch\s*\(/);
  assert.doesNotMatch(js, /XMLHttpRequest|sendBeacon|WebSocket/);
  assert.match(js, /data-premium-nav/);
  assert.match(js, /premium-dashboard/);
});

test('premium dashboard CSS contains desktop, tablet and mobile layout boundaries', async () => {
  const css = await read('src/premium-ui.css');
  assert.match(css, /premium-dashboard-top/);
  assert.match(css, /premium-dashboard-mid/);
  assert.match(css, /premium-dashboard-bottom/);
  assert.match(css, /@media \(max-width: 1320px\)/);
  assert.match(css, /@media \(max-width: 1080px\)/);
  assert.match(css, /@media \(max-width: 760px\)/);
});
