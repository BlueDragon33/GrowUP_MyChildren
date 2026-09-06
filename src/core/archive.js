import { CURRENT_SCHEMA_VERSION } from './schema.js';
import { sha256, stableStringify } from './backup.js';

export const ARCHIVE_FORMAT = 'growup-archive-v1';

const BASE_DATASETS = [
  'learningGoals','skills','physicalActivities','habits','portfolio','roadmap','reminders',
  'attachments','evidenceLinks','developmentProfile','education'
];

function archiveChild(child = {}, includeHealth = false) {
  const data = {
    id: child.id || null,
    name: child.name || '',
    dateOfBirth: child.dateOfBirth || '',
    gender: child.gender || '',
    school: child.school || '',
    className: child.className || ''
  };
  for (const key of BASE_DATASETS) {
    const value = child[key];
    data[key] = Array.isArray(value) ? value : (value && typeof value === 'object' ? value : (key === 'developmentProfile' || key === 'education' ? {} : []));
  }
  if (includeHealth) {
    data.healthRecords = Array.isArray(child.healthRecords) ? child.healthRecords : [];
    data.nutritionLogs = Array.isArray(child.nutritionLogs) ? child.nutritionLogs : [];
  }
  return data;
}

export async function buildPortableArchive(state, { includeHealth = false, appVersion = '0.6.0' } = {}) {
  const payload = {
    family: { name: state?.family?.name || 'Gia đình của tôi' },
    children: (state?.children || []).map((child) => archiveChild(child, includeHealth))
  };
  const checksum = await sha256(stableStringify(payload));
  return {
    format: ARCHIVE_FORMAT,
    manifest: {
      generatedAt: new Date().toISOString(),
      schemaVersion: Number(state?.version) || CURRENT_SCHEMA_VERSION,
      appVersion,
      healthIncluded: Boolean(includeHealth),
      childCount: payload.children.length,
      datasets: includeHealth ? [...BASE_DATASETS, 'healthRecords', 'nutritionLogs'] : [...BASE_DATASETS],
      checksum: { algorithm: 'SHA-256', value: checksum }
    },
    payload
  };
}

export async function validatePortableArchive(input, { maxSchemaVersion = CURRENT_SCHEMA_VERSION } = {}) {
  let archive;
  try { archive = typeof input === 'string' ? JSON.parse(input) : input; }
  catch { throw new Error('Tệp archive không phải JSON hợp lệ.'); }
  if (!archive || archive.format !== ARCHIVE_FORMAT || !archive.manifest || !archive.payload) throw new Error('Không phải archive GrowUP hợp lệ.');
  if (archive.manifest.checksum?.algorithm !== 'SHA-256' || !archive.manifest.checksum.value) throw new Error('Archive thiếu checksum SHA-256.');
  const actualChecksum = await sha256(stableStringify(archive.payload));
  const checksumValid = actualChecksum === archive.manifest.checksum.value;
  const schemaVersion = Number(archive.manifest.schemaVersion) || 0;
  const compatible = schemaVersion > 0 && schemaVersion <= maxSchemaVersion;
  return {
    valid: checksumValid && compatible,
    checksumValid,
    compatible,
    schemaVersion,
    maxSchemaVersion,
    healthIncluded: Boolean(archive.manifest.healthIncluded),
    childCount: Array.isArray(archive.payload.children) ? archive.payload.children.length : 0,
    reason: !checksumValid ? 'checksum_mismatch' : (!compatible ? 'schema_too_new' : null),
    archive
  };
}
