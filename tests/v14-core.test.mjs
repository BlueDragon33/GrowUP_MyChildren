import test from 'node:test';
import assert from 'node:assert/strict';
import { exportVerificationReceipts, recordExportVerificationReceipt } from '../src/core/export-verification-history.js';
import { applyWorkloadDisplayPreset, resetWorkloadDisplayPreset, matchingWorkloadPresetId } from '../src/core/workload-presets.js';
import { buildSavedSearchCriteriaPackage, previewSavedSearchCriteriaImport, applySavedSearchCriteriaImport, SAVED_SEARCH_PACKAGE_FORMAT } from '../src/core/saved-search-package.js';
import { recoveryCalendarCandidates, recoveryRemindersToIcs } from '../src/core/recovery-calendar-bridge.js';
import { buildLegacyRetirementDryRun, RETIREMENT_DRY_RUN_FORMAT } from '../src/core/retirement-dry-run.js';
import { COMPATIBILITY_REQUIRED_FLOWS } from '../src/core/compatibility-evidence.js';

function recoveryState(){return {version:5,children:[{id:'c1',name:'Private Child Name',reminders:[{id:'r1',title:'Recovery A',date:'2026-10-15',type:'recovery',source:'recovery-drill',completed:false,lineage:{originDate:'2026-10-01'}},{id:'r2',title:'Recovery B',date:'2026-11-15',type:'recovery',source:'recovery-drill',completed:true,lineage:{originDate:'2026-11-01'}}]}]};}

test('verification receipt history is bounded and stores metadata only',()=>{
  let settings={};
  for(let i=0;i<55;i+=1)settings=recordExportVerificationReceipt(settings,{format:'growup-safe-export-integrity-v1',algorithm:'SHA-256',valid:i%2===0,expected:'raw-secret',actual:'raw-secret-2',payload:'child-secret'},`2026-09-${String((i%28)+1).padStart(2,'0')}T00:00:00.000Z`);
  const receipts=exportVerificationReceipts(settings);
  assert.equal(receipts.length,50);
  assert.deepEqual(Object.keys(receipts[0]).sort(),['algorithm','at','checksumResult','format']);
  const serialized=JSON.stringify(receipts);
  assert.equal(serialized.includes('raw-secret'),false);
  assert.equal(serialized.includes('child-secret'),false);
  assert.ok(receipts.every((item)=>['valid','invalid'].includes(item.checksumResult)));
});

test('workload presets are neutral local settings and reset reversibly',()=>{
  let result=applyWorkloadDisplayPreset({},'compact');
  assert.equal(result.changed,true);
  assert.equal(result.settings.workloadDisplayBands.firstMax,30);
  assert.equal(result.settings.workloadDisplayBands.secondMax,90);
  assert.equal(matchingWorkloadPresetId(result.settings),'compact');
  assert.equal('childId' in result.settings.workloadDisplayBands,false);
  assert.equal('score' in result.settings.workloadDisplayBands,false);
  assert.equal('rank' in result.settings.workloadDisplayBands,false);
  result=resetWorkloadDisplayPreset(result.settings);
  assert.equal(result.settings.workloadDisplayBands.firstMax,60);
  assert.equal(result.settings.workloadDisplayBands.secondMax,180);
  assert.equal(matchingWorkloadPresetId(result.settings),'standard');
});

test('saved-search package is criteria-only with duplicate-safe preview and import',()=>{
  const settings={savedSafeSearchViews:[{id:'a',name:'A',query:'math',datasets:['learning','health'],limit:20,result:'result-secret',snippet:'snippet-secret'}]};
  const pkg=buildSavedSearchCriteriaPackage(settings);
  assert.equal(pkg.format,SAVED_SEARCH_PACKAGE_FORMAT);
  const exported=JSON.stringify(pkg);
  assert.equal(exported.includes('result-secret'),false);
  assert.equal(exported.includes('snippet-secret'),false);
  assert.deepEqual(pkg.views[0].datasets,['learning']);
  const incoming={format:SAVED_SEARCH_PACKAGE_FORMAT,version:1,views:[{id:'dup',name:'Dup',query:'math',datasets:['learning'],limit:20},{id:'b',name:'B',query:'science',datasets:['learning','health'],limit:20,results:['secret']} ]};
  const preview=previewSavedSearchCriteriaImport(incoming,settings);
  assert.equal(preview.valid,true);
  assert.equal(preview.duplicates,1);
  assert.equal(preview.accepted,1);
  assert.equal(preview.strippedUnsafeDatasetEntries,1);
  const applied=applySavedSearchCriteriaImport(settings,incoming);
  assert.equal(applied.changed,true);
  assert.equal(applied.added,1);
  assert.equal(JSON.stringify(applied.settings).includes('secret'),false);
  assert.deepEqual(applied.settings.savedSafeSearchViews.find((item)=>item.query==='science').datasets,['learning']);
});

test('recovery calendar bridge exports only explicitly selected reminders and minimal lineage',()=>{
  const state=recoveryState();
  assert.equal(recoveryCalendarCandidates(state,'c1').length,2);
  const none=recoveryRemindersToIcs(state,'c1',[]);
  assert.equal(none.includes('BEGIN:VEVENT'),false);
  const ics=recoveryRemindersToIcs(state,'c1',['r1']);
  assert.equal(ics.includes('Recovery A'),true);
  assert.equal(ics.includes('Recovery B'),false);
  assert.equal(ics.includes('X-GROWUP-SOURCE:recovery-drill'),true);
  assert.equal(ics.includes('X-GROWUP-ORIGIN-DATE:20261001'),true);
  assert.equal(ics.includes('Private Child Name'),false);
  assert.equal(ics.includes('passphrase'),false);
});

test('legacy retirement dry-run produces report only and never applies removals',()=>{
  const definitions=[{module:'legacy.js',selector:'[data-legacy]'}];
  const evidence=COMPATIBILITY_REQUIRED_FLOWS.map((flow)=>({module:'legacy.js',flow,observed:true,active:false}));
  let pkg=buildLegacyRetirementDryRun({evidenceRecords:evidence,runtimeEntrySource:"import './app.js';",definitions});
  assert.equal(pkg.format,RETIREMENT_DRY_RUN_FORMAT);
  assert.deepEqual(pkg.candidates,['legacy.js']);
  assert.equal(pkg.proposedDiff[0].action,'remove-in-separate-commit');
  assert.equal(pkg.removalsApplied,false);
  assert.equal(pkg.safeToRemoveAutomatically,false);
  assert.equal(pkg.requiresSeparateRemovalCommit,true);
  pkg=buildLegacyRetirementDryRun({evidenceRecords:evidence,runtimeEntrySource:"import './legacy.js';",definitions});
  assert.deepEqual(pkg.candidates,[]);
  assert.equal(pkg.removalsApplied,false);
});
