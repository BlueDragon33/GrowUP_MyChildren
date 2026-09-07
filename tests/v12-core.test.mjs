import test from 'node:test';
import assert from 'node:assert/strict';
import { previewSafeExport, buildSafeExportPackage } from '../src/core/export-wizard.js';
import { familyWorkloadCalendar, workloadBand } from '../src/core/workload-calendar.js';
import { saveSearchView, renameSearchView, moveSearchView, resetSavedSearchViews, savedSearchViews, privacySafeSearchDefaults } from '../src/core/saved-search.js';
import { integrateRecoveryReminder, recoveryReminderStatus } from '../src/core/recovery-reminder.js';
import { compatibilityEvidenceMatrix, retirementEligibleModules, COMPATIBILITY_REQUIRED_FLOWS } from '../src/core/compatibility-evidence.js';

function state(){return {version:5,selectedChildId:'c1',children:[{id:'c1',name:'Child One',learningGoals:[{id:'g1',title:'Read',subject:'Language',note:'omit'}],skills:[],portfolio:[{id:'p1',title:'Project',type:'Project',date:'2026-09-08',note:'private portfolio note'}],attachments:[],roadmap:[],reminders:[],healthRecords:[{id:'h1',note:'health hidden'}],nutritionLogs:[{id:'n1',note:'nutrition hidden'}]}],settings:{recoveryDrillSchedule:{enabled:true,cadence:'quarterly',nextDate:'2026-10-01',reminderEnabled:true,checklist:{}}}};}

test('safe export wizard previews exact allowlisted fields and omits free text health nutrition',()=>{
  const source=state();
  const selection={childIds:['c1'],datasets:['learningGoals','portfolio','healthRecords']};
  const preview=previewSafeExport(source,selection);
  assert.equal(preview.childCount,1);
  assert.equal(preview.datasetCount,2);
  assert.equal(preview.healthIncluded,false);
  assert.equal(preview.nutritionIncluded,false);
  const pkg=buildSafeExportPackage(source,selection);
  const serialized=JSON.stringify(pkg);
  assert.equal(serialized.includes('private portfolio note'),false);
  assert.equal(serialized.includes('health hidden'),false);
  assert.equal(serialized.includes('nutrition hidden'),false);
  assert.equal(serialized.includes('"note"'),false);
  assert.deepEqual(pkg.datasets,['learningGoals','portfolio']);
});

test('workload calendar emits neutral minute bands and accessible text without score fields',()=>{
  const calendar=familyWorkloadCalendar([{date:'2026-09-02',title:'A',minutes:45},{date:'2026-09-03',title:'B',minutes:120},{date:'2026-09-04',title:'C',minutes:220}],'2026-09-01');
  assert.equal(calendar.days.find((d)=>d.date==='2026-09-02').band,'light');
  assert.equal(calendar.days.find((d)=>d.date==='2026-09-03').band,'moderate');
  assert.equal(calendar.days.find((d)=>d.date==='2026-09-04').band,'extended');
  assert.match(calendar.days[1].text,/phút/);
  assert.equal('score' in calendar.days[1],false);
  assert.equal('rank' in calendar.days[1],false);
  assert.equal(workloadBand(0).key,'none');
});

test('saved-search management renames reorders and resets criteria only',()=>{
  let settings={};
  settings=saveSearchView(settings,{id:'a',name:'A',query:'math',datasets:['learning']});
  settings=saveSearchView(settings,{id:'b',name:'B',query:'robot',datasets:['portfolio','health']});
  let views=savedSearchViews(settings);
  assert.deepEqual(views.map((v)=>v.id),['b','a']);
  assert.deepEqual(views[0].datasets,['portfolio']);
  settings=renameSearchView(settings,'b','Robot projects');
  settings=moveSearchView(settings,'a','up');
  views=savedSearchViews(settings);
  assert.deepEqual(views.map((v)=>v.id),['a','b']);
  assert.equal(views[1].name,'Robot projects');
  settings=resetSavedSearchViews(settings);
  assert.deepEqual(savedSearchViews(settings),[]);
  assert.ok(privacySafeSearchDefaults().datasets.every((name)=>!['health','nutrition'].includes(name)));
});

test('recovery reminder integrates once per source and date',()=>{
  const source=state();
  const first=integrateRecoveryReminder(source,'c1');
  assert.equal(first.created,true);
  assert.equal(first.reminder.source,'recovery-drill');
  assert.equal(first.reminder.date,'2026-10-01');
  const second=integrateRecoveryReminder(first.state,'c1');
  assert.equal(second.created,false);
  assert.equal(second.deduplicated,true);
  assert.equal(second.state.children[0].reminders.filter((r)=>r.source==='recovery-drill').length,1);
  const status=recoveryReminderStatus(second.state,'c1',new Date('2026-09-07T00:00:00'));
  assert.equal(status.state,'upcoming');
});

test('compatibility retirement requires every required flow and inactivity everywhere',()=>{
  const inactive=COMPATIBILITY_REQUIRED_FLOWS.map((flow)=>({module:'legacy.js',flow,observed:true,active:false}));
  let matrix=compatibilityEvidenceMatrix(inactive);
  assert.equal(matrix[0].complete,true);
  assert.equal(matrix[0].retirementEligible,true);
  assert.deepEqual(retirementEligibleModules(inactive),['legacy.js']);
  const missing=inactive.slice(0,-1);
  matrix=compatibilityEvidenceMatrix(missing);
  assert.equal(matrix[0].complete,false);
  assert.equal(matrix[0].retirementEligible,false);
  const active=[...inactive,{module:'legacy.js',flow:'overview',observed:true,active:true}];
  assert.deepEqual(retirementEligibleModules(active),[]);
});
