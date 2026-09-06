import test from 'node:test';
import assert from 'node:assert/strict';
import { createAttachmentMeta, normalizeUrl, attachmentStats } from '../src/core/attachments.js';
import { normalizeIntegration, integrationReady, publicIntegrationDescriptor, PROVIDERS } from '../src/core/integrations.js';
import { isSensitivePage, screenPrivacyLabel, redactHealthRecord } from '../src/core/privacy.js';
import { migrateState, CURRENT_SCHEMA_VERSION } from '../src/core/schema.js';

test('v2 state migrates to schema v3 and adds attachment collection', () => {
  const state = migrateState({ version:2, children:[{id:'c1',name:'A'}], selectedChildId:'c1' });
  assert.equal(state.version, CURRENT_SCHEMA_VERSION);
  assert.deepEqual(state.children[0].attachments, []);
  assert.equal(state.integrations.cloud.provider, 'cloud');
});

test('attachment metadata validates web URLs and preserves metadata only', () => {
  assert.equal(normalizeUrl('javascript:alert(1)'), '');
  const item = createAttachmentMeta({ title:'Chứng chỉ', kind:'certificate', url:'https://example.com/a' });
  assert.equal(item.kind, 'certificate');
  assert.match(item.url, /^https:/);
  assert.equal(attachmentStats([item]).byKind.certificate, 1);
});

test('integration adapter requires connected status and required scopes', () => {
  const i = normalizeIntegration({ provider:'google-calendar', status:'connected', scopes:['calendar-read'] });
  assert.equal(integrationReady(i,['calendar-read']), true);
  assert.equal(integrationReady(i,['calendar-write']), false);
  assert.equal(publicIntegrationDescriptor(PROVIDERS.GOOGLE_CALENDAR).requiresAuthorization, true);
});

test('screen privacy helpers mark health and nutrition as sensitive', () => {
  assert.equal(isSensitivePage('Sức khỏe'), true);
  assert.equal(isSensitivePage('Học tập'), false);
  assert.match(screenPrivacyLabel(true), /Hiện/);
  assert.equal(redactHealthRecord({height:120}, true).height, '•••');
});
