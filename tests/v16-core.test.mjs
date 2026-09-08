import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIntegrityExportVerificationReceiptPackage, verifyExportVerificationReceiptPackageIntegrity, previewExportVerificationReceiptImport, applyExportVerificationReceiptImport } from '../src/core/export-verification-package-integrity.js';
import { buildIntegrityWorkloadPresetPackage, verifyWorkloadPresetPackageIntegrity, previewIntegrityWorkloadPresetImport, applyIntegrityWorkloadPresetImport } from '../src/core/workload-preset-package-integrity.js';
import { filterSavedSearchIntegrityReceipts, buildSavedSearchIntegrityReceiptPackage, clearSavedSearchIntegrityReceipts } from '../src/core/saved-search-integrity-receipt-management.js';
import { buildRecoveryReconciliationReport } from '../src/core/recovery-reconciliation-report.js';
import { buildCompatibilityEvidencePackage, verifyCompatibilityEvidencePackage, previewCompatibilityEvidenceImport, applyCompatibilityEvidenceImport } from '../src/core/compatibility-evidence-package.js';

const receipt=(at='2026-09-08T01:00:00.000Z',result='valid')=>({at,format:'fmt-v1',algorithm:'SHA-256',checksumResult:result});

test('L101 receipt package integrity detects tamper and imports duplicate-safe metadata only',()=>{
  const source={safeExportVerificationReceipts:[receipt()]};
  const pkg=buildIntegrityExportVerificationReceiptPackage(source);
  assert.equal(verifyExportVerificationReceiptPackageIntegrity(pkg).valid,true);
  const serialized=JSON.stringify(pkg);
  assert.equal(serialized.includes('child'),false);
  const tampered=structuredClone(pkg);tampered.receipts[0].format='changed';
  assert.equal(verifyExportVerificationReceiptPackageIntegrity(tampered).valid,false);
  let preview=previewExportVerificationReceiptImport(pkg,source);
  assert.equal(preview.valid,true);assert.equal(preview.duplicates,1);assert.equal(preview.accepted.length,0);
  const pkg2=buildIntegrityExportVerificationReceiptPackage({safeExportVerificationReceipts:[receipt('2026-09-08T02:00:00.000Z','invalid')]});
  preview=previewExportVerificationReceiptImport(pkg2,source);assert.equal(preview.accepted.length,1);
  const applied=applyExportVerificationReceiptImport(source,pkg2);assert.equal(applied.changed,true);assert.equal(applied.added,1);
  assert.deepEqual(Object.keys(applied.settings.safeExportVerificationReceipts[1]).sort(),['algorithm','at','checksumResult','format']);
});

test('L102 preset integrity exposes conflicts and never silently overwrites existing preset',()=>{
  const source={customWorkloadPresets:[{id:'same',name:'Cuối tuần',config:{firstMax:45,secondMax:120,labels:{none:'Không có kế hoạch',light:'Đến 45 phút',moderate:'46–120 phút',extended:'Trên 120 phút'}}}]};
  const pkg=buildIntegrityWorkloadPresetPackage(source);assert.equal(verifyWorkloadPresetPackageIntegrity(pkg).valid,true);
  const existing=structuredClone(source);
  let preview=previewIntegrityWorkloadPresetImport(pkg,existing,{conflictStrategy:'skip'});assert.equal(preview.conflicts,1);assert.equal(preview.accepted,0);
  preview=previewIntegrityWorkloadPresetImport(pkg,existing,{conflictStrategy:'rename'});assert.equal(preview.conflicts,1);assert.equal(preview.accepted,1);assert.notEqual(preview.acceptedItems[0].id,'same');assert.notEqual(preview.acceptedItems[0].name,'Cuối tuần');
  const applied=applyIntegrityWorkloadPresetImport(existing,pkg,{conflictStrategy:'rename'});assert.equal(applied.added,1);assert.equal(applied.settings.customWorkloadPresets.length,2);
  const unsafe=structuredClone(pkg);unsafe.presets[0].config.childId='c1';
  assert.equal(verifyWorkloadPresetPackageIntegrity(unsafe).valid,false);
});

test('L103 Saved Search integrity receipt management filters exports and clears metadata only',()=>{
  const settings={savedSearchPackageVerificationReceipts:[{at:'2026-09-08T01:00:00.000Z',format:'fmt-a',algorithm:'SHA-256',result:'valid'},{at:'2026-09-09T01:00:00.000Z',format:'fmt-b',algorithm:'SHA-256',result:'invalid'}]};
  const filtered=filterSavedSearchIntegrityReceipts(settings,{result:'invalid',fromDate:'2026-09-09'});assert.equal(filtered.length,1);assert.equal(filtered[0].format,'fmt-b');
  const pkg=buildSavedSearchIntegrityReceiptPackage(settings,{result:'valid'});assert.equal(pkg.receipts.length,1);assert.deepEqual(Object.keys(pkg.receipts[0]).sort(),['algorithm','at','format','result']);
  assert.equal(JSON.stringify(pkg).includes('expected'),false);assert.equal(JSON.stringify(pkg).includes('actual'),false);
  assert.deepEqual(clearSavedSearchIntegrityReceipts(settings).savedSearchPackageVerificationReceipts,[]);
});

test('L104 Recovery reconciliation report contains selected comparison metadata only',()=>{
  const preview={items:[{id:'r1',status:'different',localDate:'2026-10-01',fileDate:'2026-10-02',localCompleted:false,fileCompleted:true,localOriginDate:'2026-09-01',fileOriginDate:'2026-09-01',title:'Secret title'},{id:'r2',status:'same',localDate:'2026-11-01',fileDate:'2026-11-01',localCompleted:false,fileCompleted:false,localOriginDate:'2026-11-01',fileOriginDate:'2026-11-01'}]};
  const report=buildRecoveryReconciliationReport(preview,['r1']);assert.equal(report.rows.length,1);assert.equal(report.rows[0].id,'r1');assert.equal(report.summary.different,1);assert.equal(JSON.stringify(report).includes('Secret title'),false);assert.equal('apply' in report,false);
});

test('L105 compatibility evidence package validates checksum/flow and imports metadata without removal behavior',()=>{
  const settings={compatibilityEvidenceRecords:[{module:'legacy.js',flow:'overview',observed:true,active:false,at:'2026-09-08T01:00:00.000Z'}]};
  const pkg=buildCompatibilityEvidencePackage(settings);assert.equal(verifyCompatibilityEvidencePackage(pkg).valid,true);
  assert.equal(JSON.stringify(pkg).includes('selector'),false);assert.equal(JSON.stringify(pkg).includes('child'),false);
  const tampered=structuredClone(pkg);tampered.records[0].active=true;assert.equal(verifyCompatibilityEvidencePackage(tampered).valid,false);
  const source={compatibilityEvidenceRecords:[]};const preview=previewCompatibilityEvidenceImport(pkg,source);assert.equal(preview.valid,true);assert.equal(preview.accepted.length,1);
  const applied=applyCompatibilityEvidenceImport(source,pkg);assert.equal(applied.changed,true);assert.equal(applied.settings.compatibilityEvidenceRecords[0].flow,'overview');
  const bad=structuredClone(pkg);bad.records[0].flow='health';bad.manifest.checksum='bad';assert.equal(previewCompatibilityEvidenceImport(bad,source).valid,false);
});
