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
  const expected=['./app.js','./enhancements.js','./v4.js','./v5.js','./v6.js','./v7.js','./v8.js','./v9-runtime.js','./v9-compat.js','./v10-runtime.js','./v11-runtime.js','./v12-runtime.js','./v13-runtime.js','./v14-runtime.js','./v15-runtime.js','./v16-runtime.js','./v16-guard.js','./v17-runtime.js','./v18-runtime.js','./v19-runtime.js','./a11y.js'];
  for(const path of expected) assert.equal((runtime.match(new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length,1,`${path} should be imported exactly once`);
  const positions=expected.map((path)=>runtime.indexOf(path));
  for(let index=1;index<positions.length;index+=1)assert.ok(positions[index]>positions[index-1],`${expected[index]} should follow ${expected[index-1]}`);
});

test('runtime css imports each active stylesheet once',async()=>{
  const css=await read('src/runtime.css');
  for(const name of ['styles.css','enhancements.css','v4.css','v5.css','v6.css','v7.css','v8.css','v9.css','v10.css','v11.css','v12.css','v13.css','v14.css','v15.css','v16.css']) assert.equal((css.match(new RegExp(name.replace('.','\\.'),'g'))||[]).length,1);
});

test('service worker and package agree on v1.9 runtime modules and cache',async()=>{
  const sw=await read('sw.js');
  const pkg=JSON.parse(await read('package.json'));
  const release=await read('src/core/release.js');
  const rc=await read('src/core/rc-gate.js');
  assert.equal(pkg.version,'1.9.0');
  assert.match(sw,/growup-mychildren-v19/);
  for(const path of ['runtime-entry.js','runtime.css','v18-runtime.js','v19-runtime.js','receipt-import-history-package-verification-receipts.js','workload-preset-import-audit-review.js','saved-search-receipt-import-history-package-integrity.js','recovery-reconciliation-verification-receipt-package-integrity.js','compatibility-evidence-freshness-review-package.js']) assert.ok(sw.includes(path));
  for(const path of ['src/runtime-entry.js','src/v18-runtime.js','src/v19-runtime.js','src/core/receipt-import-history-package-verification-receipts.js','src/core/workload-preset-import-audit-review.js','src/core/saved-search-receipt-import-history-package-integrity.js','src/core/recovery-reconciliation-verification-receipt-package-integrity.js','src/core/compatibility-evidence-freshness-review-package.js']) assert.ok(pkg.scripts.check.includes(path));
  assert.match(release,/APP_VERSION = '1\.9\.0'/);
  assert.match(release,/c0cfca3cdf261b462932a480ef56637efbf0d44e/);
  assert.match(rc,/growup-mychildren-v19/);
  assert.match(rc,/c0cfca3cdf261b462932a480ef56637efbf0d44e/);
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
