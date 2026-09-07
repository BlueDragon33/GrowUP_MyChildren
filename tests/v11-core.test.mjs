import test from 'node:test';
import assert from 'node:assert/strict';
import { dataPortabilityMap, dataPortabilitySummary } from '../src/core/data-portability.js';
import { familyWorkloadWindows } from '../src/core/workload-windows.js';
import { savedSearchViews, saveSearchView, searchViewFilters } from '../src/core/saved-searches.js';
import { updateRecoverySchedule, createRecoveryReminder, recoveryChecklistComplete } from '../src/core/recovery-schedule.js';
import { markCompatibilityLayer, compatibilityUsage, compatibilityRetirementPlan } from '../src/core/compatibility-usage.js';

test('portability map keeps health and nutrition outside safe export',()=>{
  const map=dataPortabilityMap(),summary=dataPortabilitySummary();
  assert.ok(summary['safe-exportable']>0);
  assert.equal(map.find((item)=>item.id==='health').mode,'encrypted-backup-only');
  assert.equal(map.find((item)=>item.id==='nutrition').mode,'encrypted-backup-only');
  assert.notEqual(map.find((item)=>item.id==='health').mode,'safe-exportable');
});

test('workload windows summarize 7 14 30 days without ranking fields',()=>{
  const items=[
    {id:'a',date:'2026-09-07',minutes:60},
    {id:'b',date:'2026-09-08',minutes:30},
    {id:'c',date:'2026-09-20',minutes:120}
  ];
  const windows=familyWorkloadWindows(items,'2026-09-07',{windows:[7,14,30],maxMinutesPerDay:180});
  assert.deepEqual(windows.map((item)=>item.days),[7,14,30]);
  assert.equal(windows[0].totalMinutes,90);
  assert.equal(windows[1].totalMinutes,210);
  assert.equal(windows[2].totalMinutes,210);
  const serialized=JSON.stringify(windows);
  for(const forbidden of ['rank','score','percentile','childScore'])assert.equal(serialized.includes(forbidden),false);
});

test('saved search views persist filters only and reject sensitive datasets',()=>{
  const settings=saveSearchView({}, {
    id:'view-1',label:'Portfolio AI',datasets:['portfolio','health','nutrition'],childId:'c1',domainId:'digital-ai',fromDate:'2026-09-01',toDate:'2026-09-30',limit:50,query:'private query',results:[{title:'secret'}]
  },{now:new Date('2026-09-07T00:00:00Z')});
  const views=savedSearchViews(settings),view=views[0];
  assert.deepEqual(view.datasets,['portfolio']);
  assert.deepEqual(Object.keys(view).sort(),['childId','createdAt','datasets','domainId','fromDate','id','label','limit','toDate']);
  assert.equal(JSON.stringify(views).includes('private query'),false);
  assert.equal(JSON.stringify(views).includes('secret'),false);
  assert.deepEqual(searchViewFilters(view).datasets,['portfolio']);
});

test('recovery schedule stores checklist metadata and reminder requires explicit request',()=>{
  const settings=updateRecoverySchedule({}, {enabled:true,nextDate:'2026-10-01',intervalDays:90,label:'Recovery check',checklist:{backupLocated:true,decryptTested:true,checksumVerified:true,restoreReviewed:true},passphrase:'never-store',ciphertext:'never-store'},{now:new Date('2026-09-07T00:00:00Z')});
  assert.equal(recoveryChecklistComplete(settings.recoverySchedule),true);
  const serialized=JSON.stringify(settings.recoverySchedule);
  assert.equal(serialized.includes('never-store'),false);
  assert.equal(createRecoveryReminder(settings.recoverySchedule,{requested:false}),null);
  const reminder=createRecoveryReminder(settings.recoverySchedule,{requested:true,id:'reminder-1'});
  assert.deepEqual(reminder,{id:'reminder-1',title:'Recovery check',date:'2026-10-01',type:'Gia đình',completed:false,source:'recovery-schedule'});
});

test('compatibility instrumentation stores module metadata only and never marks removal safe',()=>{
  const values=new Map();
  const env={sessionStorage:{getItem:(key)=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)}};
  assert.equal(markCompatibilityLayer('v4',env,new Date('2026-09-07T00:00:00Z')),true);
  assert.equal(markCompatibilityLayer('unknown',env),false);
  const usage=compatibilityUsage(env);
  assert.deepEqual(usage,[{id:'v4',count:1,lastSeenAt:'2026-09-07T00:00:00.000Z'}]);
  const plan=compatibilityRetirementPlan(env);
  assert.equal(plan.find((item)=>item.id==='v4').status,'active-observed');
  assert.equal(plan.every((item)=>item.removable===false),true);
  assert.equal(JSON.stringify(usage).includes('child'),false);
});
