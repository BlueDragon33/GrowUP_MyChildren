import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateState, CURRENT_SCHEMA_VERSION, normalizeChild } from '../src/core/schema.js';
import { weeklyPhysicalMinutes, habitCompletionRate, recentHealthRecords } from '../src/core/analytics.js';
import { remindersToIcs } from '../src/core/calendar.js';

test('migrates v1 backup to current schema without losing child data', () => {
  const migrated = migrateState({ version: 1, children: [{ id:'c1', name:'A', learningGoals:[{title:'Đọc'}] }], selectedChildId:'c1' });
  assert.equal(migrated.version, CURRENT_SCHEMA_VERSION);
  assert.equal(migrated.children[0].learningGoals[0].title, 'Đọc');
  assert.deepEqual(migrated.children[0].developmentProfile.strengths, []);
  assert.equal(migrated.integrations.calendar.provider, 'local');
});

test('normalizeChild repairs missing collections', () => {
  const child = normalizeChild({ name:'B', habits:null, reminders:null });
  assert.deepEqual(child.habits, []);
  assert.deepEqual(child.reminders, []);
  assert.deepEqual(child.assessments, []);
});

test('weekly physical minutes only counts requested window', () => {
  const child = { physicalActivities:[{date:'2026-09-06',minutes:30},{date:'2026-09-01',minutes:20},{date:'2026-08-20',minutes:99}] };
  assert.equal(weeklyPhysicalMinutes(child, 7, new Date('2026-09-06T12:00:00')), 50);
});

test('habit completion rate uses habit-days denominator', () => {
  const child = { habits:[{logs:['2026-09-06','2026-09-05']},{logs:['2026-09-06']}] };
  assert.equal(habitCompletionRate(child, 2, new Date('2026-09-06T12:00:00')), 75);
});

test('recent health records sorts and limits values', () => {
  const child = { healthRecords:[{date:'2026-09-06',height:120},{date:'2026-08-01',height:118},{date:'bad'}] };
  assert.deepEqual(recentHealthRecords(child,1).map(x=>x.height), [120]);
});

test('ICS export emits valid calendar and reminder title', () => {
  const ics = remindersToIcs([{id:'r1',date:'2026-09-10',title:'Khám răng',type:'Sức khỏe'}], 'Gia đình');
  assert.match(ics,/BEGIN:VCALENDAR/);
  assert.match(ics,/DTSTART;VALUE=DATE:20260910/);
  assert.match(ics,/SUMMARY:Khám răng/);
});
