function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function status(value){return value==='PASS'?'PASS':'FAIL';}
function iso(value){
  const date=value instanceof Date?value:new Date(value);
  return Number.isFinite(date.getTime())?date.toISOString():null;
}
function metadata(drill={},at=null){
  return {
    at,
    status:status(drill.status || (drill.success ? 'PASS' : 'FAIL')),
    format:text(drill.format || drill.inspection?.format,80) || null,
    schemaVersion:Number(drill.schemaVersion)||null
  };
}
function storedEntry(item={}){
  const at=iso(item.at);
  return at?metadata(item,at):null;
}

export function recoveryHistoryEntry(drill = {}, now = new Date()) {
  return metadata(drill,iso(now)||new Date().toISOString());
}

export function appendRecoveryHistory(settings = {}, drill = {}, options = {}) {
  const limit=Math.min(50,Math.max(1,Number(options.limit)||12));
  const history=Array.isArray(settings.recoveryDrillHistory)?settings.recoveryDrillHistory:[];
  const entry=recoveryHistoryEntry(drill,options.now||new Date());
  const sanitized=history.map(storedEntry).filter(Boolean);
  return {...settings,recoveryDrillHistory:[entry,...sanitized].slice(0,limit)};
}

export function recoveryHistory(settings = {}, limit = 12) {
  const safeLimit=Math.min(50,Math.max(1,Number(limit)||12));
  return (Array.isArray(settings.recoveryDrillHistory)?settings.recoveryDrillHistory:[]).map(storedEntry).filter(Boolean).slice(0,safeLimit);
}

export const RECOVERY_HISTORY_NOTE='Lịch sử recovery chỉ lưu thời điểm, PASS/FAIL, định dạng và schema. Không lưu passphrase, ciphertext, salt, IV, preview chi tiết hoặc payload đã giải mã.';
