import test from 'node:test';
import assert from 'node:assert/strict';
import { auditExplorerEntries, auditEntriesToJson, auditEntriesToCsv } from '../src/core/audit-explorer.js';
import { TAXONOMY_VERSION, normalizeTaxonomyConfig, resolvedDevelopmentDomains, taxonomySnapshot } from '../src/core/taxonomy.js';
import { normalizeFamilyPlanItems, summarizeFamilyTime, familyTimeConflicts, FAMILY_PLANNING_NOTE } from '../src/core/family-planning.js';
import { encryptPortableBackup, decryptPortableBackup, encryptedBackupInfo, ENCRYPTED_BACKUP_FORMAT } from '../src/core/encrypted-backup.js';
import { APP_VERSION, STABLE_ROLLBACK, compareVersions, releaseStatus } from '../src/core/release.js';

function sampleState() {
  return {
    version:5,
    family:{name:'Gia đình thử nghiệm'},
    children:[{
      id:'c1', name:'Bé Riêng Tư', dateOfBirth:'2018-01-01',
      learningGoals:[{id:'g1',title:'Đọc sách',subject:'Ngôn ngữ'}],
      healthRecords:[{id:'h1',date:'2026-09-01',height:128.4,weight:26.2,note:'Nội dung sức khỏe rất riêng tư'}],
      nutritionLogs:[{id:'n1',date:'2026-09-01',note:'Nội dung dinh dưỡng riêng tư'}],
      reminders:[], attachments:[]
    }],
    auditLog:[
      {at:'2026-09-01T01:00:00.000Z',type:'health_record_saved',childId:'c1',height:128.4,weight:26.2,note:'Nội dung sức khỏe rất riêng tư'},
      {at:'2026-09-02T01:00:00.000Z',type:'family_plan_item_added',childId:'c1',count:2,datasets:['safe']}
    ]
  };
}

test('audit explorer exports allowlisted metadata only', () => {
  const entries=auditExplorerEntries(sampleState(),{limit:20});
  assert.equal(entries.length,2);
  assert.equal(entries[1].type,'health_record_saved');
  assert.equal('height' in entries[1],false);
  assert.equal('weight' in entries[1],false);
  assert.equal('note' in entries[1],false);
  const json=auditEntriesToJson(entries);
  const csv=auditEntriesToCsv(entries);
  for(const secret of ['128.4','26.2','Nội dung sức khỏe rất riêng tư','Nội dung dinh dưỡng riêng tư']){
    assert.equal(json.includes(secret),false);
    assert.equal(csv.includes(secret),false);
  }
});

test('versioned taxonomy changes labels without rewriting historical records', () => {
  const history={id:'g1',subject:'Ngôn ngữ',title:'Đọc sách'};
  const before=structuredClone(history);
  const config=normalizeTaxonomyConfig({taxonomyVersion:TAXONOMY_VERSION,labels:{language:'Ngôn ngữ & giao tiếp'},disabledDomainIds:['creativity'],customDomains:[{id:'music',label:'Âm nhạc',description:'Khám phá âm nhạc'}]});
  const domains=resolvedDevelopmentDomains(config);
  assert.equal(domains.find((d)=>d.id==='language').label,'Ngôn ngữ & giao tiếp');
  assert.equal(domains.find((d)=>d.id==='creativity').enabled,false);
  assert.ok(domains.some((d)=>d.id==='custom-music' && d.label==='Âm nhạc'));
  assert.deepEqual(history,before);
  assert.equal(taxonomySnapshot(config).needsReview,false);
});

test('family planning preserves child order and exposes time only, not rankings', () => {
  const children=[{id:'b',name:'Bé B'},{id:'a',name:'Bé A'}];
  const items=normalizeFamilyPlanItems([
    {id:'p1',childId:'a',date:'2026-09-08',title:'Bơi',minutes:90},
    {id:'p2',childId:'b',date:'2026-09-08',title:'Đọc',minutes:30},
    {id:'p3',childId:'b',date:'2026-09-09',title:'Vẽ',minutes:9999}
  ],children.map((c)=>c.id));
  const summary=summarizeFamilyTime(children,items,'2026-09-07',30);
  assert.deepEqual(summary.map((x)=>x.childId),['b','a']);
  assert.equal(summary[0].plannedMinutes,1470);
  assert.equal(summary[1].plannedMinutes,90);
  assert.equal('rank' in summary[0],false);
  assert.equal('score' in summary[0],false);
  assert.match(FAMILY_PLANNING_NOTE,/không phải điểm, xếp hạng/);
  assert.equal(familyTimeConflicts(items)[0].date,'2026-09-08');
});

test('encrypted backup roundtrip hides plaintext and rejects wrong password or tamper', async () => {
  const state=sampleState();
  const passphrase='MatKhauBackup-2026!';
  const encrypted=await encryptPortableBackup(state,passphrase);
  assert.equal(encrypted.format,ENCRYPTED_BACKUP_FORMAT);
  const serialized=JSON.stringify(encrypted);
  for(const plaintext of ['Bé Riêng Tư','Nội dung sức khỏe rất riêng tư','128.4']) assert.equal(serialized.includes(plaintext),false);
  const info=encryptedBackupInfo(encrypted);
  assert.equal(info.supported,true);
  assert.ok(info.iterations>=100000);
  const restored=await decryptPortableBackup(encrypted,passphrase);
  assert.equal(restored.valid,true);
  assert.equal(restored.payload.children[0].name,'Bé Riêng Tư');
  assert.equal(restored.payload.children[0].healthRecords[0].height,128.4);
  await assert.rejects(()=>decryptPortableBackup(encrypted,'SaiMatKhau-2026!'),/Không thể giải mã backup/);
  const tampered=structuredClone(encrypted);
  const chars=tampered.ciphertext.split('');
  chars[Math.floor(chars.length/2)]=chars[Math.floor(chars.length/2)]==='A'?'B':'A';
  tampered.ciphertext=chars.join('');
  await assert.rejects(()=>decryptPortableBackup(tampered,passphrase),/Không thể giải mã backup/);
});

test('release metadata pins stable v0.7 rollback and compares versions', () => {
  assert.equal(APP_VERSION,'0.8.0');
  assert.equal(STABLE_ROLLBACK.version,'0.7.0');
  assert.equal(STABLE_ROLLBACK.commit,'adb345c5ec94ccb1933661bad06c8c6473e7ef36');
  assert.equal(compareVersions('0.8.0','0.7.9'),1);
  assert.equal(compareVersions('0.8.0','0.8.0'),0);
  const status=releaseStatus('0.7.0');
  assert.equal(status.hasNewRelease,true);
  assert.equal(status.dataSchemaVersion,5);
});
