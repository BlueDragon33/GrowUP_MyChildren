function normalizeForJson(value) {
  if (Array.isArray(value)) return value.map(normalizeForJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().filter((key) => value[key] !== undefined).map((key) => [key, normalizeForJson(value[key])]));
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(normalizeForJson(value));
}

export async function sha256(text) {
  const bytes = new TextEncoder().encode(String(text));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function backupPreview(payload = {}) {
  const children = Array.isArray(payload.children) ? payload.children : [];
  return {
    schemaVersion: Number(payload.version) || null,
    familyName: payload.family?.name || 'Gia đình của tôi',
    children: children.length,
    goals: children.reduce((n, child) => n + (child.learningGoals?.length || 0), 0),
    healthRecords: children.reduce((n, child) => n + (child.healthRecords?.length || 0), 0),
    attachments: children.reduce((n, child) => n + (child.attachments?.length || 0), 0),
    reminders: children.reduce((n, child) => n + (child.reminders?.length || 0), 0)
  };
}

export async function buildBackupEnvelope(payload) {
  const checksum = await sha256(stableStringify(payload));
  return {
    format: 'growup-backup-v1',
    generatedAt: new Date().toISOString(),
    schemaVersion: Number(payload?.version) || null,
    checksum: { algorithm: 'SHA-256', value: checksum },
    preview: backupPreview(payload),
    payload
  };
}

export async function verifyBackupEnvelope(input) {
  const envelope = typeof input === 'string' ? JSON.parse(input) : input;
  if (!envelope || envelope.format !== 'growup-backup-v1' || !envelope.payload) throw new Error('Không phải tệp backup GrowUP có integrity manifest.');
  if (envelope.checksum?.algorithm !== 'SHA-256' || !envelope.checksum.value) throw new Error('Backup thiếu checksum SHA-256.');
  const actual = await sha256(stableStringify(envelope.payload));
  return {
    valid: actual === envelope.checksum.value,
    expectedChecksum: envelope.checksum.value,
    actualChecksum: actual,
    preview: backupPreview(envelope.payload),
    payload: envelope.payload
  };
}
