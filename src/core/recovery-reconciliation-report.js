export const RECOVERY_RECONCILIATION_REPORT_FORMAT='growup-recovery-reconciliation-report-v1';

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=120){return typeof value==='string'?value.trim().slice(0,max):'';}
function safeRow(row={}){const status=['same','different','local-only','file-only'].includes(row.status)?row.status:'different';return {id:text(row.id,120),status,localDate:row.localDate||null,fileDate:row.fileDate||null,localCompleted:typeof row.localCompleted==='boolean'?row.localCompleted:null,fileCompleted:typeof row.fileCompleted==='boolean'?row.fileCompleted:null,localOriginDate:row.localOriginDate||null,fileOriginDate:row.fileOriginDate||null};}

export function buildRecoveryReconciliationReport(preview={},selectedIds=[]){
  const selected=new Set(array(selectedIds).map((item)=>text(item,120)).filter(Boolean));
  const rows=array(preview.items).map(safeRow).filter((row)=>row.id&&selected.has(row.id));
  return {
    format:RECOVERY_RECONCILIATION_REPORT_FORMAT,
    version:1,
    createdAt:new Date().toISOString(),
    summary:{selected:rows.length,same:rows.filter((row)=>row.status==='same').length,different:rows.filter((row)=>row.status==='different').length,localOnly:rows.filter((row)=>row.status==='local-only').length,fileOnly:rows.filter((row)=>row.status==='file-only').length},
    rows
  };
}

export const RECOVERY_RECONCILIATION_REPORT_NOTE='Report chỉ chứa metadata của các dòng reconciliation người dùng chọn: id, trạng thái, date/completed/originDate hai phía. Không chứa tên trẻ, title reminder, nội dung file .ics, passphrase/backup payload và không có thao tác apply hay ghi lịch bên ngoài.';
