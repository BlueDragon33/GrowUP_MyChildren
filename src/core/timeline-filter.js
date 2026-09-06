function dateOnly(value) {
  const text = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const d = new Date(`${text}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : text;
}

function pad(value) { return String(value).padStart(2, '0'); }

export function periodRange(reference, mode = 'month') {
  const key = dateOnly(reference) || dateOnly(new Date().toISOString());
  if (!key) throw new Error('Ngày tham chiếu không hợp lệ.');
  const [year, month] = key.split('-').map(Number);
  if (mode === 'month') {
    const last = new Date(year, month, 0).getDate();
    return { start: `${year}-${pad(month)}-01`, end: `${year}-${pad(month)}-${pad(last)}`, label: `Tháng ${month}/${year}` };
  }
  if (mode === 'quarter') {
    const q = Math.floor((month - 1) / 3) + 1;
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const last = new Date(year, endMonth, 0).getDate();
    return { start: `${year}-${pad(startMonth)}-01`, end: `${year}-${pad(endMonth)}-${pad(last)}`, label: `Quý ${q}/${year}` };
  }
  if (mode === 'year') return { start: `${year}-01-01`, end: `${year}-12-31`, label: `Năm ${year}` };
  throw new Error('Chế độ thời gian không được hỗ trợ.');
}

export function filterTimeline(events = [], { reference, mode = 'month' } = {}) {
  const range = periodRange(reference || new Date().toISOString(), mode);
  return {
    ...range,
    events: events.filter((event) => event.date >= range.start && event.date <= range.end)
  };
}

export function summarizeTimeline(events = []) {
  return events.reduce((summary, event) => {
    summary.total += 1;
    summary.byKind[event.kind] = (summary.byKind[event.kind] || 0) + 1;
    return summary;
  }, { total: 0, byKind: {} });
}
