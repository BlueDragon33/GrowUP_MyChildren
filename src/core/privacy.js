const SENSITIVE_PAGES = new Set(['Sức khỏe', 'Dinh dưỡng']);

export function isSensitivePage(title = '') {
  return SENSITIVE_PAGES.has(String(title).trim());
}

export function screenPrivacyLabel(active) {
  return active ? 'Hiện dữ liệu nhạy cảm' : 'Ẩn dữ liệu nhạy cảm';
}

export function redactHealthRecord(record, active) {
  if (!active || !record) return record;
  return { ...record, height: '•••', weight: '•••', sleep: '•••', note: 'Đã ẩn trên màn hình' };
}
