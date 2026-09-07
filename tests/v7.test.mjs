import test from 'node:test';
import assert from 'node:assert/strict';
import { scanChildConsistency, scanStateConsistency } from '../src/core/consistency.js';
import { normalizeRetentionPolicy, retentionPreview, applyRetentionRemoval } from '../src/core/retention.js';
import { summarizeDevelopmentYear, compareDevelopmentYears } from '../src/core/yearly-summary.js';
import { buildPrintableReport, DEFAULT_PRINT_SECTIONS } from '../src/core/print-report.js';

test('consistency scanner reports duplicate ids malformed dates and dangling references without mutation', () => {
  const child = {
    id:'c1',
    learningGoals:[{id:'dup',title:'Goal'}],
    skills:[{id:'s1',name:'Logic',date:'bad-date'}],
    healthRecords:[],physicalActivities:[],nutritionLogs:[],portfolio:[{id:'p1',title:'P',date:'2026-01-01'}],reminders:[],attachments:[],habits:[],roadmap:[],
    evidenceLinks:[{id:'l1',goalId:'missing',evidenceType:'portfolio',evidenceId:'p1'}]
  };
  const snapshot = structuredClone(child);
  const issues = scanChildConsistency(child);
  assert.ok(issues.some((entry)=>entry.type==='malformed_date'));
  assert.ok(issues.some((entry)=>entry.type==='dangling_evidence_reference'));
  assert.deepEqual(child,snapshot);

  const state = { children:[child,{...child,id:'c1'}], selectedChildId:'missing-child', family:{members:[{id:'m1'},{id:'m1'}],activeMemberId:'missing-member'} };
  const stateReport = scanStateConsistency(state);
  assert.ok(stateReport.issues.some((entry)=>entry.type==='duplicate_id' && entry.collection==='children'));
  assert.ok(stateReport.issues.some((entry)=>entry.type==='dangling_selected_child'));
  assert.ok(stateReport.issues.some((entry)=>entry.type==='dangling_active_member'));
});

test('retention remains manual, previews old records and removes only selected dataset candidates', () => {
  const child = {
    reminders:[
      {id:'same',date:'2020-01-01',completed:true,title:'old reminder'},
      {id:'new-r',date:'2026-01-01',completed:true,title:'new reminder'},
      {id:'open-r',date:'2020-01-01',completed:false,title:'open reminder'}
    ],
    physicalActivities:[
      {id:'same',date:'2020-01-01',activity:'old walk'},
      {id:'new-p',date:'2026-01-01',activity:'new walk'}
    ]
  };
  const policy = normalizeRetentionPolicy({keepYears:3,datasets:['completedReminders']});
  assert.equal(policy.mode,'manual');
  assert.equal(policy.requireArchiveBeforeRemoval,true);
  const preview = retentionPreview(child,policy,new Date('2026-09-07T00:00:00'));
  assert.equal(preview.cutoff,'2023-09-07');
  assert.deepEqual(preview.candidates.completedReminders.map((x)=>x.id),['same']);
  assert.equal(preview.candidates.physicalActivities,undefined);
  const result = applyRetentionRemoval(child,preview);
  assert.deepEqual(result.child.reminders.map((x)=>x.id),['new-r','open-r']);
  assert.deepEqual(result.child.physicalActivities.map((x)=>x.id),['same','new-p'],'same id in unselected collection must remain');
  assert.equal(result.removed.length,1);
  assert.equal(child.reminders.length,3,'source child must not be mutated');
});

test('yearly summaries describe recorded activity without producing a score', () => {
  const child = {
    learningGoals:[{id:'g1',title:'Goal',dueDate:'2026-02-01'}],
    skills:[{id:'s1',name:'Logic',date:'2026-03-01',level:7},{id:'s0',name:'Read',date:'2025-03-01',level:6}],
    healthRecords:[],
    physicalActivities:[{id:'p1',date:'2026-04-01',activity:'Bơi',minutes:30},{id:'p0',date:'2025-04-01',activity:'Bơi',minutes:10}],
    nutritionLogs:[],
    habits:[{id:'h1',title:'Đọc',logs:['2026-01-01','2026-01-02','2025-01-01']}],
    portfolio:[{id:'pf1',title:'Dự án',date:'2026-05-01'}],roadmap:[],reminders:[],attachments:[],evidenceLinks:[]
  };
  const current = summarizeDevelopmentYear(child,2026);
  assert.equal(current.physicalMinutes,30);
  assert.equal(current.habitLogCount,2);
  assert.equal(current.portfolioCount,1);
  const comparison = compareDevelopmentYears(child,2026);
  assert.equal(comparison.differences.physicalMinutes,20);
  assert.match(comparison.note,/không phải điểm số|không phải.*xếp hạng/i);
  assert.equal('score' in comparison,false);
});

test('printable report excludes health by default and includes it only when explicitly selected', () => {
  assert.equal(DEFAULT_PRINT_SECTIONS.includes('health'),false);
  const child = {name:'<Bé A>',school:'Trường & A',className:'1A',developmentProfile:{strengths:['Kể chuyện'],interests:[],supportNeeds:[]},education:{targetOutcomes:[]},learningGoals:[],skills:[],habits:[],portfolio:[],roadmap:[],healthRecords:[{date:'2026-09-01',height:120,weight:24,sleep:9}]};
  const safe = buildPrintableReport(child);
  assert.doesNotMatch(safe,/chiều cao 120/);
  assert.match(safe,/&lt;Bé A&gt;/);
  const explicit = buildPrintableReport(child,{sections:['profile','health']});
  assert.match(explicit,/Sức khỏe — chỉ vì đã được chọn rõ ràng/);
  assert.match(explicit,/chiều cao 120/);
});
