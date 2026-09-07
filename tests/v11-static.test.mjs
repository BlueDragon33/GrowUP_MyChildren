import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('v1.1 remains behind one public JS and CSS entrypoint',async()=>{
  const html=await read('index.html'),runtime=await read('src/runtime-entry.js'),css=await read('src/runtime.css');
  assert.equal((html.match(/<script[^>]+src=/g)||[]).length,1);
  assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1);
  assert.ok(runtime.indexOf("import './v10-runtime.js'")<runtime.indexOf("import './v11-runtime.js'"));
  assert.ok(runtime.indexOf("import './v11-runtime.js'")<runtime.indexOf("import './a11y.js'"));
  assert.match(css,/@import '\.\/v11\.css';/);
});

test('v1.1 service worker and syntax gate contain all new modules',async()=>{
  const sw=await read('sw.js'),pkg=JSON.parse(await read('package.json'));
  assert.match(sw,/growup-mychildren-v11/);
  for(const file of ['v11.css','v11-runtime.js','data-portability.js','workload-windows.js','saved-searches.js','recovery-schedule.js','compatibility-usage.js'])assert.ok(sw.includes(file),`${file} missing from SW`);
  for(const file of ['src/v11-runtime.js','src/core/data-portability.js','src/core/workload-windows.js','src/core/saved-searches.js','src/core/recovery-schedule.js','src/core/compatibility-usage.js'])assert.ok(pkg.scripts.check.includes(file),`${file} missing from syntax gate`);
  assert.equal(pkg.version,'1.1.0');
});

test('v1.1 release and rollback profile are pinned to stable v1.0 main',async()=>{
  const release=await read('src/core/release.js'),rc=await read('src/core/rc-gate.js');
  assert.match(release,/APP_VERSION = '1\.1\.0'/);
  assert.match(release,/version:'1\.0\.0'/);
  assert.match(release,/605c4948cbcc60164d8a34ba220558d39d8eeeb5/);
  assert.match(rc,/appVersion:'1\.1\.0'/);
  assert.match(rc,/serviceWorkerCache:'growup-mychildren-v11'/);
  assert.match(rc,/605c4948cbcc60164d8a34ba220558d39d8eeeb5/);
});

test('saved views and recovery schedule source preserve privacy boundaries',async()=>{
  const saved=await read('src/core/saved-searches.js'),recovery=await read('src/core/recovery-schedule.js'),usage=await read('src/core/compatibility-usage.js');
  assert.doesNotMatch(saved,/healthRecords|nutritionLogs/);
  assert.match(saved,/Không lưu từ khóa tìm kiếm, danh sách kết quả/);
  assert.doesNotMatch(recovery,/passphrase\s*:/i);
  assert.doesNotMatch(recovery,/ciphertext\s*:/i);
  assert.match(usage,/sessionStorage/);
  assert.doesNotMatch(usage,/localStorage/);
  assert.match(usage,/removable:false/);
});

test('compatibility entrypoint marks all inherited runtime layers but deletes none',async()=>{
  const runtime=await read('src/runtime-entry.js'),usage=await read('src/core/compatibility-usage.js');
  for(const id of ['v4','v5','v6','v7','v8','v9-runtime','v9-compat','v10-runtime'])assert.ok(runtime.includes(`'${id}'`));
  assert.doesNotMatch(runtime,/remove|delete.*v[4-9]/i);
  assert.match(usage,/“Unobserved” chưa đủ bằng chứng để xóa module/);
});
