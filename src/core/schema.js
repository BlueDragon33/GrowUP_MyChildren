export const CURRENT_SCHEMA_VERSION = 2;

function array(value) { return Array.isArray(value) ? value : []; }
function object(value, fallback = {}) { return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback; }

export function normalizeChild(child = {}) {
  return {
    ...child,
    id: child.id || null,
    name: typeof child.name === 'string' ? child.name : '',
    dateOfBirth: typeof child.dateOfBirth === 'string' ? child.dateOfBirth : '',
    gender: typeof child.gender === 'string' ? child.gender : '',
    school: typeof child.school === 'string' ? child.school : '',
    className: typeof child.className === 'string' ? child.className : '',
    createdAt: child.createdAt || new Date(0).toISOString(),
    learningGoals: array(child.learningGoals),
    skills: array(child.skills),
    healthRecords: array(child.healthRecords),
    physicalActivities: array(child.physicalActivities),
    nutritionLogs: array(child.nutritionLogs),
    habits: array(child.habits),
    assessments: array(child.assessments),
    portfolio: array(child.portfolio),
    roadmap: array(child.roadmap),
    reminders: array(child.reminders),
    developmentProfile: {
      strengths: array(child.developmentProfile?.strengths),
      interests: array(child.developmentProfile?.interests),
      supportNeeds: array(child.developmentProfile?.supportNeeds),
      notes: typeof child.developmentProfile?.notes === 'string' ? child.developmentProfile.notes : ''
    },
    education: {
      curriculum: child.education?.curriculum || '',
      languages: array(child.education?.languages),
      targetOutcomes: array(child.education?.targetOutcomes)
    },
    privacy: {
      screenLockEnabled: Boolean(child.privacy?.screenLockEnabled),
      hideHealthOnOverview: Boolean(child.privacy?.hideHealthOnOverview)
    }
  };
}

export function blankStateV2() {
  return {
    version: CURRENT_SCHEMA_VERSION,
    family: { name: 'Gia đình của tôi' },
    children: [],
    selectedChildId: null,
    settings: { compact: false, privacyMode: false, lastBackupAt: null, lastSavedAt: null },
    auditLog: [],
    integrations: {
      calendar: { provider: 'local', connected: false },
      cloud: { provider: null, connected: false }
    }
  };
}

export function migrateState(input) {
  if (!input || typeof input !== 'object') throw new Error('Dữ liệu GrowUP không hợp lệ.');
  if (!Array.isArray(input.children)) throw new Error('Dữ liệu GrowUP thiếu danh sách trẻ.');
  if (input.version != null && ![1, 2].includes(Number(input.version))) {
    throw new Error(`Phiên bản dữ liệu GrowUP ${input.version} chưa được hỗ trợ.`);
  }

  const base = blankStateV2();
  const migrated = {
    ...base,
    ...input,
    version: CURRENT_SCHEMA_VERSION,
    family: { ...base.family, ...object(input.family) },
    settings: { ...base.settings, ...object(input.settings) },
    integrations: {
      ...base.integrations,
      ...object(input.integrations),
      calendar: { ...base.integrations.calendar, ...object(input.integrations?.calendar) },
      cloud: { ...base.integrations.cloud, ...object(input.integrations?.cloud) }
    },
    children: input.children.map(normalizeChild),
    auditLog: array(input.auditLog).slice(-200)
  };

  if (migrated.selectedChildId && !migrated.children.some((child) => child.id === migrated.selectedChildId)) {
    migrated.selectedChildId = migrated.children[0]?.id || null;
  }
  return migrated;
}
