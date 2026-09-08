import test from 'node:test';
import assert from 'node:assert/strict';
import { recordExportVerificationReceipt } from '../src/core/export-verification-history.js';
import { filterExportVerificationReceipts, buildExportVerificationReceiptPackage, clearExportVerificationReceipts, EXPORT_VERIFICATION_RECEIPT_PACKAGE_FORMAT } from '../src/core/export-verification-management.js';
import { validateCustomWorkloadPreset, saveCustomWorkloadPreset, buildCustomWorkloadPresetPackage, previewCustomWorkloadPresetImport, applyCustomWorkloadPresetImport, customWorkloadPresets } from '../src/core/workload-preset-library.js';
import { buildIntegritySavedSearchCriteriaPackage, verifySavedSearchCriteriaPackageIntegrity, recordSavedSearchPackageVerificationReceipt, savedSearchPackageVerificationReceipts } from '../src/core/saved-search-package-integrity.js';
import { previewRecoveryIcsReconciliation } from '../src/core/recovery-ics-reconciliation.js';
import { recoveryRemindersToIcs } from '../src/core/recovery-calendar-bridge.js';
import { recordCompatibilityFlowSnapshot, compatibilityEvidenceCoverage, storedCompatibilityEvidence } from '../src/core/compatibility-evidence-store.js';
import { COMPATIBILITY_REQUIRED_FLOWS } from '../src/core/compatibility-evidence.js';
import { buildLegacyRetirementDryRun } from '../src/core/retirement-dry-run.js';

function recoveryState(){return {version:5,children:[{id:'c1',name:'Private Child',reminders:[{id:'r1',title:'Recovery One',date:'2026-10-15',type:'recovery',source:'recovery-drill',completed:false,lineage:{originDate:'2026-10-01'}},{id:'r2',title:'Recovery Two',date:'2026-11-15',type:'recovery',source:'recovery-drill',completed:true,lineage:{originDate:'2026-11-01'}}]}]};}

test('L96 receipt management filters, exports metadata only and clears explicitly',()=>{
  let settings={};
  settings=recordExportVerificationReceipt(settings,{format:'fmt-a',algorithm:'SHA-256',valid:true,expected:'secret-checksum',payload:'child-secret'},'2026-09-01T00:00:00.000Z');
  settings=recordExportVerificationReceipt(settings,{format:'fmt-b',algorithm:'SHA-256',valid:false,actual:'secret-actual'},'2026-09-03T00:00:00.000Z');
  const filtered=filterExportVerificationReceipts(settings,{result:'invalid',fromDate:'2026-09-02'});
  assert.equal(filtered.length,1);assert.equal(filtered[0].format,'fmt-b');
  const pkg=buildExportVerificationReceiptPackage(settings,{result:'valid'});
  assert.equal(pkg.format,EXPORT_VERIFICATION_RECEIPT_PACKAGE_FORMAT);assert.equal(pkg.receipts.length,1);
  const serialized=JSON.stringify(pkg);assert.equal(serialized.includes('secret-checksum'),false);assert.equal(serialized.includes('secret-actual'),false);assert.equal(serialized.includes('child-secret'),false);
  assert.deepEqual(Object.keys(pkg.receipts[0]).sort(),['algorithm','at','checksumResult','format']);
  assert.equal(clearExportVerificationReceipts(settings).safeExportVerificationReceipts.length,0);
});

test('L97 custom workload preset library rejects scoring and child-linked semantics and previews import',()=>{
  const unsafe=validateCustomWorkloadPreset({name:'Điểm cao',childId:'c1',config:{firstMax:30,secondMax:60,labels:{none:'Không',light:'Xếp hạng tốt',moderate:'Vừa',extended:'Dài'}}});
  assert.equal(unsafe.valid,false);assert.ok(unsafe.reasons.includes('unsafe-name'));assert.ok(unsafe.reasons.includes('forbidden-key'));
  const safe={id:'weekend',name:'Cuối tuần',config:{firstMax:45,secondMax:120,labels:{none:'Không có kế hoạch',light:'Đến 45 phút',moderate:'46–120 phút',extended:'Trên 120 phút'}}};
  let saved=saveCustomWorkloadPreset({},safe);assert.equal(saved.changed,true);assert.equal(customWorkloadPresets(saved.settings).length,1);
  const pkg=buildCustomWorkloadPresetPackage(saved.settings);assert.equal(JSON.stringify(pkg).includes('childId'),false);assert.equal(JSON.stringify(pkg).match(/score|rank/ig),null);
  const incoming={format:pkg.format,version:1,presets:[safe,{id:'bad',name:'Rating',config:{firstMax:30,secondMax:90,labels:{none:'Không',light:'Nhẹ',moderate:'Vừa',extended:'Dài'}}},{id:'school',name:'Ngày học',config:{firstMax:30,secondMax:90,labels:{none:'Không có kế hoạch',light:'Đến 30 phút',moderate:'31–90 phút',extended:'Trên 90 phút'}}}]};
  const preview=previewCustomWorkloadPresetImport(incoming,saved.settings);assert.equal(preview.valid,true);assert.equal(preview.duplicates,1);assert.equal(preview.rejected,1);assert.equal(preview.accepted.length,1);
  const applied=applyCustomWorkloadPresetImport(saved.settings,incoming);assert.equal(applied.added,1);assert.equal(customWorkloadPresets(applied.settings).length,2);
});

test('L98 Saved Search integrity detects tamper and verification receipts never store checksum',()=>{
  const settings={savedSafeSearchViews:[{id:'a',name:'Math',query:'math',datasets:['learning','health'],limit:20,result:'secret-result'}]};
  const pkg=buildIntegritySavedSearchCriteriaPackage(settings);const verified=verifySavedSearchCriteriaPackageIntegrity(pkg);assert.equal(verified.valid,true);assert.deepEqual(pkg.views[0].datasets,['learning']);assert.equal(JSON.stringify(pkg).includes('secret-result'),false);
  const tampered=structuredClone(pkg);tampered.views[0].query='changed';assert.equal(verifySavedSearchCriteriaPackageIntegrity(tampered).valid,false);
  let receiptSettings=recordSavedSearchPackageVerificationReceipt({},verified,'2026-09-08T00:00:00.000Z');const receipts=savedSearchPackageVerificationReceipts(receiptSettings);assert.equal(receipts.length,1);assert.deepEqual(Object.keys(receipts[0]).sort(),['algorithm','at','format','result']);assert.equal(JSON.stringify(receipts).includes(pkg.manifest.checksum),false);
});

test('L99 Recovery ICS reconciliation reports metadata differences without mutating state',()=>{
  const state=recoveryState(),before=JSON.stringify(state),ics=recoveryRemindersToIcs(state,'c1',['r1','r2']);
  let preview=previewRecoveryIcsReconciliation(state,'c1',ics);assert.equal(preview.validCalendar,true);assert.equal(preview.same,2);assert.equal(preview.different,0);
  const changed=ics.replace('DTSTART;VALUE=DATE:20261015','DTSTART;VALUE=DATE:20261020');preview=previewRecoveryIcsReconciliation(state,'c1',changed);assert.equal(preview.different,1);assert.equal(preview.items.find((item)=>item.id==='r1').fileDate,'2026-10-20');assert.equal(JSON.stringify(state),before);assert.equal('apply' in preview,false);
  assert.equal(JSON.stringify(preview).includes('Private Child'),false);
});

test('L100 compatibility evidence store is bounded, deduped and requires all six flows before dry-run eligibility',()=>{
  let settings={};const snapshot=[{module:'legacy.js',active:false}];
  for(const flow of COMPATIBILITY_REQUIRED_FLOWS.slice(0,5))settings=recordCompatibilityFlowSnapshot(settings,flow,snapshot,`2026-09-08T0${COMPATIBILITY_REQUIRED_FLOWS.indexOf(flow)}:00:00.000Z`);
  let coverage=compatibilityEvidenceCoverage(settings);assert.equal(coverage.coveredFlows.length,5);assert.deepEqual(coverage.missingFlows,['axe']);assert.equal(coverage.completeModules.length,0);
  settings=recordCompatibilityFlowSnapshot(settings,'axe',snapshot,'2026-09-08T06:00:00.000Z');coverage=compatibilityEvidenceCoverage(settings);assert.equal(coverage.coveredFlows.length,6);assert.deepEqual(coverage.completeModules,['legacy.js']);
  settings=recordCompatibilityFlowSnapshot(settings,'overview',[{module:'legacy.js',active:true}],'2026-09-08T07:00:00.000Z');assert.equal(storedCompatibilityEvidence(settings).filter((item)=>item.module==='legacy.js'&&item.flow==='overview').length,1);coverage=compatibilityEvidenceCoverage(settings);assert.equal(coverage.matrix[0].activeAnywhere,true);
  const pkg=buildLegacyRetirementDryRun({evidenceRecords:coverage.records,runtimeEntrySource:"import './app.js';",definitions:[{module:'legacy.js',selector:'[data-legacy]'}]});assert.deepEqual(pkg.candidates,[]);assert.equal(pkg.removalsApplied,false);assert.equal(pkg.safeToRemoveAutomatically,false);
});
