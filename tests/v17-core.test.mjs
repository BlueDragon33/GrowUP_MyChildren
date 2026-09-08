import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIntegrityExportVerificationReceiptPackage } from '../src/core/export-verification-package-integrity.js';
import { applyExportVerificationReceiptImportWithHistory, exportVerificationImportHistory, undoLastExportVerificationReceiptImport } from '../src/core/export-verification-import-history.js';
import { buildIntegrityWorkloadPresetPackage } from '../src/core/workload-preset-package-integrity.js';
import { applyIntegrityWorkloadPresetImportWithHistory, workloadPresetImportHistory, undoLastWorkloadPresetImport } from '../src/core/workload-preset-import-history.js';
import { buildIntegritySavedSearchReceiptPackage, verifySavedSearchIntegrityReceiptPackage, previewSavedSearchIntegrityReceiptImport, applySavedSearchIntegrityReceiptImport } from '../src/core/saved-search-integrity-receipt-package.js';
import { buildIntegrityRecoveryReconciliationReport, withRecoveryReconciliationReportManifest, verifyRecoveryReconciliationReportIntegrity, recordRecoveryReconciliationReportVerificationReceipt } from '../src/core/recovery-reconciliation-report-integrity.js';
import { buildCompatibilityEvidencePackage } from '../src/core/compatibility-evidence-package.js';
import { applyCompatibilityEvidenceImportWithAudit, compatibilityEvidenceImportHistory, undoLastCompatibilityEvidenceImport, compatibilityEvidenceFreshness } from '../src/core/compatibility-evidence-import-audit.js';

const receipt=(at='2026-09-08T01:00:00.000Z',result='valid')=>({at,format:'fmt-v1',algorithm:'SHA-256',checksumResult:result});
const preset=(id='p1',name='Cuối tuần')=>({id,name,config:{firstMax:45,secondMax:120,labels:{none:'Không có kế hoạch',light:'Đến 45 phút',moderate:'46–120 phút',extended:'Trên 120 phút'}}});

test('L106 receipt import records metadata delta and rollback-safe undo',()=>{
  const pkg=buildIntegrityExportVerificationReceiptPackage({safeExportVerificationReceipts:[receipt()]});
  const applied=applyExportVerificationReceiptImportWithHistory({},pkg,'2026-09-08T02:00:00.000Z');
  assert.equal(applied.changed,true);assert.equal(applied.historyAdded,true);
  const history=exportVerificationImportHistory(applied.settings);assert.equal(history.length,1);assert.equal(history[0].addedCount,1);
  const serialized=JSON.stringify(history);assert.equal(/expected|actual|manifest|payload|child|free.?text/i.test(serialized),false);assert.equal(serialized.includes('checksumResult'),true);
  const undone=undoLastExportVerificationReceiptImport(applied.settings,'2026-09-08T03:00:00.000Z');assert.equal(undone.changed,true);assert.equal(undone.removed,1);assert.equal(undone.settings.safeExportVerificationReceipts.length,0);assert.ok(undone.settings.safeExportVerificationImportHistory[0].undoneAt);
  const appliedAgain=applyExportVerificationReceiptImportWithHistory({},pkg,'2026-09-08T04:00:00.000Z');const diverged={...appliedAgain.settings,safeExportVerificationReceipts:[]};
  const refused=undoLastExportVerificationReceiptImport(diverged);assert.equal(refused.changed,false);assert.equal(refused.reason,'receipt-state-diverged');
});

test('L107 preset import keeps deterministic decisions and refuses undo after preset edit',()=>{
  const source={customWorkloadPresets:[preset('same','Cuối tuần')]},pkg=buildIntegrityWorkloadPresetPackage(source),existing={customWorkloadPresets:[preset('same','Cuối tuần')]};
  const applied=applyIntegrityWorkloadPresetImportWithHistory(existing,pkg,{conflictStrategy:'rename'},'2026-09-08T05:00:00.000Z');
  assert.equal(applied.changed,true);assert.equal(applied.added,1);const history=workloadPresetImportHistory(applied.settings);assert.equal(history.length,1);assert.equal(history[0].strategy,'rename');assert.equal(history[0].decisions[0].action,'renamed');
  const serialized=JSON.stringify(history);assert.equal(/childId|score|rank|performance|health/i.test(serialized),false);
  const undone=undoLastWorkloadPresetImport(applied.settings,'2026-09-08T06:00:00.000Z');assert.equal(undone.changed,true);assert.equal(undone.removed,1);assert.equal(undone.settings.customWorkloadPresets.length,1);
  const appliedAgain=applyIntegrityWorkloadPresetImportWithHistory(existing,pkg,{conflictStrategy:'rename'},'2026-09-08T07:00:00.000Z');const importedId=appliedAgain.historyEntry.addedIds[0];
  const modified={...appliedAgain.settings,customWorkloadPresets:appliedAgain.settings.customWorkloadPresets.map((item)=>item.id===importedId?{...item,config:{...item.config,firstMax:50}}:item)};
  const refused=undoLastWorkloadPresetImport(modified);assert.equal(refused.changed,false);assert.equal(refused.reason,'preset-state-diverged');
});

test('L108 Saved Search receipt package detects tamper, duplicates and persists metadata only',()=>{
  const source={savedSearchPackageVerificationReceipts:[{at:'2026-09-08T01:00:00.000Z',format:'saved-v1',algorithm:'SHA-256',result:'valid'}]},pkg=buildIntegritySavedSearchReceiptPackage(source);
  assert.equal(verifySavedSearchIntegrityReceiptPackage(pkg).valid,true);
  const tampered=structuredClone(pkg);tampered.receipts[0].format='changed';assert.equal(verifySavedSearchIntegrityReceiptPackage(tampered).valid,false);
  const dup=previewSavedSearchIntegrityReceiptImport(pkg,source);assert.equal(dup.valid,true);assert.equal(dup.duplicates,1);assert.equal(dup.accepted.length,0);
  const applied=applySavedSearchIntegrityReceiptImport({},pkg);assert.equal(applied.changed,true);assert.deepEqual(Object.keys(applied.settings.savedSearchPackageVerificationReceipts[0]).sort(),['algorithm','at','format','result']);
  assert.equal(/criteria|snippet|results|nutrition|health|expected|actual/i.test(JSON.stringify(applied.settings.savedSearchPackageVerificationReceipts)),false);
});

test('L109 Recovery report integrity is strict and receipt remains metadata only',()=>{
  const preview={items:[{id:'r1',status:'different',localDate:'2026-10-01',fileDate:'2026-10-02',localCompleted:false,fileCompleted:true,localOriginDate:'2026-09-01',fileOriginDate:'2026-09-01',title:'Private title'}]},pkg=buildIntegrityRecoveryReconciliationReport(preview,['r1']);
  assert.equal(verifyRecoveryReconciliationReportIntegrity(pkg).valid,true);assert.equal(JSON.stringify(pkg).includes('Private title'),false);
  const tampered=structuredClone(pkg);tampered.rows[0].status='same';assert.equal(verifyRecoveryReconciliationReportIntegrity(tampered).valid,false);
  const unsafeRow=structuredClone(pkg);unsafeRow.rows[0].childName='Secret';const resignedRow=withRecoveryReconciliationReportManifest(unsafeRow);assert.equal(verifyRecoveryReconciliationReportIntegrity(resignedRow).valid,false);
  const unsafeTop=structuredClone(pkg);unsafeTop.childName='Secret';const resignedTop=withRecoveryReconciliationReportManifest(unsafeTop);assert.equal(verifyRecoveryReconciliationReportIntegrity(resignedTop).valid,false);
  const verification=verifyRecoveryReconciliationReportIntegrity(pkg),settings=recordRecoveryReconciliationReportVerificationReceipt({},verification,'2026-09-08T08:00:00.000Z'),saved=settings.recoveryReconciliationReportVerificationReceipts[0];
  assert.deepEqual(Object.keys(saved).sort(),['algorithm','at','format','result','rowCount']);assert.equal(/expected|actual|title|vcalendar|child/i.test(JSON.stringify(saved)),false);
});

test('L110 compatibility import audits non-Axe delta, undo restores prior state and freshness is descriptive',()=>{
  const current={compatibilityEvidenceRecords:[{module:'legacy.js',flow:'overview',observed:true,active:true,at:'2026-09-01T00:00:00.000Z'}]};
  const pkg=buildCompatibilityEvidencePackage({compatibilityEvidenceRecords:[
    {module:'legacy.js',flow:'overview',observed:true,active:false,at:'2026-09-08T00:00:00.000Z'},
    {module:'legacy.js',flow:'skills',observed:true,active:false,at:'2026-09-08T00:00:00.000Z'},
    {module:'legacy.js',flow:'axe',observed:true,active:false,at:'2026-09-08T00:00:00.000Z'}
  ]});
  const applied=applyCompatibilityEvidenceImportWithAudit(current,pkg,'2026-09-08T09:00:00.000Z');assert.equal(applied.changed,true);assert.equal(applied.added,1);assert.equal(applied.replaced,1);assert.equal(applied.axeRecheckRequired,1);
  const history=compatibilityEvidenceImportHistory(applied.settings);assert.equal(history.length,1);assert.equal(JSON.stringify(history).includes('"flow":"axe"'),false);assert.equal(/selector|dom|child|checksum|package/i.test(JSON.stringify(history)),false);
  const undone=undoLastCompatibilityEvidenceImport(applied.settings,'2026-09-08T10:00:00.000Z');assert.equal(undone.changed,true);assert.equal(undone.restored,1);assert.equal(undone.removed,1);assert.equal(undone.settings.compatibilityEvidenceRecords.length,1);assert.equal(undone.settings.compatibilityEvidenceRecords[0].active,true);
  const modified=structuredClone(applied.settings);modified.compatibilityEvidenceRecords=modified.compatibilityEvidenceRecords.map((item)=>item.flow==='skills'?{...item,active:true}:item);const refused=undoLastCompatibilityEvidenceImport(modified);assert.equal(refused.changed,false);assert.equal(refused.reason,'evidence-state-diverged');
  const fresh=compatibilityEvidenceFreshness({compatibilityEvidenceRecords:[{module:'m',flow:'overview',observed:true,active:false,at:'2026-09-09T00:00:00.000Z'},{module:'m',flow:'skills',observed:true,active:false,at:'2026-07-01T00:00:00.000Z'}]},{now:'2026-09-10T00:00:00.000Z',staleAfterDays:30});
  assert.ok(fresh.freshFlows.includes('overview'));assert.ok(fresh.staleFlows.includes('skills'));assert.ok(fresh.missingFlows.includes('axe'));assert.equal('retire' in fresh,false);assert.equal('remove' in fresh,false);
});
