export const STAGES = [
  { min: 3, max: 5, key: 'foundation', title: 'Nền móng', focus: ['Ngôn ngữ', 'Vận động', 'Cảm xúc', 'Tự phục vụ', 'Tò mò'] },
  { min: 6, max: 8, key: 'learning', title: 'Năng lực học tập', focus: ['Đọc viết', 'Toán', 'Ngoại ngữ', 'Kỷ luật', 'Thể thao'] },
  { min: 9, max: 11, key: 'expansion', title: 'Mở rộng năng lực', focus: ['Khoa học', 'Công nghệ', 'Sáng tạo', 'Dự án', 'Trình bày'] },
  { min: 12, max: 14, key: 'strengths', title: 'Khám phá thế mạnh', focus: ['STEM', 'Ngôn ngữ', 'Nghệ thuật', 'Thể thao', 'Kỹ năng xã hội'] },
  { min: 15, max: 18, key: 'outcome', title: 'Định hướng đầu ra', focus: ['Học thuật', 'Portfolio', 'Ngoại ngữ', 'Nghề nghiệp', 'Tự lập'] }
];

export function makeId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ageOnDate(dateOfBirth, onDate = new Date()) {
  if (!dateOfBirth) return null;
  const birth = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  let age = onDate.getFullYear() - birth.getFullYear();
  const monthDiff = onDate.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && onDate.getDate() < birth.getDate())) age -= 1;
  return Math.max(0, age);
}

export function stageForAge(age) {
  if (age == null) return STAGES[0];
  return STAGES.find((stage) => age >= stage.min && age <= stage.max) || (age < 3 ? STAGES[0] : STAGES.at(-1));
}

export function bmi(heightCm, weightKg) {
  const h = Number(heightCm) / 100;
  const w = Number(weightKg);
  if (!h || !w || h <= 0 || w <= 0) return null;
  return Number((w / (h * h)).toFixed(1));
}

export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function progressPercent(items = []) {
  if (!items.length) return 0;
  const complete = items.filter((item) => item.completed).length;
  return Math.round((complete / items.length) * 100);
}

export function childTemplate(data) {
  const now = new Date().toISOString();
  return {
    id: makeId('child'),
    name: data.name.trim(),
    dateOfBirth: data.dateOfBirth,
    gender: data.gender || '',
    school: data.school?.trim() || '',
    className: data.className?.trim() || '',
    createdAt: now,
    learningGoals: [],
    skills: [],
    healthRecords: [],
    physicalActivities: [],
    nutritionLogs: [],
    habits: [],
    assessments: [],
    portfolio: [],
    roadmap: [],
    reminders: [],
    attachments: [],
    evidenceLinks: [],
    developmentProfile: { strengths: [], interests: [], supportNeeds: [], notes: '' },
    education: { curriculum: '', languages: [], targetOutcomes: [] },
    privacy: { screenLockEnabled: false, hideHealthOnOverview: false }
  };
}
