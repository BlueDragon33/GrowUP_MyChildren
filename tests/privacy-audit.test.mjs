import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { DEFAULT_PRINT_SECTIONS } from '../src/core/print-report.js';
import { SAFE_DATASETS } from '../src/core/export.js';
import { buildPortableArchive } from '../src/core/archive.js';
import { auditEntriesToJson } from '../src/core/audit-explorer.js';

async function sourceFiles(dirUrl) {
  const entries = await readdir(dirUrl,{withFileTypes:true});
  const files=[];
  for (const entry of entries) {
    const url=new URL(`${entry.name}${entry.isDirectory()?'/':''}`,dirUrl);
    if(entry.isDirectory()) files.push(...await sourceFiles(url));
    else if(/\.(js|mjs|html)$/.test(entry.name)) files.push(url);
  }
  return files;
}

test('runtime does not load external scripts or embed common secret material', async () => {
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match)=>match[1]);
  assert.ok(scripts.length>0);
  scripts.forEach((src)=>assert.match(src,/^\.\//,`script must be local: ${src}`));

  const files=await sourceFiles(new URL('../src/',import.meta.url));
  const forbidden=[/client_secret\s*[:=]/i,/private_key\s*[:=]/i,/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/i,/authorization\s*:\s*["']?bearer\s+[A-Za-z0-9._-]{12,}/i,/api[_-]?key\s*[:=]\s*["'][A-Za-z0-9_-]{16,}["']/i];
  for (const file of files) {
    const text=await readFile(file,'utf8');
    for (const pattern of forbidden) assert.doesNotMatch(text,pattern,`secret-like material in ${file.pathname}`);
  }
});

test('health remains opt-in for printable interoperability and unencrypted archive outputs', async () => {
  assert.equal(DEFAULT_PRINT_SECTIONS.includes('health'),false);
  assert.equal(SAFE_DATASETS.includes('healthRecords'),false);
  assert.equal(SAFE_DATASETS.includes('nutritionLogs'),false);
  const archive=await buildPortableArchive({version:5,family:{name:'A'},children:[{id:'c',name:'Bé',healthRecords:[{height:100}],nutritionLogs:[{water:4}]}]});
  assert.equal(archive.manifest.healthIncluded,false);
  assert.equal('healthRecords' in archive.payload.children[0],false);
  assert.equal('nutritionLogs' in archive.payload.children[0],false);
});

test('audit export rejects raw health and free-text fields even when audit log contains them', () => {
  const output=auditEntriesToJson([{at:'2026-09-07T00:00:00Z',type:'health_saved',childId:'c',height:123.4,weight:24.1,note:'bí mật sức khỏe',healthRecords:[{height:123.4}]}]);
  for(const forbidden of ['123.4','24.1','bí mật sức khỏe','healthRecords']) assert.equal(output.includes(forbidden),false);
  assert.match(output,/health_saved/);
});

test('destructive and replacement user flows retain explicit confirmation checks', async () => {
  const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
  const v6=await readFile(new URL('../src/v6.js',import.meta.url),'utf8');
  const v7=await readFile(new URL('../src/v7.js',import.meta.url),'utf8');
  const v8=await readFile(new URL('../src/v8.js',import.meta.url),'utf8');
  assert.match(app,/confirm\(`Xóa hồ sơ/);
  assert.match(v6,/confirm\(`Xóa \$\{summary\.orphaned\}/);
  assert.match(v7,/confirm\(`Archive và xóa thủ công/);
  assert.match(v8,/Khôi phục sẽ thay thế dữ liệu cục bộ hiện tại/);
  assert.match(v8,/if\(!ok\)return/);
  assert.match(v8,/Xóa mục kế hoạch gia đình này/);
});
