import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIntegrityExportVerificationReceiptPackage } from '../src/core/export-verification-package-integrity.js';
import { receiptImportHistory, applyReceiptImportWithHistory, undoLastReceiptImport } from '../src/core/receipt-import-history.js';
import { buildIntegrityWorkloadPresetPackage } from '../src/core/workload-preset-package-integrity.js';
import { workloadPresetImportHistory, applyWorkloadPresetImportWithHistory, undoLastWorkloadPresetImport } from '../src/core/workload-preset-import-history.js';
import { buildIntegritySavedSearchReceiptPackage, verifySavedSearchReceiptPackageIntegrity, previewSavedSearchReceiptImport, applySavedSearchReceiptImport } from '../src/core/saved-search-receipt-package-integrity.js';
import { buildIntegrityRecoveryReconciliationReport, verifyRecoveryReconciliationReportIntegrity, recoveryReconciliationReportVerificationReceipts, recordRecoveryReconciliationReportVerificationReceipt } from '../src/core/recovery-reconciliation-report-integrity.js';
import { buildCompatibilityEvidencePackage } from '../src/core/compatibility-evidence-package.js';
import { compatibilityEvidenceImportHistory, applyCompatibilityEvidenceImportWithHistory, undoLastCompatibilityEvidenceImport, compatibilityEvidenceFreshnessSummary } from '../src/core/compatibility-evidence-import-history.js';

const receipt=(at='2026-09-08T01:00:00.000Z',checksumResult='valid')=>({at,format:'fmt-v1',algorithm:'SHA-256',checksumResult});
const preset=(id='p1',name='Cuối tuần')=>({id,name,config:{firstMax:45,secondMax:120,labels:{none:'Không có kế hoạch',light:'Đến 45 phút',moderate:'46–120 phút',extended:'Trên 120 phút'}}});

test('L106 receipt imports record metadata delta and undo only the last imported receipts',()=>{
  const base={safeExportVerificationReceipts:[receipt()]};
  const pkg=buildIntegrityExportVerificationReceiptPackage({safeExportVerificationReceipts:[receipt('2026-09-08T02:00:00.000Z','invalid')]});
  const applied=applyReceiptImportWithHistory(base,pkg,'2026-09-08T03:00:00.000Z');
  assert.equal(applied.changed,true);assert.equal(applied.added,1);
  const history=receiptImportHistory(applied.settings);assert.equal(history.length,1);assert.equal(history[0].added.length,1);
  assert.deepEqual(Object.keys(history[0].added[0]).sort(),['algorithm','at','checksumResult','format']);
  const serialized=JSON.stringify(history);for(const forbidden of ['"expected"','"actual"','"manifest"','"payload"'])assert.equal(serialized.includes(forbidden),false);
  const undone=undoLastReceiptImport(applied.settings);assert.equal(undone.changed,true);assert.equal(undone.removed,1);assert.equal(undone.settings.safeExportVerificationReceipts.length,1);assert.equal(receiptImportHistory(undone.settings).length,0);
});

test('L107 preset import history records conflict strategy and undo preserves presets changed after import',()=>{
  const source={customWorkloadPresets:[preset('same','Cuối tuần')]};
  const pkg=buildIntegrityWorkloadPresetPackage(source);
  const applied=applyWorkloadPresetImportWithHistory(source,pkg,{conflictStrategy:'rename'},'2026-09-08T04:00:00.000Z');
  assert.equal(applied.changed,true);assert.equal(applied.added,1);
  const history=workloadPresetImportHistory(applied.settings);assert.equal(history.length,1);assert.equal(history[0].strategy,'rename');assert.equal(history[0].added.length,1);assert.equal(history[0].decisions.some((item)=>item.status==='resolved'),true);
  const importedId=history[0].added[0].id;
  const modified=structuredClone(applied.settings);modified.customWorkloadPresets=modified.customWorkloadPresets.map((item)=>item.id===importedId?{...item,name:'Đã chỉnh sau import'}:item);
  const undone=undoLastWorkloadPresetImport(modified);assert.equal(undone.changed,true);assert.equal(undone.removed,0);assert.equal(undone.preservedModified,1);assert.equal(undone.settings.customWorkloadPresets.some((item)=>item.id===importedId),true);assert.equal(workloadPresetImportHistory(undone.settings).length,0);
});

test('L108 Saved Search receipt package is SHA-256 protected and duplicate-safe on import',()=>{
  const source={savedSearchPackageVerificationReceipts:[{at:'2026-09-08T01:00:00.000Z',format:'saved-v1',algorithm:'SHA-256',result:'valid'}]};
  const pkg=buildIntegritySavedSearchReceiptPackage(source);assert.equal(verifySavedSearchReceiptPackageIntegrity(pkg).valid,true);
  const tampered=structuredClone(pkg);tampered.receipts[0].format='changed';assert.equal(verifySavedSearchReceiptPackageIntegrity(tampered).valid,false);
  let preview=previewSavedSearchReceiptImport(pkg,source);assert.equal(preview.valid,true);assert.equal(preview.duplicates,1);assert.equal(preview.accepted.length,0);
  const pkg2=buildIntegritySavedSearchReceiptPackage({savedSearchPackageVerificationReceipts:[{at:'2026-09-08T02:00:00.000Z',format:'saved-v1',algorithm:'SHA-256',result:'invalid'}]});
  preview=previewSavedSearchReceiptImport(pkg2,source);assert.equal(preview.accepted.length,1);
  const applied=applySavedSearchReceiptImport(source,pkg2);assert.equal(applied.changed,true);assert.equal(applied.added,1);assert.deepEqual(Object.keys(applied.settings.savedSearchPackageVerificationReceipts[1]).sort(),['algorithm','at','format','result']);
});

test('L109 Recovery reconciliation signed report verifies and records metadata-only receipt',()=>{
  const preview={items:[{id:'r1',status:'different',localDate:'2026-10-01',fileDate:'2026-10-02',localCompleted:false,fileCompleted:true,localOriginDate:'2026-09-01',fileOriginDate:'2026-09-01',title:'Secret'}]};
  const report=buildIntegrityRecoveryReconciliationReport(preview,['r1']);const verification=verifyRecoveryReconciliationReportIntegrity(report);assert.equal(verification.valid,true);assert.equal(verification.rowCount,1);assert.equal(JSON.stringify(report).includes('Secret'),false);
  const tampered=structuredClone(report);tampered.rows[0].fileDate='2026-10-03';assert.equal(verifyRecoveryReconciliationReportIntegrity(tampered).valid,false);
  const settings=recordRecoveryReconciliationReportVerificationReceipt({},verification,'2026-09-08T05:00:00.000Z'),receipts=recoveryReconciliationReportVerificationReceipts(settings);assert.equal(receipts.length,1);assert.deepEqual(Object.keys(receipts[0]).sort(),['algorithm','at','format','result','rowCount']);assert.equal(JSON.stringify(receipts).includes('checksum'),false);
});

test('L110 compatibility evidence import audit excludes Axe, supports safe undo, and reports freshness',()=>{
  const pkg=buildCompatibilityEvidencePackage({compatibilityEvidenceRecords:[{module:'legacy.js',flow:'overview',observed:true,active:false,at:'2026-09-08T01:00:00.000Z'},{module:'legacy.js',flow:'axe',observed:true,active:false,at:'2026-09-08T01:01:00.000Z'}]});
  const applied=applyCompatibilityEvidenceImportWithHistory({},pkg,'2026-09-08T06:00:00.000Z');assert.equal(applied.changed,true);assert.equal(applied.axeRecheckRequired,1);
  const history=compatibilityEvidenceImportHistory(applied.settings);assert.equal(history.length,1);assert.equal(history[0].deltas.length,1);assert.equal(history[0].deltas[0].before,null);assert.equal(history[0].deltas[0].after.flow,'overview');assert.equal(JSON.stringify(history).includes('"flow":"axe"'),false);
  const freshness=compatibilityEvidenceFreshnessSummary(applied.settings,'2026-09-20T00:00:00.000Z',30);assert.equal(freshness.modules.length,1);assert.equal(freshness.modules[0].flows.overview.status,'fresh');assert.equal(freshness.modules[0].flows.axe.status,'missing');assert.equal(freshness.modules[0].axeRecheckRequired,true);
  const undone=undoLastCompatibilityEvidenceImport(applied.settings);assert.equal(undone.changed,true);assert.equal(undone.reverted,1);assert.equal(undone.settings.compatibilityEvidenceRecords.length,0);assert.equal(compatibilityEvidenceImportHistory(undone.settings).length,0);
});
