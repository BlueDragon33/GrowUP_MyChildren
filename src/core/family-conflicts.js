function list(value){ return Array.isArray(value) ? value : []; }
function validDate(value){ return /^\d{4}-\d{2}-\d{2}$/.test(String(value||'')); }
function dateShift(date,days){ const d=new Date(`${date}T00:00:00`); d.setDate(d.getDate()+days); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

export function familyPlanConflicts(items = [], options = {}) {
  const maxMinutes=Math.max(30,Number(options.maxMinutesPerDay)||180);
  const normalized=list(items).filter((item)=>validDate(item?.date)&&item?.title).map((item)=>({
    id:String(item.id||''),childId:String(item.childId||''),date:item.date,title:String(item.title),minutes:Math.max(0,Number(item.minutes)||0)
  }));
  const days=new Map();
  for(const item of normalized){ const bucket=days.get(item.date)||[]; bucket.push(item); days.set(item.date,bucket); }
  return [...days.entries()].map(([date,dayItems])=>{
    const minutes=dayItems.reduce((sum,item)=>sum+item.minutes,0);
    const childIds=[...new Set(dayItems.map((item)=>item.childId).filter(Boolean))];
    const reasons=[];
    if(dayItems.length>1) reasons.push('Nhiều kế hoạch cùng ngày');
    if(minutes>maxMinutes) reasons.push(`Tổng thời lượng vượt ${maxMinutes} phút`);
    return {date,items:dayItems,totalItems:dayItems.length,totalMinutes:minutes,childCount:childIds.length,reasons};
  }).filter((entry)=>entry.reasons.length).sort((a,b)=>a.date.localeCompare(b.date));
}

export function rescheduleCandidates(items = [], conflictDate, options = {}) {
  if(!validDate(conflictDate)) return [];
  const span=Math.min(7,Math.max(1,Number(options.spanDays)||3));
  const maxMinutes=Math.max(30,Number(options.maxMinutesPerDay)||180);
  const minutesByDate=new Map();
  for(const item of list(items).filter((entry)=>validDate(entry?.date))){ minutesByDate.set(item.date,(minutesByDate.get(item.date)||0)+Math.max(0,Number(item.minutes)||0)); }
  const candidates=[];
  for(let offset=-span;offset<=span;offset+=1){
    if(offset===0) continue;
    const date=dateShift(conflictDate,offset),plannedMinutes=minutesByDate.get(date)||0;
    candidates.push({date,plannedMinutes,remainingMinutes:Math.max(0,maxMinutes-plannedMinutes),offsetDays:offset});
  }
  return candidates.sort((a,b)=>b.remainingMinutes-a.remainingMinutes||Math.abs(a.offsetDays)-Math.abs(b.offsetDays)||a.date.localeCompare(b.date));
}

export const FAMILY_CONFLICT_NOTE='Trợ lý chỉ phát hiện tải lịch theo ngày và gợi ý ngày ít bận hơn từ dữ liệu cục bộ. GrowUP không tự đổi lịch, không đánh giá ưu tiên giữa các con và không gửi thay đổi sang calendar.';
