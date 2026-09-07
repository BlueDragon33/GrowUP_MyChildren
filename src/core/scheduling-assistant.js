function array(value){return Array.isArray(value)?value:[];}
function date(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))?String(value):'';}
function time(value){return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value||''))?String(value):'';}
function toMinutes(value){const t=time(value);if(!t)return null;const [h,m]=t.split(':').map(Number);return h*60+m;}
function isoAddDays(value,days){const d=new Date(`${value}T00:00:00`);d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);}

export function analyzeFamilyPlanConflicts(items = []) {
  const plans=array(items).filter((item)=>date(item?.date)&&item?.title).map((item)=>({
    id:String(item.id||''),childId:String(item.childId||''),date:date(item.date),title:String(item.title||'').trim(),minutes:Math.max(0,Number(item.minutes)||0),startTime:time(item.startTime),endTime:time(item.endTime)
  }));
  const byDate=new Map();
  for(const plan of plans){if(!byDate.has(plan.date))byDate.set(plan.date,[]);byDate.get(plan.date).push(plan);}
  const conflicts=[];
  for(const [day,dayItems] of byDate){
    if(dayItems.length>1) conflicts.push({type:'same-day',date:day,count:dayItems.length,itemIds:dayItems.map((x)=>x.id),items:dayItems});
    const timed=dayItems.filter((item)=>item.startTime&&item.endTime&&toMinutes(item.endTime)>toMinutes(item.startTime));
    for(let i=0;i<timed.length;i+=1){
      for(let j=i+1;j<timed.length;j+=1){
        const a=timed[i],b=timed[j];
        if(toMinutes(a.startTime)<toMinutes(b.endTime)&&toMinutes(b.startTime)<toMinutes(a.endTime)){
          conflicts.push({type:'overlap',date:day,itemIds:[a.id,b.id],items:[a,b]});
        }
      }
    }
  }
  return conflicts.sort((a,b)=>a.date.localeCompare(b.date) || (a.type==='overlap'?-1:1));
}

export function rescheduleCandidates(items = [], conflict, options = {}) {
  if(!conflict?.date)return [];
  const horizon=Math.min(14,Math.max(2,Number(options.horizonDays)||7));
  const count=Number(options.count)||3;
  const all=array(items).filter((item)=>date(item?.date));
  const candidates=[];
  for(let offset=1;offset<=horizon;offset+=1){
    const candidateDate=isoAddDays(conflict.date,offset);
    const dayItems=all.filter((item)=>item.date===candidateDate);
    candidates.push({date:candidateDate,commitments:dayItems.length,plannedMinutes:dayItems.reduce((sum,item)=>sum+Math.max(0,Number(item.minutes)||0),0)});
  }
  return candidates.sort((a,b)=>a.commitments-b.commitments || a.plannedMinutes-b.plannedMinutes || a.date.localeCompare(b.date)).slice(0,Math.max(1,Math.min(5,count)));
}

export const SCHEDULING_ASSISTANT_NOTE='Trợ lý chỉ phát hiện xung đột theo dữ liệu lịch đã nhập và gợi ý ngày ít lịch hơn; không tự sửa, xóa hay đồng bộ sự kiện ra lịch ngoài.';
