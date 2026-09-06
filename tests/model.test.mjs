import test from 'node:test';
import assert from 'node:assert/strict';
import { ageOnDate, stageForAge, bmi, progressPercent, childTemplate, todayKey } from '../src/core/model.js';
import { validateImportedState } from '../src/core/store.js';
import { buildInsights } from '../src/core/insights.js';

test('ageOnDate handles birthday boundary', () => {
  assert.equal(ageOnDate('2016-09-07', new Date('2026-09-06T12:00:00')), 9);
  assert.equal(ageOnDate('2016-09-06', new Date('2026-09-06T12:00:00')), 10);
});

test('stageForAge maps core age bands', () => {
  assert.equal(stageForAge(4).key, 'foundation');
  assert.equal(stageForAge(7).key, 'learning');
  assert.equal(stageForAge(10).key, 'expansion');
  assert.equal(stageForAge(13).key, 'strengths');
  assert.equal(stageForAge(17).key, 'outcome');
});

test('bmi validates inputs and calculates value', () => {
  assert.equal(bmi(140, 35), 17.9);
  assert.equal(bmi(0, 35), null);
  assert.equal(bmi(140, 0), null);
});

test('progressPercent calculates completed items', () => {
  assert.equal(progressPercent([]), 0);
  assert.equal(progressPercent([{completed:true},{completed:false}]), 50);
});

test('todayKey uses local calendar fields instead of UTC slicing', () => {
  const date = new Date(2026, 8, 6, 0, 15, 0);
  assert.equal(todayKey(date), '2026-09-06');
});

test('childTemplate creates current required collections and profile areas', () => {
  const child = childTemplate({ name: ' Bé A ', dateOfBirth: '2020-01-01' });
  assert.equal(child.name, 'Bé A');
  assert.deepEqual(child.learningGoals, []);
  assert.deepEqual(child.healthRecords, []);
  assert.deepEqual(child.assessments, []);
  assert.deepEqual(child.attachments, []);
  assert.deepEqual(child.evidenceLinks, []);
  assert.deepEqual(child.developmentProfile.interests, []);
});

test('import validation migrates v1-v4 to v5 and rejects unsupported versions', () => {
  assert.throws(() => validateImportedState('{"version":9,"children":[]}'));
  for (const version of [1,2,3,4]) {
    const migrated = validateImportedState(JSON.stringify({ version, children: [] }));
    assert.equal(migrated.version, 5);
  }
});

test('local advisor still returns development-stage insight after migration changes', () => {
  const child = childTemplate({ name: 'A', dateOfBirth: '2020-01-01' });
  const insights = buildInsights(child);
  assert.ok(insights.length >= 3);
  assert.match(insights[0].title, /Giai đoạn/);
});
