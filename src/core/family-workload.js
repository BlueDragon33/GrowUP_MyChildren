function array(value){return Array.isArray(value)?value:[];}
function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''));}
function dayKey(value){return validDate(value)?String(value):'';}

export function familyWorkloadWindow(items=[],fromDate='',days=7){
  const start=dayKey(fromDate)||new Date().toISOString().slice(0,10);
  const endDate=new Date(`${start}T00:00:00`);
  const span=Math.max(1,Math.min(90,Number(days)||7));
  endDate.setDate(endDate.getDate()+span);
  const end=endDate.toISOString().slice(0,10);
  const selected=array(items).filter((item)=>dayKey(item?.date)>=start&&item.date<end);
  const grouped=new Map();
  for(const item of selected){
    const date=item.date;
    const minutes=Math.max(0,Number(item.minutes)||0);
    if(!grouped.has(date)) grouped.set(date,{date,items:0,minutes:0});
    const row=grouped.get(date);row.items+=1;row.minutes+=minutes;
  }
  const daily=[...grouped.values()].sort((a,b)=>a.date.localeCompare(b.date));
  const totalMinutes=daily.reduce((n,row)=>n+row.minutes,0);
  const activeDays=daily.length;
  const busiest=daily.reduce((best,row)=>!best||row.minutes>best.minutes?row:best,null);
  return {fromDate:start,days:span,commitments:selected.length,totalMinutes,activeDays,averageMinutesPerActiveDay:activeDays?Math.round(totalMinutes/activeDays):0,busiestDay:busiest,daily};
}

export function familyWorkloadWindows(items=[],fromDate=''){
  return [7,14,30].map((days)=>familyWorkloadWindow(items,fromDate,days));
}

export const FAMILY_WORKLOAD_NOTE='Các cửa sổ 7/14/30 ngày chỉ mô tả số kế hoạch và thời lượng đã nhập của gia đình. Không chấm điểm, không so sánh trẻ và không tự đổi lịch.';
