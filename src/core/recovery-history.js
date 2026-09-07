const MAX_HISTORY=20;
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?new Date().toISOString():d.toISOString();}

export function normalizeRecoveryHistory(input = []) {
  return (Array.isArray(input)?input:[]).map((entry)=>({
    at:iso(entry?.at),
    status:entry?.status==='PASS'?'PASS':'FAIL',
    format:text(entry?.format,60)||null,
    schemaVersion:Number.isFinite(Number(entry?.schemaVersion))?Number(entry.schemaVersion):null,
    issueCount:Math.max(0,Math.min(99,Number(entry?.issueCount)||0))
  })).slice(-MAX_HISTORY);
}

export function appendRecoveryHistory(settings = {}, result = {}, now = new Date()) {
  const history=normalizeRecoveryHistory(settings.recoveryDrillHistory);
  const inspection=result.inspection||{};
  history.push({
    at:now.toISOString(),
    status:result.success?'PASS':'FAIL',
    format:text(inspection.format,60)||null,
    schemaVersion:Number.isFinite(Number(result.schemaVersion))?Number(result.schemaVersion):null,
    issueCount:Array.isArray(inspection.issues)?inspection.issues.length:0
  });
  return {...settings,recoveryDrillHistory:normalizeRecoveryHistory(history)};
}

export function recoveryHistorySummary(settings = {}) {
  const history=normalizeRecoveryHistory(settings.recoveryDrillHistory);
  const latest=history.at(-1)||null;
  return {count:history.length,passes:history.filter((entry)=>entry.status==='PASS').length,failures:history.filter((entry)=>entry.status==='FAIL').length,latest,history:[...history].reverse()};
}

export const RECOVERY_HISTORY_NOTE='Lịch sử chỉ lưu thời điểm, định dạng, PASS/FAIL, schema và số lỗi tương thích; không lưu passphrase, ciphertext, tên trẻ hoặc payload đã giải mã.';
