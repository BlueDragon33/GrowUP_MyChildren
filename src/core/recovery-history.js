function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function status(value){return value==='PASS'?'PASS':'FAIL';}

export function recoveryHistoryEntry(drill = {}, now = new Date()) {
  return {
    at: now.toISOString(),
    status: status(drill.status || (drill.success ? 'PASS' : 'FAIL')),
    format: text(drill.format || drill.inspection?.format,80) || null,
    schemaVersion: Number(drill.schemaVersion)||null
  };
}

export function appendRecoveryHistory(settings = {}, drill = {}, options = {}) {
  const limit=Math.min(50,Math.max(1,Number(options.limit)||12));
  const history=Array.isArray(settings.recoveryDrillHistory)?settings.recoveryDrillHistory:[];
  const entry=recoveryHistoryEntry(drill,options.now||new Date());
  return {...settings,recoveryDrillHistory:[entry,...history.map((item)=>recoveryHistoryEntry(item,new Date(item.at||0))).filter((item)=>item.at!=='1970-01-01T00:00:00.000Z')].slice(0,limit)};
}

export function recoveryHistory(settings = {}, limit = 12) {
  return (Array.isArray(settings.recoveryDrillHistory)?settings.recoveryDrillHistory:[]).slice(0,Math.max(1,limit)).map((item)=>({
    at:text(item.at,40),
    status:status(item.status),
    format:text(item.format,80)||null,
    schemaVersion:Number(item.schemaVersion)||null
  }));
}

export const RECOVERY_HISTORY_NOTE='Lịch sử recovery chỉ lưu thời điểm, PASS/FAIL, định dạng và schema. Không lưu passphrase, ciphertext, salt, IV, preview chi tiết hoặc payload đã giải mã.';
