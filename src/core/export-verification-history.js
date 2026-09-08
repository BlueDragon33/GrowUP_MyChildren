const MAX_RECEIPTS=50;

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function timestamp(value){const date=new Date(value);return Number.isNaN(date.getTime())?new Date().toISOString():date.toISOString();}

export function normalizeExportVerificationReceipt(entry={}){
  return {
    at:timestamp(entry.at||new Date().toISOString()),
    format:text(entry.format,80)||'unknown',
    algorithm:text(entry.algorithm,40)||'unknown',
    checksumResult:entry.checksumResult==='valid'||entry.valid===true?'valid':'invalid'
  };
}

export function exportVerificationReceipts(settings={}){
  return array(settings.safeExportVerificationReceipts).slice(-MAX_RECEIPTS).map(normalizeExportVerificationReceipt);
}

export function recordExportVerificationReceipt(settings={},verification={},at=new Date().toISOString()){
  const receipt=normalizeExportVerificationReceipt({
    at,
    format:verification.format,
    algorithm:verification.algorithm,
    valid:Boolean(verification.valid)
  });
  return {
    ...settings,
    safeExportVerificationReceipts:[...exportVerificationReceipts(settings),receipt].slice(-MAX_RECEIPTS)
  };
}

export const EXPORT_VERIFICATION_HISTORY_NOTE='Receipt chỉ lưu thời điểm, format, thuật toán và kết quả checksum valid/invalid. Không lưu file safe-export, checksum gốc/actual, tên file, preview, dữ liệu trẻ, Health/Nutrition hay free-text từ gói được kiểm tra.';
