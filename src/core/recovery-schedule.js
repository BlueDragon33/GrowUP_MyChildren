function text(value,max=100){return typeof value==='string'?value.trim().slice(0,max):'';}
function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''));}
const CADENCES=new Set(['monthly','quarterly','semiannual','annual']);

export function normalizeRecoverySchedule(value={}){
  return {
    enabled:Boolean(value.enabled),
    cadence:CADENCES.has(value.cadence)?value.cadence:'quarterly',
    nextDate:validDate(value.nextDate)?value.nextDate:'',
    reminderEnabled:Boolean(value.reminderEnabled),
    checklist:{
      backupExists:Boolean(value.checklist?.backupExists),
      passphraseAvailable:Boolean(value.checklist?.passphraseAvailable),
      dryRunReviewed:Boolean(value.checklist?.dryRunReviewed)
    },
    note:text(value.note,160)
  };
}

export function setRecoverySchedule(settings={},value={}){
  return {...settings,recoveryDrillSchedule:normalizeRecoverySchedule(value)};
}

export function recoverySchedule(settings={}){
  return normalizeRecoverySchedule(settings.recoveryDrillSchedule||{});
}

export function recoveryReminderCandidate(settings={}){
  const schedule=recoverySchedule(settings);
  if(!schedule.enabled||!schedule.reminderEnabled||!schedule.nextDate)return null;
  return {title:'Kiểm tra khả năng khôi phục backup',date:schedule.nextDate,source:'recovery-drill',completed:false};
}

export const RECOVERY_SCHEDULE_NOTE='Chỉ lưu lịch, cadence và trạng thái checklist cục bộ. Không lưu passphrase và không tự phục hồi dữ liệu.';
