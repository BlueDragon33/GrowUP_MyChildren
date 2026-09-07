function array(value){return Array.isArray(value)?value:[];}
function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''));}
function history(settings={}){return array(settings.recoveryReminderLifecycleHistory).slice(-50);}
function appendHistory(state,entry){const next=structuredClone(state);next.settings={...(next.settings||{}),recoveryReminderLifecycleHistory:[...history(next.settings),{at:new Date().toISOString(),...entry}].slice(-50)};return next;}
function find(state,childId,reminderId){const child=array(state.children).find((item)=>item.id===childId),reminder=child?.reminders?.find((item)=>item.id===reminderId);return {child,reminder};}
function eligible(reminder){return reminder?.source==='recovery-drill'&&reminder?.type==='recovery';}

export function recoveryReminderLifecycleHistory(settings={}){return history(settings).map((entry)=>({...entry}));}

export function completeRecoveryReminder(state={},childId='',reminderId='',completed=true){
  const {reminder}=find(state,childId,reminderId);
  if(!eligible(reminder))return {state,changed:false,reason:'recovery-reminder-not-found'};
  let next=structuredClone(state),child=next.children.find((item)=>item.id===childId),target=child.reminders.find((item)=>item.id===reminderId);
  target.completed=Boolean(completed);
  next=appendHistory(next,{action:target.completed?'complete':'reopen',childId,reminderId,source:'recovery-drill',fromDate:target.date,toDate:target.date});
  return {state:next,changed:true,reason:null,reminder:target};
}

export function rescheduleRecoveryReminder(state={},childId='',reminderId='',nextDate=''){
  if(!validDate(nextDate))return {state,changed:false,reason:'invalid-date'};
  const {child,reminder}=find(state,childId,reminderId);
  if(!eligible(reminder))return {state,changed:false,reason:'recovery-reminder-not-found'};
  const conflict=array(child.reminders).find((item)=>item.id!==reminderId&&item.source==='recovery-drill'&&item.date===nextDate);
  if(conflict)return {state,changed:false,reason:'source-date-conflict',conflictId:conflict.id};
  const oldDate=reminder.date;
  let next=structuredClone(state),nextChild=next.children.find((item)=>item.id===childId),target=nextChild.reminders.find((item)=>item.id===reminderId);
  const lineage=target.lineage||{originSource:'recovery-drill',originDate:oldDate,previousDates:[]};
  target.lineage={originSource:'recovery-drill',originDate:lineage.originDate||oldDate,previousDates:[...new Set([...array(lineage.previousDates),oldDate])].slice(-12)};
  target.date=nextDate;
  next=appendHistory(next,{action:'reschedule',childId,reminderId,source:'recovery-drill',fromDate:oldDate,toDate:nextDate});
  return {state:next,changed:true,reason:null,reminder:target};
}

export function removeRecoveryReminder(state={},childId='',reminderId=''){
  const {reminder}=find(state,childId,reminderId);
  if(!eligible(reminder))return {state,changed:false,reason:'recovery-reminder-not-found'};
  let next=structuredClone(state),child=next.children.find((item)=>item.id===childId);
  child.reminders=child.reminders.filter((item)=>item.id!==reminderId);
  next=appendHistory(next,{action:'remove',childId,reminderId,source:'recovery-drill',fromDate:reminder.lineage?.originDate||reminder.date,toDate:reminder.date});
  return {state:next,changed:true,reason:null,removed:{id:reminder.id,source:'recovery-drill',originDate:reminder.lineage?.originDate||reminder.date,lastDate:reminder.date}};
}

export const RECOVERY_LIFECYCLE_NOTE='Complete/reopen, reschedule và remove chỉ chạy sau thao tác rõ ràng của người dùng. Lịch sử giữ metadata source/date lineage tối thiểu; không lưu passphrase, nội dung backup hay tự chạy restore.';
