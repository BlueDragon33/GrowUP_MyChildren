import { validateEvidenceLink } from './evidence.js';

export function evidenceLinkIssues(child) {
  const links = Array.isArray(child?.evidenceLinks) ? child.evidenceLinks : [];
  return links.map((link) => {
    const resolved = validateEvidenceLink(child, link);
    if (resolved.valid) return null;
    const reasons = [];
    if (!resolved.goal) reasons.push('goal_missing');
    if (!resolved.evidence) reasons.push('evidence_missing');
    return { link, reasons, goal: resolved.goal, evidence: resolved.evidence };
  }).filter(Boolean);
}

export function evidenceIntegritySummary(child) {
  const total = Array.isArray(child?.evidenceLinks) ? child.evidenceLinks.length : 0;
  const issues = evidenceLinkIssues(child);
  return { total, valid: total - issues.length, orphaned: issues.length, issues };
}

export function repairEvidenceLinks(child, { strategy = 'prune' } = {}) {
  if (strategy !== 'prune') throw new Error('Chiến lược sửa liên kết chưa được hỗ trợ.');
  const links = Array.isArray(child?.evidenceLinks) ? child.evidenceLinks : [];
  const removed = [];
  const kept = [];
  for (const link of links) {
    if (validateEvidenceLink(child, link).valid) kept.push(link);
    else removed.push(link);
  }
  return {
    child: { ...child, evidenceLinks: kept },
    removed,
    kept,
    changed: removed.length > 0
  };
}
