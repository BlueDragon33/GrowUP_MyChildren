import { recoveryCalendarCandidates } from './recovery-calendar-bridge.js';

function array(value){return Array.isArray(value)?value:[];}
function unfold(text=''){return String(text||'').replace(/\r?\n[ \t]/g,'');}
function icsDate(value=''){const raw=String(value||'').trim().slice(0,8);return /^\d{8}$/.test(raw)?`${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`:'';}
function unescapeIcs(value=''){return String(value||'').replace(/\\n/gi,'\n').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\');}

export function parseRecoveryIcsMetadata(text=''){
  const source=unfold(text),blocks=source.split('BEGIN:VEVENT').slice(1).map((part)=>part.split('END:VEVENT')[0]||'');
  return blocks.slice(0,200).map((block)=>{
    const fields={};
    for(const line of block.split(/\r?\n/)){
      const index=line.indexOf(':');if(index<0)continue;const rawKey=line.slice(0,index),key=rawKey.split(';')[0].toUpperCase(),value=unescapeIcs(line.slice(index+1));fields[key]=value;
    }
    const uid=String(fields.UID||''),id=uid.endsWith('@growup-mychildren')?uid.slice(0,-'@growup-mychildren'.length):uid;
    return {id:id.slice(0,120),date:icsDate(fields.DTSTART),source:String(fields['X-GROWUP-SOURCE']||''),originDate:icsDate(fields['X-GROWUP-ORIGIN-DATE']),completed:String(fields['X-GROWUP-COMPLETED']||'').toUpperCase()==='TRUE'};
  }).filter((item)=>item.id&&item.date&&item.source==='recovery-drill');
}

export function previewRecoveryIcsReconciliation(state={},childId='',icsText=''){
  const local=recoveryCalendarCandidates(state,childId),file=parseRecoveryIcsMetadata(icsText),localById=new Map(local.map((item)=>[item.id,item])),fileById=new Map(file.map((item)=>[item.id,item]));
  const ids=[...new Set([...localById.keys(),...fileById.keys()])].sort();
  const items=ids.map((id)=>{
    const current=localById.get(id)||null,external=fileById.get(id)||null;
    let status='same';
    if(!current)status='file-only';else if(!external)status='local-only';else if(current.date!==external.date||Boolean(current.completed)!==Boolean(external.completed)||(current.originDate||current.date)!==(external.originDate||external.date))status='different';
    return {id,status,localDate:current?.date||null,fileDate:external?.date||null,localCompleted:current?Boolean(current.completed):null,fileCompleted:external?Boolean(external.completed):null,localOriginDate:current?(current.originDate||current.date):null,fileOriginDate:external?(external.originDate||external.date):null};
  });
  const count=(status)=>items.filter((item)=>item.status===status).length;
  return {childId,validCalendar:/BEGIN:VCALENDAR/i.test(String(icsText||'')),localCount:local.length,fileCount:file.length,same:count('same'),different:count('different'),localOnly:count('local-only'),fileOnly:count('file-only'),items};
}

export const RECOVERY_ICS_RECONCILIATION_NOTE='Reconciliation chỉ đọc file .ics người dùng chọn và so sánh metadata id/date/completed/origin-date với recovery reminder cục bộ. Không ghi Google Calendar, không sửa reminder, không tự restore, không đọc lịch bên ngoài và không lưu nội dung .ics sau preview.';
