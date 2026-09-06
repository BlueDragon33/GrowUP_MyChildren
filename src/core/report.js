import { ageOnDate, stageForAge } from './model.js';
import { childSnapshot, recentHealthRecords } from './analytics.js';

function safeHealth(child) {
  return recentHealthRecords(child, 12).map(({ date, height, weight, sleep }) => ({ date, height, weight, sleep }));
}

export function buildChildReport(child, { includeHealth = false, onDate = new Date() } = {}) {
  const age = ageOnDate(child.dateOfBirth, onDate);
  const stage = stageForAge(age);
  const report = {
    id: child.id,
    name: child.name,
    dateOfBirth: child.dateOfBirth,
    age,
    stage: { key: stage.key, title: stage.title },
    school: child.school || '',
    className: child.className || '',
    developmentProfile: child.developmentProfile || {},
    education: child.education || {},
    learningGoals: child.learningGoals || [],
    skills: child.skills || [],
    portfolio: child.portfolio || [],
    attachments: child.attachments || [],
    roadmap: child.roadmap || [],
    snapshot: childSnapshot(child, onDate)
  };
  if (includeHealth) report.healthMeasurements = safeHealth(child);
  return report;
}

export function buildFamilyReport(state, options = {}) {
  return {
    format: 'growup-longitudinal-report-v1',
    generatedAt: new Date().toISOString(),
    schemaVersion: state.version,
    family: { name: state.family?.name || 'Gia đình của tôi' },
    includeHealth: Boolean(options.includeHealth),
    children: (state.children || []).map((child) => buildChildReport(child, options))
  };
}

export function reportToJson(report) {
  return JSON.stringify(report, null, 2);
}
