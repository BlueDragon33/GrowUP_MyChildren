function array(value) { return Array.isArray(value) ? value : []; }
function dateText(value) { return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : ''; }
function minutes(value) { const n=Number(value); return Number.isFinite(n) ? Math.min(1440,Math.max(0,Math.round(n))) : 0; }
function label(value,max=100) { return typeof value === 'string' ? value.trim().slice(0,max) : ''; }

export function normalizeFamilyPlanItems(items = [], childIds = []) {
  const allowed = new Set(array(childIds));
  return array(items).map((item,index) => ({
    id: label(item?.id,80) || `plan-${index}`,
    childId: label(item?.childId,80),
    date: dateText(item?.date),
    title: label(item?.title,120),
    minutes: minutes(item?.minutes),
    note: label(item?.note,180)
  })).filter((item) => item.date && item.title && (!allowed.size || allowed.has(item.childId)));
}

export function familyPlanWindow(items = [], fromDate, days = 30) {
  const start = dateText(fromDate) || new Date().toISOString().slice(0,10);
  const endDate = new Date(`${start}T00:00:00`);
  endDate.setDate(endDate.getDate() + Math.max(1,Math.min(365,Number(days)||30)));
  const end = endDate.toISOString().slice(0,10);
  return array(items).filter((item) => item?.date >= start && item.date < end).sort((a,b) => a.date.localeCompare(b.date));
}

export function summarizeFamilyTime(children = [], items = [], fromDate, days = 30) {
  const ids = array(children).map((child)=>child.id);
  const normalized = normalizeFamilyPlanItems(items,ids);
  const windowItems = familyPlanWindow(normalized,fromDate,days);
  return array(children).map((child) => {
    const childItems = windowItems.filter((item)=>item.childId===child.id);
    const daysWithPlans = new Set(childItems.map((item)=>item.date)).size;
    return {
      childId:child.id,
      childName:child.name || 'Hồ sơ trẻ',
      commitments:childItems.length,
      plannedMinutes:childItems.reduce((sum,item)=>sum+item.minutes,0),
      daysWithPlans,
      items:childItems
    };
  });
}

export function familyTimeConflicts(items = []) {
  const grouped = new Map();
  for (const item of array(items)) {
    if (!item?.date) continue;
    if (!grouped.has(item.date)) grouped.set(item.date,[]);
    grouped.get(item.date).push(item);
  }
  return [...grouped.entries()].filter(([,dayItems])=>dayItems.length>1).map(([date,dayItems])=>({date,count:dayItems.length,items:dayItems}));
}

export const FAMILY_PLANNING_NOTE = 'Các số liệu chỉ mô tả thời lượng/lịch đã nhập theo thứ tự hồ sơ; không phải điểm, xếp hạng hay đánh giá năng lực giữa các trẻ.';
