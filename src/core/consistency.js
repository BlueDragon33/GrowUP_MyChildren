import { validateEvidenceLink } from './evidence.js';

const COLLECTION_DATE_FIELDS = Object.freeze({
  learningGoals: ['dueDate','createdAt'],
  skills: ['date'],
  healthRecords: ['date'],
  physicalActivities: ['date'],
  nutritionLogs: ['date'],
  portfolio: ['date'],
  reminders: ['date'],
  attachments: ['createdAt'],
  evidenceLinks: ['createdAt']
});

function array(value) { return Array.isArray(value) ? value : []; }
function dateValid(value) {
  if (value == null || value === '') return true;
  const text = String(value);
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(text) ? `${text}T00:00:00` : text);
  return !Number.isNaN(parsed.getTime());
}
function issue(type, severity, details = {}) { return { type, severity, ...details }; }

function duplicateIds(items = [], context = {}) {
  const seen = new Set();
  const duplicates = [];
  for (const item of items) {
    const id = item?.id;
    if (!id) continue;
    if (seen.has(id)) duplicates.push(issue('duplicate_id','error',{ id, ...context }));
    seen.add(id);
  }
  return duplicates;
}

export function scanChildConsistency(child = {}) {
  const issues = [];
  const childId = child.id || null;
  for (const [collection, fields] of Object.entries(COLLECTION_DATE_FIELDS)) {
    const items = array(child[collection]);
    issues.push(...duplicateIds(items,{ childId, collection }));
    items.forEach((item,index) => fields.forEach((field) => {
      if (!dateValid(item?.[field])) issues.push(issue('malformed_date','warning',{ childId, collection, index, id:item?.id||null, field, value:item?.[field] }));
    }));
  }
  array(child.habits).forEach((habit,index) => {
    const logs = array(habit?.logs);
    const unique = new Set(logs);
    if (unique.size !== logs.length) issues.push(issue('duplicate_habit_log','warning',{ childId, collection:'habits', index, id:habit?.id||null }));
    logs.forEach((value) => { if (!dateValid(value)) issues.push(issue('malformed_date','warning',{ childId, collection:'habits', index, id:habit?.id||null, field:'logs', value })); });
  });
  issues.push(...duplicateIds(array(child.habits),{ childId, collection:'habits' }));
  issues.push(...duplicateIds(array(child.roadmap),{ childId, collection:'roadmap' }));
  array(child.evidenceLinks).forEach((link) => {
    const resolved = validateEvidenceLink(child, link);
    if (!resolved.valid) issues.push(issue('dangling_evidence_reference','error',{ childId, collection:'evidenceLinks', id:link?.id||null, goalId:link?.goalId||null, evidenceType:link?.evidenceType||null, evidenceId:link?.evidenceId||null }));
  });
  return issues;
}

export function scanStateConsistency(state = {}) {
  const issues = [];
  const children = array(state.children);
  issues.push(...duplicateIds(children,{ collection:'children' }));
  const childIds = new Set(children.map((child)=>child?.id).filter(Boolean));
  if (state.selectedChildId && !childIds.has(state.selectedChildId)) issues.push(issue('dangling_selected_child','error',{ selectedChildId:state.selectedChildId }));
  const members = array(state.family?.members);
  issues.push(...duplicateIds(members,{ collection:'family.members' }));
  const memberIds = new Set(members.map((member)=>member?.id).filter(Boolean));
  if (state.family?.activeMemberId && !memberIds.has(state.family.activeMemberId)) issues.push(issue('dangling_active_member','error',{ activeMemberId:state.family.activeMemberId }));
  children.forEach((child)=>issues.push(...scanChildConsistency(child)));
  return {
    scannedAt: new Date().toISOString(),
    issueCount: issues.length,
    errors: issues.filter((entry)=>entry.severity==='error').length,
    warnings: issues.filter((entry)=>entry.severity==='warning').length,
    issues
  };
}
