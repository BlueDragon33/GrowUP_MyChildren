import test from 'node:test';
import assert from 'node:assert/strict';
import { childDataPortabilityMap } from '../src/core/portability-map.js';
import { familyWorkloadWindow, familyWorkloadWindows } from '../src/core/family-workload.js';
import { saveSearchView, savedSearchViews } from '../src/core/saved-search.js';
import { setRecoverySchedule, recoveryReminderCandidate } from '../src/core/recovery-schedule.js';
import { compatibilityUsageSnapshot, retirementCandidates } from '../src/core/runtime-compatibility.js';

const state={children:[{id:'c1',learningGoals:[{id:'g1'}],skills:[],portfolio:[{id:'p1'}],attachments:[],healthRecords:[{id:'h1'}],nutritionLogs:[{id:'n1'}]}],settings:{familyPlanItems:[{id:'a',childId:'c1',date:'2026-09-07',title:'A',minutes:60},{id:'b',childId:'c1',date:'2026-09-08',title:'B',minutes:90}]},auditLog:[{}]};

test('portability map keeps sensitive modules out of safe-export mode',()=>{
  const rows=childDataPortabilityMap(state);
  assert.equal(rows.find((r)=>r.key==='learning').mode,'safe-export');
  assert.equal(rows.find((r)=>r.key==='health').mode,'encrypted-backup-only');
  assert.equal(rows.find((r)=>r.key==='nutrition').mode,'encrypted-backup-only');
});

test('workload windows summarize time neutrally without child ranking',()=>{
  const row=familyWorkloadWindow(state.settings.familyPlanItems,'2026-09-07',7);
  assert.equal(row.commitments,2);assert.equal(row.totalMinutes,150);assert.equal(row.activeDays,2);assert.equal(row.averageMinutesPerActiveDay,75);
  assert.deepEqual(familyWorkloadWindows(state.settings.familyPlanItems,'2026-09-07').map((x)=>x.days),[7,14,30]);
  assert.equal('score' in row,false);assert.equal('rank' in row,false);
});

test('saved search persists normalized criteria only and rejects unsafe datasets',()=>{
  const settings=saveSearchView({}, {id:'v1',name:'Học tập',query:'Toán',datasets:['learning','health','nutrition'],childId:'c1',domainId:'math',fromDate:'2026-09-01',toDate:'2026-09-30',results:[{secret:'x'}]});
  const [view]=savedSearchViews(settings);
  assert.deepEqual(view.datasets,['learning']);
  assert.equal('results' in view,false);
  assert.equal('secret' in view,false);
});

test('recovery schedule stores checklist metadata and returns reminder candidate only when enabled',()=>{
  const settings=setRecoverySchedule({}, {enabled:true,cadence:'quarterly',nextDate:'2026-10-01',reminderEnabled:true,checklist:{backupExists:true,passphraseAvailable:true,dryRunReviewed:false},passphrase:'never-store'});
  assert.equal('passphrase' in settings.recoveryDrillSchedule,false);
  const reminder=recoveryReminderCandidate(settings);
  assert.equal(reminder.date,'2026-10-01');assert.equal(reminder.source,'recovery-drill');
});

test('compatibility snapshot reports observation and never treats one view as deletion proof',()=>{
  const root={querySelector:(selector)=>selector.includes('#v9SearchForm')?{}:null};
  const snapshot=compatibilityUsageSnapshot(root);
  assert.ok(snapshot.some((x)=>x.module==='v9-runtime.js'&&x.active));
  assert.ok(retirementCandidates(snapshot).length>0);
  assert.ok(snapshot.every((x)=>typeof x.selector==='string'));
});
