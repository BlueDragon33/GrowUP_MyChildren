import test from 'node:test';
import assert from 'node:assert/strict';
import { auditExplorerEntries, auditEntriesToJson } from '../src/core/audit-explorer.js';
import { TAXONOMY_VERSION, normalizeTaxonomyConfig, resolvedDevelopmentDomains } from '../src/core/taxonomy.js';
import { normalizeFamilyPlanItems, summarizeFamilyTime } from '../src/core/family-planning.js';
import { encryptPortableBackup, decryptPortableBackup, ENCRYPTED_BACKUP_FORMAT } from '../src/core/encrypted-backup.js';
import { APP_VERSION, STABLE_ROLLBACK, compareVersions, releaseStatus } from '../src/core/release.js';

function sampleState(){return {version:5,family:{name:'Test Family'},children:[{id:'c1',name:'Test Child',learningGoals:[{id:'g1',title:'Read',subject:'Language'}],healthRecords:[],nutritionLogs:[],reminders:[],attachments:[]}],auditLog:[{at:'2026-09-01T01:00:00.000Z',type:'record_saved',childId:'c1',count:1,detail:'omit-this'}]};}

test('audit explorer keeps only allowlisted metadata',()=>{
  const entries=auditExplorerEntries(sampleState(),{limit:10});
  assert.equal(entries.length,1);
  assert.equal('detail' in entries[0],false);
  assert.equal(auditEntriesToJson(entries).includes('omit-this'),false);
});

test('taxonomy configuration resolves default and custom domains',()=>{
  const config=normalizeTaxonomyConfig({taxonomyVersion:TAXONOMY_VERSION,labels:{language:'Language & communication'},customDomains:[{id:'music',label:'Music',description:'Music exploration'}]});
  const domains=resolvedDevelopmentDomains(config);
  assert.equal(domains.find((d)=>d.id==='language').label,'Language & communication');
  assert.ok(domains.some((d)=>d.id==='custom-music'));
});

test('family planning preserves child order without rank or score',()=>{
  const children=[{id:'b',name:'B'},{id:'a',name:'A'}];
  const items=normalizeFamilyPlanItems([{id:'p1',childId:'a',date:'2026-09-08',title:'A plan',minutes:90},{id:'p2',childId:'b',date:'2026-09-08',title:'B plan',minutes:30}],children.map((c)=>c.id));
  const summary=summarizeFamilyTime(children,items,'2026-09-07',30);
  assert.deepEqual(summary.map((x)=>x.childId),['b','a']);
  assert.equal('rank' in summary[0],false);
  assert.equal('score' in summary[0],false);
});

test('encrypted backup roundtrip preserves state and format',async()=>{
  const encrypted=await encryptPortableBackup(sampleState(),'test-passphrase-12345');
  assert.equal(encrypted.format,ENCRYPTED_BACKUP_FORMAT);
  assert.equal(JSON.stringify(encrypted).includes('Test Child'),false);
  const restored=await decryptPortableBackup(encrypted,'test-passphrase-12345');
  assert.equal(restored.valid,true);
  assert.equal(restored.payload.children[0].name,'Test Child');
});

test('release metadata advances to v1.4 and pins v1.3 rollback',()=>{
  assert.equal(APP_VERSION,'1.4.0');
  assert.equal(STABLE_ROLLBACK.version,'1.3.0');
  assert.equal(STABLE_ROLLBACK.commit,'51e4a80609d40915106663e983dbfa1202fee228');
  assert.equal(compareVersions('1.4.0','1.3.9'),1);
  assert.equal(compareVersions('1.4.0','1.4.0'),0);
  assert.equal(releaseStatus('1.3.0').hasNewRelease,true);
});
