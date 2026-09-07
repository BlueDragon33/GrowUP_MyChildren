import { makeId } from './model.js';
import { recoveryReminderCandidate } from './recovery-schedule.js';
import { reminderState } from './reminders.js';

function array(v){return Array.isArray(v)?v:[];}

export function recoveryReminderStatus(state={},childId='',onDate=new Date()){
  const candidate=recoveryReminderCandidate(state.settings||{});
  if(!candidate)return {available:false,reason:'schedule-disabled',candidate:null,existing:null,state:null};
  const child=array(state.children).find((item)=>item.id===childId);
  if(!child)return {available:false,reason:'child-not-found',candidate,existing:null,state:null};
  const existing=array(child.reminders).find((item)=>item.source==='recovery-drill'&&item.date===candidate.date)||null;
  return {available:true,reason:null,candidate,existing,state:existing?reminderState(existing,onDate):reminderState(candidate,onDate)};
}

export function integrateRecoveryReminder(state={},childId=''){
  const status=recoveryReminderStatus(state,childId);
  if(!status.available)return {state,created:false,deduplicated:false,reason:status.reason,reminder:null};
  if(status.existing)return {state,created:false,deduplicated:true,reason:null,reminder:status.existing};
  const next=structuredClone(state);
  const child=next.children.find((item)=>item.id===childId);
  const reminder={id:makeId('reminder'),title:status.candidate.title,date:status.candidate.date,type:'recovery',source:'recovery-drill',completed:false,lineage:{originSource:'recovery-drill',originDate:status.candidate.date,previousDates:[]}};
  child.reminders=Array.isArray(child.reminders)?child.reminders:[];
  child.reminders.push(reminder);
  return {state:next,created:true,deduplicated:false,reason:null,reminder};
}

export const RECOVERY_REMINDER_NOTE='Recovery reminder chỉ được thêm khi người dùng chọn hồ sơ đích. Cùng source/date sẽ được deduplicate; lineage giữ nguồn/ngày gốc, không tạo nhắc nền, không lưu passphrase và không tự chạy restore.';
