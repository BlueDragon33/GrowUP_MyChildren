function array(value){return Array.isArray(value)?value:[];}
function esc(value=''){return String(value).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');}
function asIcsDate(date=''){return String(date||'').replaceAll('-','');}
function stamp(){return new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');}
function child(state={},childId=''){return array(state.children).find((item)=>item.id===childId)||null;}

export function recoveryCalendarCandidates(state={},childId=''){
  const target=child(state,childId);
  return array(target?.reminders).filter((item)=>item?.source==='recovery-drill'&&item?.type==='recovery'&&item?.date&&item?.title).map((item)=>({
    id:item.id,
    title:item.title,
    date:item.date,
    completed:Boolean(item.completed),
    source:'recovery-drill',
    originDate:item.lineage?.originDate||item.date
  }));
}

export function recoveryCalendarSelectionPreview(state={},childId='',reminderIds=[]){
  const selected=new Set(array(reminderIds).filter(Boolean));
  const items=recoveryCalendarCandidates(state,childId).filter((item)=>selected.has(item.id));
  return {childId,count:items.length,items:items.map((item)=>({...item}))};
}

export function recoveryRemindersToIcs(state={},childId='',reminderIds=[],options={}){
  const preview=recoveryCalendarSelectionPreview(state,childId,reminderIds);
  const events=preview.items.map((item,index)=>[
    'BEGIN:VEVENT',
    `UID:${esc(item.id||`growup-recovery-${index}`)}@growup-mychildren`,
    `DTSTAMP:${stamp()}`,
    `DTSTART;VALUE=DATE:${asIcsDate(item.date)}`,
    `SUMMARY:${esc(item.title)}`,
    'CATEGORIES:GrowUP Recovery',
    'X-GROWUP-SOURCE:recovery-drill',
    `X-GROWUP-ORIGIN-DATE:${asIcsDate(item.originDate)}`,
    `X-GROWUP-COMPLETED:${item.completed?'TRUE':'FALSE'}`,
    'END:VEVENT'
  ].join('\r\n'));
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//GrowUP My Children//VI',`X-WR-CALNAME:${esc(options.calendarName||'GrowUP - Recovery reminders')}`,...events,'END:VCALENDAR',''].join('\r\n');
}

export const RECOVERY_CALENDAR_BRIDGE_NOTE='Chỉ các recovery reminder được người dùng tích chọn mới được tạo thành file .ics. Bridge không đăng nhập Google Calendar, không ghi lịch nền, không tự restore và không đưa tên trẻ, passphrase hay backup payload vào file; lineage source/origin date tối thiểu được giữ bằng X-GROWUP metadata.';
