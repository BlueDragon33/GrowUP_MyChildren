import { todayKey } from './model.js';

function list(value){return Array.isArray(value)?value:[];}
function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return false;const d=new Date(`${value}T00:00:00`);return !Number.isNaN(d.getTime());}
function shift(dateKey,days){const d=new Date(`${dateKey}T00:00:00`);d.setDate(d.getDate()+days);return todayKey(d);}

export function familyWorkloadWindows(items=[],anchorDate=new Date(),options={}){
  const anchor=validDate(anchorDate)?String(anchorDate):todayKey(anchorDate instanceof Date?anchorDate:new Date());
  const windows=list(options.windows).length?list(options.windows):[7,14,30];
  const maxMinutesPerDay=Math.max(30,Number(options.maxMinutesPerDay)||180);
  const normalized=list(items).filter((item)=>validDate(item?.date)).map((item)=>({date:item.date,minutes:Math.max(0,Number(item.minutes)||0)}));
  return windows.map((rawDays)=>{
    const days=Math.min(90,Math.max(1,Number(rawDays)||7));
    const end=shift(anchor,days-1);
    const inRange=normalized.filter((item)=>item.date>=anchor&&item.date<=end);
    const byDay=new Map();
    for(const item of inRange)byDay.set(item.date,(byDay.get(item.date)||0)+item.minutes);
    const plannedDays=byDay.size;
    const totalMinutes=inRange.reduce((sum,item)=>sum+item.minutes,0);
    const referenceCapacity=days*maxMinutesPerDay;
    return {
      days,
      fromDate:anchor,
      toDate:end,
      totalItems:inRange.length,
      totalMinutes,
      plannedDays,
      freeDays:Math.max(0,days-plannedDays),
      averageMinutesPerCalendarDay:Math.round(totalMinutes/days),
      referenceCapacityMinutes:referenceCapacity,
      remainingReferenceMinutes:Math.max(0,referenceCapacity-totalMinutes)
    };
  });
}

export const WORKLOAD_WINDOWS_NOTE='Cửa sổ 7/14/30 ngày chỉ tổng hợp số mục, số phút và số ngày có kế hoạch. Ngưỡng phút/ngày là mốc tham chiếu cục bộ để nhìn tải lịch, không phải điểm đánh giá trẻ hay khuyến nghị y tế.';
