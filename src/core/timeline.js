function dateKey(value) {
  if (!value) return null;
  const text = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : text;
}

function titleOf(item, fallback) {
  return String(item?.title || item?.name || item?.goal || item?.activity || fallback).trim();
}

export function buildDevelopmentTimeline(child, { limit = 80 } = {}) {
  if (!child) return [];
  const events = [];
  const push = (date, kind, title, source, id, extra = {}) => {
    const key = dateKey(date);
    if (!key) return;
    events.push({ date:key, kind, title:String(title || '').trim(), source, sourceId:id || null, ...extra });
  };

  for (const item of child.learningGoals || []) push(item.dueDate || item.createdAt, 'learning-goal', titleOf(item,'Mục tiêu học tập'), 'learningGoals', item.id, { completed:Boolean(item.completed) });
  for (const item of child.skills || []) push(item.date, 'skill', titleOf(item,'Cập nhật kỹ năng'), 'skills', item.id, { level:item.level ?? null });
  for (const item of child.healthRecords || []) push(item.date, 'health', 'Bản ghi sức khỏe', 'healthRecords', item.id, { sensitive:true });
  for (const item of child.physicalActivities || []) push(item.date, 'physical', titleOf(item,'Hoạt động thể chất'), 'physicalActivities', item.id, { minutes:Number(item.minutes)||0 });
  for (const item of child.portfolio || []) push(item.date || item.createdAt, 'portfolio', titleOf(item,'Dấu mốc portfolio'), 'portfolio', item.id);
  for (const item of child.reminders || []) push(item.date, 'reminder', titleOf(item,'Nhắc nhở'), 'reminders', item.id, { completed:Boolean(item.completed) });
  for (const item of child.attachments || []) push(item.createdAt, 'evidence', titleOf(item,'Minh chứng'), 'attachments', item.id);

  return events.sort((a,b) => b.date.localeCompare(a.date) || a.kind.localeCompare(b.kind)).slice(0, Math.max(1, Number(limit)||80));
}

export function timelineCounts(events = []) {
  return events.reduce((acc,event) => {
    acc.total += 1;
    acc.byKind[event.kind] = (acc.byKind[event.kind] || 0) + 1;
    return acc;
  }, { total:0, byKind:{} });
}
