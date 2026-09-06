import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { canRole, PERMISSIONS, FAMILY_ROLES, rolePermissions } from '../src/core/roles.js';
import { reminderState, summarizeReminders, notificationCapability } from '../src/core/reminders.js';
import { buildBackupEnvelope, verifyBackupEnvelope } from '../src/core/backup.js';
import { templatesForAge } from '../src/core/templates.js';
import { buildFamilyReport } from '../src/core/report.js';
import { migrateState, CURRENT_SCHEMA_VERSION } from '../src/core/schema.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

test('family role policy grants owner more permissions than viewer', () => {
  assert.equal(canRole(FAMILY_ROLES.OWNER, PERMISSIONS.FAMILY_MANAGE), true);
  assert.equal(canRole(FAMILY_ROLES.VIEWER, PERMISSIONS.HEALTH_WRITE), false);
  assert.ok(rolePermissions(FAMILY_ROLES.OWNER).length > rolePermissions(FAMILY_ROLES.VIEWER).length);
  const migrated = migrateState({ version:3, children:[] });
  assert.equal(migrated.version, CURRENT_SCHEMA_VERSION);
  assert.equal(migrated.family.members[0].role, 'owner');
});

test('reminder engine separates overdue today upcoming and completed', () => {
  const now = new Date(2026, 8, 6, 12, 0, 0);
  assert.equal(reminderState({date:'2026-09-05'}, now), 'overdue');
  assert.equal(reminderState({date:'2026-09-06'}, now), 'today');
  assert.equal(reminderState({date:'2026-09-07'}, now), 'upcoming');
  assert.equal(reminderState({date:'2026-09-05',completed:true}, now), 'completed');
  const summary = summarizeReminders([{date:'2026-09-05'},{date:'2026-09-06'},{date:'2026-09-07'},{date:'2026-09-01',completed:true}], now);
  assert.deepEqual({overdue:summary.overdue,today:summary.today,upcoming:summary.upcoming,completed:summary.completed},{overdue:1,today:1,upcoming:1,completed:1});
});

test('notification capability does not promise support without browser API', () => {
  assert.deepEqual(notificationCapability({}), { supported:false, permission:'unsupported', serviceWorker:false });
});

test('backup checksum validates original payload and detects tampering', async () => {
  const payload = { version:4, family:{name:'Gia đình'}, children:[{id:'c1',name:'A',healthRecords:[]}] };
  const envelope = await buildBackupEnvelope(payload);
  assert.equal((await verifyBackupEnvelope(envelope)).valid, true);
  envelope.payload.children[0].name = 'B';
  assert.equal((await verifyBackupEnvelope(envelope)).valid, false);
});

test('age-stage templates return appropriate stage without mandatory outcomes', () => {
  assert.equal(templatesForAge(4).stage.key, 'foundation');
  assert.equal(templatesForAge(10).stage.key, 'expansion');
  assert.equal(templatesForAge(17).stage.key, 'outcome');
  assert.ok(templatesForAge(10).templates.length >= 4);
});

test('longitudinal report excludes health by default and strips health notes when included', () => {
  const state = { version:4, family:{name:'Gia đình'}, children:[{id:'c1',name:'A',dateOfBirth:'2018-01-01',healthRecords:[{date:'2026-09-01',height:130,weight:30,sleep:9,note:'private'}],learningGoals:[],skills:[],portfolio:[],attachments:[],roadmap:[],physicalActivities:[],habits:[],reminders:[],developmentProfile:{},education:{}}] };
  const safe = buildFamilyReport(state, { includeHealth:false, onDate:new Date(2026,8,6) });
  assert.equal('healthMeasurements' in safe.children[0], false);
  const withHealth = buildFamilyReport(state, { includeHealth:true, onDate:new Date(2026,8,6) });
  assert.equal(withHealth.children[0].healthMeasurements[0].height, 130);
  assert.equal('note' in withHealth.children[0].healthMeasurements[0], false);
});
