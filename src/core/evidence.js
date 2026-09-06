const EVIDENCE_TYPES = new Set(['attachment','portfolio']);

export function createEvidenceLink(input = {}) {
  const goalId = String(input.goalId || '').trim();
  const evidenceType = String(input.evidenceType || '').trim();
  const evidenceId = String(input.evidenceId || '').trim();
  if (!goalId) throw new Error('Liên kết minh chứng cần goalId.');
  if (!EVIDENCE_TYPES.has(evidenceType)) throw new Error('Loại minh chứng không được hỗ trợ.');
  if (!evidenceId) throw new Error('Liên kết minh chứng cần evidenceId.');
  return {
    id: input.id || `link_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`,
    goalId,
    evidenceType,
    evidenceId,
    note: String(input.note || '').trim(),
    createdAt: input.createdAt || new Date().toISOString()
  };
}

export function validateEvidenceLink(child, link) {
  const goal = (child?.learningGoals || []).find((item) => item.id === link.goalId);
  const collection = link.evidenceType === 'attachment' ? child?.attachments : child?.portfolio;
  const evidence = (collection || []).find((item) => item.id === link.evidenceId);
  return { valid:Boolean(goal && evidence), goal:goal || null, evidence:evidence || null };
}

export function evidenceForGoal(child, goalId) {
  return (child?.evidenceLinks || []).filter((link) => link.goalId === goalId).map((link) => ({ link, ...validateEvidenceLink(child, link) }));
}

export function pruneInvalidEvidenceLinks(child) {
  return (child?.evidenceLinks || []).filter((link) => validateEvidenceLink(child, link).valid);
}
