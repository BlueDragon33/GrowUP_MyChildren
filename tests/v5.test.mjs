import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDevelopmentTimeline, timelineCounts } from '../src/core/timeline.js';
import { createEvidenceLink, validateEvidenceLink, evidenceForGoal, pruneInvalidEvidenceLinks } from '../src/core/evidence.js';
import { addPolicyMember, removePolicyMember, changePolicyMemberRole } from '../src/core/family-policy.js';
import { defaultOwnerMember } from '../src/core/roles.js';
import { SAFE_DATASETS, datasetRows, rowsToCsv, exportSelectedJson } from '../src/core/export.js';

test('development timeline is derived, sorted and hides health measurements', () => {
  const child = {
    learningGoals:[{id:'g1',title:'Đọc sách',dueDate:'2026-09-05'}],
    skills:[{id:'s1',name:'Logic',date:'2026-09-06',level:6}],
    healthRecords:[{id:'h1',date:'2026-09-07',height:123,weight:25}],
    physicalActivities:[{id:'p1',activity:'Bơi',date:'2026-09-04',minutes:30}],
    portfolio:[{id:'pf1',title:'Dự án',date:'2026-09-03'}],
    reminders:[], attachments:[]
  };
  const events = buildDevelopmentTimeline(child);
  assert.equal(events[0].kind, 'health');
  assert.equal(events[0].title, 'Bản ghi sức khỏe');
  assert.equal('height' in events[0], false);
  assert.equal('weight' in events[0], false);
  const counts = timelineCounts(events);
  assert.equal(counts.total, 5);
  assert.equal(counts.byKind.health, 1);
});

test('evidence links resolve goals and portfolio or attachment evidence', () => {
  const child = {
    learningGoals:[{id:'g1',title:'Mục tiêu 1'}],
    portfolio:[{id:'p1',title:'Sản phẩm 1'}],
    attachments:[{id:'a1',title:'Tệp 1'}],
    evidenceLinks:[]
  };
  const link = createEvidenceLink({ id:'l1', goalId:'g1', evidenceType:'portfolio', evidenceId:'p1', note:'Bằng chứng' });
  child.evidenceLinks.push(link);
  assert.equal(validateEvidenceLink(child, link).valid, true);
  assert.equal(evidenceForGoal(child, 'g1').length, 1);
  child.portfolio = [];
  assert.equal(validateEvidenceLink(child, link).valid, false);
  assert.deepEqual(pruneInvalidEvidenceLinks(child), []);
});

test('family policy protects final owner while allowing ordinary policy members', () => {
  const owner = defaultOwnerMember();
  let family = { name:'Gia đình', members:[owner], activeMemberId:owner.id };
  family = addPolicyMember(family, { id:'parent1', displayName:'Mẹ', role:'parent' });
  assert.equal(family.members.length, 2);
  family = changePolicyMemberRole(family, 'parent1', 'guardian');
  assert.equal(family.members.find((m)=>m.id==='parent1').role, 'guardian');
  assert.throws(() => removePolicyMember(family, owner.id), /owner cuối cùng/);
  family = removePolicyMember(family, 'parent1');
  assert.equal(family.members.length, 1);
});

test('safe export excludes health datasets and creates CSV/selected JSON', () => {
  assert.equal(SAFE_DATASETS.includes('healthRecords'), false);
  const child = { id:'c1', name:'Bé A', learningGoals:[{id:'g1',title:'Đọc',completed:false}], healthRecords:[{height:120}] };
  const rows = datasetRows(child, 'learningGoals');
  assert.equal(rows[0].childName, 'Bé A');
  assert.match(rowsToCsv(rows), /childName/);
  assert.throws(() => datasetRows(child, 'healthRecords'));
  const exported = exportSelectedJson({ children:[child] }, ['learningGoals','healthRecords']);
  assert.deepEqual(exported.datasets, ['learningGoals']);
  assert.equal(exported.healthIncluded, false);
  assert.equal('healthRecords' in exported.children[0], false);
});
