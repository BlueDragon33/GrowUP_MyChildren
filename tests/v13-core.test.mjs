import test from 'node:test';
import assert from 'node:assert/strict';
import { sha256Hex, verifySafeExportIntegrity } from '../src/core/export-integrity.js';
import { buildSafeExportPackage } from '../src/core/export-wizard.js';
import { normalizeWorkloadBandSettings, configuredWorkloadBand, setWorkloadBandSettings } from '../src/core/workload-band-settings.js';
import { familyWorkloadCalendar } from '../src/core/workload-calendar.js';
import { saveSearchView, savedSearchViews } from '../src/core/saved-search.js';
import { duplicateSavedSearchIds, findDuplicateSavedSearch, pinSavedSearch, moveSavedSearchToFolder, organizedSavedSearchViews } from '../src/core/saved-search-organizer.js';
import { integrateRecoveryReminder } from '../src/core/recovery-reminder.js';
import { completeRecoveryReminder, rescheduleRecoveryReminder, removeRecoveryReminder, recoveryReminderLifecycleHistory } from '../src/core/recovery-reminder-lifecycle.js';
import { firstLegacyRetirementReview, staticLegacyDependencyGraph } from '../src/core/retirement-review.js';
import { COMPATIBILITY_REQUIRED_FLOWS } from '../src/core/compatibility-evidence.js';

function state(){return {version:5,selectedChildId:'c1',children:[{id:'c1',name:'Child',learningGoals:[{id:'g1',title:'Read',subject:'Language',note:'omit-me'}],skills:[],portfolio:[],attachments:[],roadmap:[],reminders:[],healthRecords:[{id:'h1',note:'health-secret'}],nutritionLogs:[]}],settings:{recoveryDrillSchedule:{enabled:true,cadence:'quarterly',nextDate:'2026-10-01',reminderEnabled:true,checklist:{}}}};}

test('SHA-256 manifest verifies safe export and detects tampering without expanding data',()=>{
  assert.equal(sha256Hex('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  const pkg=buildSafeExportPackage(state(),{childIds:['c1'],datasets:['learningGoals','healthRecords']});
  assert.equal(pkg.manifest.algorithm,'SHA-256');
  assert.equal(pkg.manifest.childCount,1);
  assert.equal(pkg.manifest.datasetCount,1);
  assert.equal(pkg.manifest.recordCount,1);
  assert.equal(verifySafeExportIntegrity(pkg).valid,true);
  const serialized=JSON.stringify(pkg);
  assert.equal(serialized.includes('health-secret'),false);
  assert.equal(serialized.includes('omit-me'),false);
  assert.equal(serialized.includes('"note"'),false);
  const tampered=structuredClone(pkg);tampered.children[0].learningGoals[0].title='Changed';
  assert.equal(verifySafeExportIntegrity(tampered).valid,false);
});

test('configurable workload bands remain neutral and reject scoring labels',()=>{
  const config=normalizeWorkloadBandSettings({firstMax:30,secondMax:90,labels:{light:'Điểm cao',moderate:'Vừa',extended:'Dài',none:'Trống'}});
  assert.equal(config.firstMax,30);
  assert.equal(config.secondMax,90);
  assert.notEqual(config.labels.light,'Điểm cao');
  assert.equal(configuredWorkloadBand(45,config).key,'moderate');
  const settings=setWorkloadBandSettings({},config);
  const calendar=familyWorkloadCalendar([{date:'2026-09-02',minutes:45}],'2026-09-01',settings.workloadDisplayBands);
  const day=calendar.days.find((item)=>item.date==='2026-09-02');
  assert.equal(day.band,'moderate');
  assert.equal('score' in day,false);
  assert.equal('rank' in day,false);
});

test('saved-search organizer stores folder and pin metadata and detects criteria duplicates only',()=>{
  let settings={};
  settings=saveSearchView(settings,{id:'a',name:'A',query:'math',datasets:['learning'],limit:20});
  settings=saveSearchView(settings,{id:'b',name:'B',query:'math',datasets:['learning','health'],limit:20});
  assert.deepEqual(duplicateSavedSearchIds(settings),[['b','a']]);
  assert.equal(findDuplicateSavedSearch(settings,{id:'c',query:'math',datasets:['learning'],limit:20})?.id,'b');
  settings=pinSavedSearch(settings,'a',true);
  settings=moveSavedSearchToFolder(settings,'a','School');
  const a=savedSearchViews(settings).find((view)=>view.id==='a');
  assert.equal(a.pinned,true);assert.equal(a.folder,'School');
  assert.equal(organizedSavedSearchViews(settings)[0].id,'a');
  assert.equal(JSON.stringify(a).includes('result'),false);
  assert.equal(JSON.stringify(a).includes('snippet'),false);
  assert.deepEqual(a.datasets,['learning']);
});

test('recovery lifecycle preserves source/date lineage across complete reschedule and remove',()=>{
  const initial=integrateRecoveryReminder(state(),'c1');
  const id=initial.reminder.id;
  let step=completeRecoveryReminder(initial.state,'c1',id,true);
  assert.equal(step.changed,true);assert.equal(step.reminder.completed,true);
  step=rescheduleRecoveryReminder(step.state,'c1',id,'2026-10-15');
  assert.equal(step.changed,true);assert.equal(step.reminder.date,'2026-10-15');assert.equal(step.reminder.lineage.originDate,'2026-10-01');assert.deepEqual(step.reminder.lineage.previousDates,['2026-10-01']);
  const removed=removeRecoveryReminder(step.state,'c1',id);
  assert.equal(removed.changed,true);assert.equal(removed.removed.originDate,'2026-10-01');assert.equal(removed.removed.lastDate,'2026-10-15');
  const history=recoveryReminderLifecycleHistory(removed.state.settings);
  assert.deepEqual(history.map((item)=>item.action),['complete','reschedule','remove']);
  assert.equal(JSON.stringify(history).includes('passphrase'),false);
});

test('legacy retirement review requires full evidence and no runtime dependency and never auto-removes',()=>{
  const definitions=[{module:'legacy.js',selector:'[data-legacy]'}];
  const evidence=COMPATIBILITY_REQUIRED_FLOWS.map((flow)=>({module:'legacy.js',flow,observed:true,active:false}));
  assert.equal(staticLegacyDependencyGraph("import './legacy.js';",definitions)[0].referenced,true);
  let review=firstLegacyRetirementReview({evidenceRecords:evidence,runtimeEntrySource:"import './legacy.js';",definitions});
  assert.deepEqual(review.candidates,[]);assert.deepEqual(review.removed,[]);assert.equal(review.safeToRemoveAutomatically,false);
  review=firstLegacyRetirementReview({evidenceRecords:evidence,runtimeEntrySource:"import './app.js';",definitions});
  assert.deepEqual(review.candidates,['legacy.js']);assert.deepEqual(review.removed,[]);
  const incomplete=evidence.slice(0,-1);
  review=firstLegacyRetirementReview({evidenceRecords:incomplete,runtimeEntrySource:"import './app.js';",definitions});
  assert.deepEqual(review.candidates,[]);
});
