const SAFE_FIELDS = Object.freeze(['at','type','childId','memberId','removed','cutoff','keepYears','datasets','count','status','schemaVersion']);

function safePrimitive(value) {
  if (value == null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.filter((item) => ['string','number','boolean'].includes(typeof item)).slice(0, 20);
  return undefined;
}

export function sanitizeAuditEntry(entry = {}) {
  const clean = {};
  for (const key of SAFE_FIELDS) {
    const value = safePrimitive(entry[key]);
    if (value !== undefined) clean[key] = value;
  }
  clean.at = typeof clean.at === 'string' ? clean.at : '';
  clean.type = typeof clean.type === 'string' && clean.type ? clean.type : 'unknown';
  return clean;
}

export function auditExplorerEntries(state = {}, options = {}) {
  const type = String(options.type || '').trim();
  const childId = String(options.childId || '').trim();
  const limit = Math.min(200, Math.max(1, Number(options.limit) || 100));
  return (Array.isArray(state.auditLog) ? state.auditLog : [])
    .map(sanitizeAuditEntry)
    .filter((entry) => !type || entry.type === type)
    .filter((entry) => !childId || entry.childId === childId)
    .slice(-limit)
    .reverse();
}

export function auditTypeOptions(state = {}) {
  return [...new Set((Array.isArray(state.auditLog) ? state.auditLog : []).map((entry) => String(entry?.type || '').trim()).filter(Boolean))].sort();
}

function csvCell(value) {
  const text = Array.isArray(value) ? value.join('|') : String(value ?? '');
  return `"${text.replaceAll('"','""')}"`;
}

export function auditEntriesToCsv(entries = []) {
  const rows = entries.map(sanitizeAuditEntry);
  const header = SAFE_FIELDS;
  return [header.map(csvCell).join(','), ...rows.map((row) => header.map((key) => csvCell(row[key])).join(','))].join('\n');
}

export function auditEntriesToJson(entries = []) {
  return JSON.stringify({ format:'growup-audit-export-v1', generatedAt:new Date().toISOString(), entries:entries.map(sanitizeAuditEntry) }, null, 2);
}
