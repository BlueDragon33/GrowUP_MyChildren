import test from 'node:test';
import assert from 'node:assert/strict';
import { ageOnDate, stageForAge, bmi, progressPercent, childTemplate } from '../src/core/model.js';
import { validateImportedState } from '../src/core/store.js';
import { buildInsights } from '../src/core/insights.js';

test('ageOnDate handles birthday boundary', () => {
  assert.equal(ageOnDate('2016-09-07', new Date('2026-09-06T12:00:00Z')), 9);
  assert.equal(ageOnDate('2016-09-06', new Date('2026-09-06T12:00:00Z')), 10);
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

test('childTemplate creates required collections', () => {
  const child = childTemplate({ name: ' Bé A ', dateOfBirth: '2020-01-01' });
  assert.equal(child.name, 'Bé A');
  assert.deepEqual(child.learningGoals, []);
  assert.deepEqual(child.healthRecords, []);
});

test('import validation rejects invalid shapes', () => {
  assert.throws(() => validateImportedState('{"version":2}'));
  assert.equal(validateImportedState('{"version":1,"children":[]}').version, 1);
});

test('local advisor returns development-stage insight', () => {
  const child = childTemplate({ name: 'A', dateOfBirth: '2020-01-01' });
  const insights = buildInsights(child);
  assert.ok(insights.length >= 3);
  assert.match(insights[0].title, /Giai đoạn/);
});
