import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { recoveryHistory } from '../src/core/recovery-history.js';

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('index exposes exactly one javascript and one stylesheet entrypoint',async()=>{
  const html=await read('index.html');
  const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m)=>m[1]);
  const styles=[...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((m)=>m[1]);
  assert.deepEqual(scripts,['./src/runtime-entry.js']);
  assert.deepEqual(styles,['./src/runtime.css']);
});

test('runtime entry imports compatibility layers once and in release order',async()=>{
  const runtime=await read('src/runtime-entry.js');
  const expected=['./app.js','./enhancements.js','./v4.js','./v5.js','./v6.js','./v7.js','./v8.js','./v9-runtime.js','./v9-compat.js','./v10-runtime.js','./v11-runtime.js','./v12-runtime.js','./a11y.js'];
  for(const path of expected) assert.equal((runtime.match(new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length,1,`${path} should be imported exactly once`);
});

test('runtime css imports each active stylesheet once',async()=>{
  const css=await read('src/runtime.css');
  for(const name of ['styles.css','enhancements.css','v4.css','v5.css','v6.css','v7.css','v8.css','v9.css','v10.css','v11.css','v12.css']) assert.equal((css.match(new RegExp(name.replace('.','\\.'),'g'))||[]).length,1);
});

test('service worker and package agree on v1.2 runtime modules and cache',async()=>{
  const sw=await read('sw.js');
  const pkg=JSON.parse(await read('package.json'));
  const release=await read('src/core/release.js');
  const rc=await read('src/core/rc-gate.js');
  assert.equal(pkg.version,'1.2.0');
  assert.match(sw,/growup-mychildren-v12/);
  for(const path of ['runtime-entry.js','runtime.css','v12-runtime.js','export-wizard.js','workload-calendar.js','saved-search.js','recovery-reminder.js','compatibility-evidence.js']) assert.ok(sw.includes(path));
  for(const path of ['src/runtime-entry.js','src/v12-runtime.js','src/core/export-wizard.js','src/core/workload-calendar.js','src/core/saved-search.js','src/core/recovery-reminder.js','src/core/compatibility-evidence.js']) assert.ok(pkg.scripts.check.includes(path));
  assert.match(release,/APP_VERSION = '1\.2\.0'/);
  assert.match(release,/359ea99f041654108c517d5c16be5e819932bb64/);
  assert.match(rc,/growup-mychildren-v12/);
});

test('v10 privacy boundaries keep safe search and recovery-history outputs constrained',async()=>{
  const search=await read('src/core/local-search.js');
  const conflicts=await read('src/core/family-conflicts.js');
  assert.doesNotMatch(search,/healthRecords|nutritionLogs|\.note/);
  assert.doesNotMatch(conflicts,/score|rank|auto.*calendar/i);
  const history=recoveryHistory({recoveryDrillHistory:[{at:'2026-09-07T01:00:00.000Z',status:'PASS',format:'fmt',schemaVersion:5,extra:'omit'}]});
  assert.deepEqual(Object.keys(history[0]).sort(),['at','format','schemaVersion','status']);
  assert.equal('extra' in history[0],false);
});
