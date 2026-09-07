function text(value,max=100){return typeof value==='string'?value.trim().slice(0,max):'';}
function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return '';const d=new Date(`${value}T00:00:00`);return Number.isNaN(d.getTime())?'':String(value);}
function iso(value){const d=value instanceof Date?value:new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}

const CHECKLIST_KEYS=Object.freeze(['backupLocated','decryptTested','checksumVerified','restoreReviewed']);

export function normalizeRecoverySchedule(value={}){
  const checklist={};
  for(const key of CHECKLIST_KEYS)checklist[key]=Boolean(value?.checklist?.[key]);
  return {
    enabled:Boolean(value.enabled),
    nextDate:validDate(value.nextDate),
    intervalDays:Math.min(365,Math.max(7,Number(value.intervalDays)||90)),
    label:text(value.label,80)||'Kiểm tra khả năng khôi phục backup GrowUP',
    checklist,
    updatedAt:iso(value.updatedAt)
  };
}

export function updateRecoverySchedule(settings={},input={},options={}){
  const now=options.now instanceof Date?options.now:new Date();
  const schedule=normalizeRecoverySchedule({...input,updatedAt:now});
  return {...settings,recoverySchedule:schedule};
}

export function recoveryChecklistComplete(schedule={}){
  const normalized=normalizeRecoverySchedule(schedule);
  return CHECKLIST_KEYS.every((key)=>normalized.checklist[key]);
}

export function createRecoveryReminder(schedule={},options={}){
  const normalized=normalizeRecoverySchedule(schedule);
  if(!options.requested||!normalized.enabled||!normalized.nextDate)return null;
  const id=text(options.id,100)||`reminder-recovery-${Date.now().toString(36)}`;
  return {
    id,
    title:normalized.label,
    date:normalized.nextDate,
    type:'Gia đình',
    completed:false,
    source:'recovery-schedule'
  };
}

export const RECOVERY_CHECKLIST_KEYS=CHECKLIST_KEYS;
export const RECOVERY_SCHEDULE_NOTE='Lịch recovery chỉ lưu ngày, chu kỳ và trạng thái checklist. Nhắc nhở cục bộ chỉ được tạo sau thao tác chủ động; không lưu passphrase, ciphertext hoặc payload khôi phục và không tự restore.';
