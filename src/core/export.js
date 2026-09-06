export const SAFE_DATASETS = Object.freeze(['learningGoals','skills','portfolio','attachments','roadmap','reminders']);

function scalar(value) {
  if (value == null) return '';
  if (Array.isArray(value)) return value.join(' | ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function csvEscape(value) {
  const text = scalar(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g,'""')}"` : text;
}

export function datasetRows(child, dataset) {
  if (!SAFE_DATASETS.includes(dataset)) throw new Error('Dataset không nằm trong danh sách xuất an toàn mặc định.');
  const items = Array.isArray(child?.[dataset]) ? child[dataset] : [];
  return items.map((item) => ({ childId:child.id, childName:child.name, ...item }));
}

export function rowsToCsv(rows = []) {
  if (!rows.length) return '';
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [headers.map(csvEscape).join(','), ...rows.map((row) => headers.map((key) => csvEscape(row[key])).join(','))].join('\r\n');
}

export function exportDatasetCsv(child, dataset) {
  return rowsToCsv(datasetRows(child, dataset));
}

export function exportSelectedJson(state, selections = []) {
  const selected = [...new Set(selections)].filter((dataset) => SAFE_DATASETS.includes(dataset));
  if (!selected.length) throw new Error('Chọn ít nhất một nhóm dữ liệu để xuất.');
  return {
    format:'growup-selected-export-v1',
    generatedAt:new Date().toISOString(),
    datasets:selected,
    healthIncluded:false,
    children:(state.children || []).map((child) => ({
      id:child.id,
      name:child.name,
      ...Object.fromEntries(selected.map((dataset) => [dataset, Array.isArray(child[dataset]) ? child[dataset] : []]))
    }))
  };
}
