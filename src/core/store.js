import { CURRENT_SCHEMA_VERSION, blankStateV3, migrateState } from './schema.js';

const STORAGE_KEY = 'growup_mychildren_v1';
const MAX_AUDIT_ITEMS = 200;

export function blankState() {
  return blankStateV3();
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    return migrateState(JSON.parse(raw));
  } catch {
    return blankState();
  }
}

export function appendAudit(state, type = 'state_saved', details = {}) {
  return {
    ...state,
    auditLog: [
      ...(Array.isArray(state.auditLog) ? state.auditLog : []),
      { at: new Date().toISOString(), type, ...details }
    ].slice(-MAX_AUDIT_ITEMS)
  };
}

export function saveState(state) {
  let migrated = migrateState({ ...state, version: CURRENT_SCHEMA_VERSION });
  migrated = appendAudit(migrated, 'state_saved', { childId: migrated.selectedChildId || null });
  migrated.settings = { ...migrated.settings, lastSavedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  return migrated;
}

export function exportState(state) {
  const migrated = migrateState({ ...state, version: CURRENT_SCHEMA_VERSION });
  return JSON.stringify({ ...migrated, exportedAt: new Date().toISOString() }, null, 2);
}

export function validateImportedState(input) {
  let parsed;
  try {
    parsed = typeof input === 'string' ? JSON.parse(input) : input;
  } catch {
    throw new Error('Tệp dữ liệu không phải JSON hợp lệ.');
  }
  return migrateState(parsed);
}
