import test from 'node:test';
import assert from 'node:assert/strict';
import { evidenceLinkIssues, evidenceIntegritySummary, repairEvidenceLinks } from '../src/core/evidence-repair.js';
import { buildPortableArchive, validatePortableArchive } from '../src/core/archive.js';
import { filterTimeline, periodRange, summarizeTimeline } from '../src/core/timeline-filter.js';

test('evidence repair identifies and prunes only orphan links', () => {
  const child = {
    learningGoals:[{id:'g1',title:'Goal'}],
    portfolio:[{id:'p1',title:'Portfolio'}],
    attachments:[],
    evidenceLinks:[
      {id:'l1',goalId:'g1',evidenceType:'portfolio',evidenceId:'p1'},
      {id:'l2',goalId:'missing',evidenceType:'portfolio',evidenceId:'p1'},
      {id:'l3',goalId:'g1',evidenceType:'attachment',evidenceId:'missing'}
    ]
  };
  const issues = evidenceLinkIssues(child);
  assert.equal(issues.length, 2);
  assert.deepEqual(issues[0].reasons, ['goal_missing']);
  assert.deepEqual(issues[1].reasons, ['evidence_missing']);
  const summary = evidenceIntegritySummary(child);
  assert.equal(summary.valid, 1);
  assert.equal(summary.orphaned, 2);
  const repaired = repairEvidenceLinks(child);
  assert.equal(repaired.changed, true);
  assert.equal(repaired.removed.length, 2);
  assert.deepEqual(repaired.kept.map((link)=>link.id), ['l1']);
  assert.equal(child.evidenceLinks.length, 3, 'helper must not mutate source child');
});

test('portable archive defaults to non-health data and validates checksum/schema', async () => {
  const state = {
    version:5,
    family:{name:'Gia đình A'},
    children:[{
      id:'c1',name:'Bé A',dateOfBirth:'2020-01-01',learningGoals:[{id:'g1'}],skills:[],physicalActivities:[],habits:[],portfolio:[],roadmap:[],reminders:[],attachments:[],evidenceLinks:[],developmentProfile:{},education:{},healthRecords:[{height:120}],nutritionLogs:[{water:5}]
    }]
  };
  const archive = await buildPortableArchive(state);
  assert.equal(archive.manifest.schemaVersion, 5);
  assert.equal(archive.manifest.healthIncluded, false);
  assert.equal('healthRecords' in archive.payload.children[0], false);
  assert.equal('nutritionLogs' in archive.payload.children[0], false);
  const valid = await validatePortableArchive(archive);
  assert.equal(valid.valid, true);
  const tampered = structuredClone(archive);
  tampered.payload.children[0].name = 'Bị sửa';
  const invalid = await validatePortableArchive(tampered);
  assert.equal(invalid.valid, false);
  assert.equal(invalid.reason, 'checksum_mismatch');
  const tooNew = structuredClone(archive);
  tooNew.manifest.schemaVersion = 99;
  tooNew.manifest.checksum.value = archive.manifest.checksum.value;
  const compatibility = await validatePortableArchive(tooNew);
  assert.equal(compatibility.compatible, false);
  assert.equal(compatibility.reason, 'schema_too_new');
});

test('timeline period ranges and summaries handle month quarter and year', () => {
  assert.deepEqual(periodRange('2026-09-07','month'), {start:'2026-09-01',end:'2026-09-30',label:'Tháng 9/2026'});
  assert.deepEqual(periodRange('2026-09-07','quarter'), {start:'2026-07-01',end:'2026-09-30',label:'Quý 3/2026'});
  assert.deepEqual(periodRange('2026-09-07','year'), {start:'2026-01-01',end:'2026-12-31',label:'Năm 2026'});
  const events = [
    {date:'2026-09-01',kind:'skill'},
    {date:'2026-08-10',kind:'skill'},
    {date:'2026-07-03',kind:'portfolio'},
    {date:'2025-12-31',kind:'portfolio'}
  ];
  const quarter = filterTimeline(events,{reference:'2026-09-07',mode:'quarter'});
  assert.equal(quarter.events.length, 3);
  const summary = summarizeTimeline(quarter.events);
  assert.equal(summary.total, 3);
  assert.equal(summary.byKind.skill, 2);
  assert.equal(summary.byKind.portfolio, 1);
});
