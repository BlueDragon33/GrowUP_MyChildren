import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReceiptImportHistoryPackage, verifyReceiptImportHistoryPackage, reviewReceiptImportHistoryPackage } from '../src/core/receipt-import-history-package-integrity.js';
import { buildWorkloadPresetImportAuditPackage, verifyWorkloadPresetImportAuditPackage, reviewWorkloadPresetImportAuditPackage } from '../src/core/workload-preset-import-audit-package-integrity.js';
import { buildIntegritySavedSearchReceiptPackage } from '../src/core/saved-search-receipt-package-integrity.js';
import { savedSearchReceiptImportHistory, applySavedSearchReceiptImportWithHistory, undoLastSavedSearchReceiptImport } from '../src/core/saved-search-receipt-import-history.js';
import { filterRecoveryReconciliationVerificationReceipts, buildRecoveryReconciliationVerificationReceiptPackage, clearRecoveryReconciliationVerificationReceipts } from '../src/core/recovery-reconciliation-verification-receipt-management.js';
import { compatibilityEvidenceFreshnessPolicy, setCompatibilityEvidenceFreshnessPolicy, resetCompatibilityEvidenceFreshnessPolicy, buildCompatibilityEvidenceFreshnessReview, compatibilityEvidenceFreshnessGate } from '../src/core/compatibility-evidence-freshness-policy.js';

const receipt=(at='2026-09-08T01:00:00.000Z',result='valid')=>({at,format:'fmt-v1',algorithm:'SHA-256',result});

test('L111 receipt import-history package is signed, metadata-only and review-only',()=>{
  const settings={receiptImportHistory:[{id:'internal-id',at:'2026-09-08T02:00:00.000Z',packageFormat:'pkg-v1',added:[{at:'2026-09-08T01:00:00.000Z',format:'safe-v1',algorithm:'SHA-256',checksumResult:'valid'}]}]};
  const pkg=buildReceiptImportHistoryPackage(settings);assert.equal(verifyReceiptImportHistoryPackage(pkg).valid,true);const review=reviewReceiptImportHistoryPackage(pkg);assert.equal(review.valid,true);assert.equal(review.importCount,1);assert.equal(review.receiptCount,1);const text=JSON.stringify(pkg);for(const forbidden of ['internal-id','"expected"','"actual"','"payload"','childId'])assert.equal(text.includes(forbidden),false);
  const tampered=structuredClone(pkg);tampered.imports[0].packageFormat='changed';assert.equal(verifyReceiptImportHistoryPackage(tampered).valid,false);
});

test('L112 preset audit package is signed and omits preset config/signature',()=>{
  const settings={workloadPresetImportHistory:[{id:'audit-1',at:'2026-09-08T03:00:00.000Z',strategy:'rename',decisions:[{status:'resolved',sourceId:'same',sourceName:'Cuối tuần',resolvedId:'same-2',resolvedName:'Cuối tuần (2)',nameConflict:true,idConflict:true}],added:[{id:'same-2',name:'Cuối tuần (2)',signature:'secret-hash'}]}]};
  const pkg=buildWorkloadPresetImportAuditPackage(settings);assert.equal(verifyWorkloadPresetImportAuditPackage(pkg).valid,true);const review=reviewWorkloadPresetImportAuditPackage(pkg);assert.equal(review.summary.conflicts,1);assert.equal(review.summary.resolved,1);const text=JSON.stringify(pkg);for(const forbidden of ['secret-hash','"config"','childId','score','rank','performance','health'])assert.equal(text.toLowerCase().includes(forbidden.toLowerCase()),false);
  const tampered=structuredClone(pkg);tampered.audits[0].strategy='skip';assert.equal(verifyWorkloadPresetImportAuditPackage(tampered).valid,false);
});

test('L113 Saved Search receipt managed import records delta and undo preserves unrelated receipts',()=>{
  const base={savedSearchPackageVerificationReceipts:[receipt()]};const pkg=buildIntegritySavedSearchReceiptPackage({savedSearchPackageVerificationReceipts:[receipt('2026-09-08T02:00:00.000Z','invalid')]});const applied=applySavedSearchReceiptImportWithHistory(base,pkg,'2026-09-08T04:00:00.000Z');assert.equal(applied.changed,true);assert.equal(applied.added,1);assert.equal(savedSearchReceiptImportHistory(applied.settings).length,1);assert.deepEqual(Object.keys(savedSearchReceiptImportHistory(applied.settings)[0].added[0]).sort(),['algorithm','at','format','result']);const undone=undoLastSavedSearchReceiptImport(applied.settings);assert.equal(undone.changed,true);assert.equal(undone.removed,1);assert.equal(undone.settings.savedSearchPackageVerificationReceipts.length,1);assert.equal(undone.settings.savedSearchPackageVerificationReceipts[0].result,'valid');assert.equal(savedSearchReceiptImportHistory(undone.settings).length,0);
});

test('L114 recovery verification receipt management filters exports and requires confirmation to clear',()=>{
  const settings={recoveryReconciliationReportVerificationReceipts:[{at:'2026-09-08T01:00:00.000Z',format:'a',algorithm:'SHA-256',result:'valid',rowCount:2},{at:'2026-09-09T01:00:00.000Z',format:'b',algorithm:'SHA-256',result:'invalid',rowCount:4}]};assert.equal(filterRecoveryReconciliationVerificationReceipts(settings,{result:'invalid'}).length,1);const pkg=buildRecoveryReconciliationVerificationReceiptPackage(settings,{result:'invalid'});assert.equal(pkg.receipts.length,1);assert.deepEqual(Object.keys(pkg.receipts[0]).sort(),['algorithm','at','format','result','rowCount']);assert.equal(JSON.stringify(pkg).includes('checksum'),false);let cleared=clearRecoveryReconciliationVerificationReceipts(settings,{result:'invalid'},false);assert.equal(cleared.changed,false);assert.equal(cleared.reason,'confirmation-required');cleared=clearRecoveryReconciliationVerificationReceipts(settings,{result:'invalid'},true);assert.equal(cleared.changed,true);assert.equal(cleared.removed,1);assert.equal(cleared.settings.recoveryReconciliationReportVerificationReceipts[0].result,'valid');
});

test('L115 freshness policy is bounded and review gate never authorizes retirement',()=>{
  const evidence={compatibilityEvidenceRecords:[{module:'legacy.js',flow:'overview',observed:true,active:false,at:'2026-08-01T00:00:00.000Z'}]};let settings=setCompatibilityEvidenceFreshnessPolicy(evidence,14);assert.equal(compatibilityEvidenceFreshnessPolicy(settings).freshDays,14);const review=buildCompatibilityEvidenceFreshnessReview(settings,'2026-09-08T00:00:00.000Z');assert.equal(review.attentionRequired,true);assert.equal(review.modules[0].staleFlows.includes('overview'),true);assert.equal(review.modules[0].axeRecheckRequired,true);assert.equal(review.retirementAllowed,false);assert.equal(review.actionsApplied,false);const gate=compatibilityEvidenceFreshnessGate(settings,'2026-09-08T00:00:00.000Z');assert.equal(gate.ready,false);assert.equal(gate.retirementAllowed,false);assert.equal(gate.actionsApplied,false);settings=setCompatibilityEvidenceFreshnessPolicy(settings,99999);assert.equal(compatibilityEvidenceFreshnessPolicy(settings).freshDays,3650);settings=resetCompatibilityEvidenceFreshnessPolicy(settings);assert.equal(compatibilityEvidenceFreshnessPolicy(settings).freshDays,30);
});
