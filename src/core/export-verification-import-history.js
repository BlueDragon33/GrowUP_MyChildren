import { exportVerificationReceipts } from './export-verification-history.js';
import { applyExportVerificationReceiptImport } from './export-verification-package-integrity.js';

const MAX_HISTORY=20;
const MAX_RECEIPTS=50;

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
function normalizeReceipt(item={}){const at=iso(item.at),checksumResult=item.checksumResult==='valid'||item.checksumResult==='invalid'?item.checksumResult:'';if(!at||!checksumResult)return null;return {at,format:text(item.format,80)||'unknown',algorithm:text(item.algorithm,40)||'unknown',checksumResult};}
function fingerprint(item={}){return `${item.at}\u0000${item.format}\u0000${item.algorithm}\u0000${item.checksumResult}`;}
function normalizeHistoryEntry(item={}){
  const at=iso(item.at),undoneAt=item.undoneAt?iso(item.undoneAt):null,added=array(item.added).map(normalizeReceipt).filter(Boolean).slice(0,MAX_RECEIPTS);
  if(!at||!added.length)return null;
  return {id:text(item.id,120)||`receipt-import-${at}`,at,added,addedCount:added.length,duplicates:Math.max(0,Number(item.duplicates)||0),rejected:Math.max(0,Number(item.rejected)||0),undoneAt};
}

export function exportVerificationImportHistory(settings={}){
  return array(settings.safeExportVerificationImportHistory).map(normalizeHistoryEntry).filter(Boolean).slice(-MAX_HISTORY);
}

export function applyExportVerificationReceiptImportWithHistory(settings={},pkg={},at=new Date().toISOString()){
  const before=exportVerificationReceipts(settings),result=applyExportVerificationReceiptImport(settings,pkg);
  if(!result.changed)return {...result,historyAdded:false};
  const after=exportVerificationReceipts(result.settings),beforeCounts=new Map();
  for(const item of before){const key=fingerprint(item);beforeCounts.set(key,(beforeCounts.get(key)||0)+1);}
  const added=[];
  for(const item of after){const key=fingerprint(item),count=beforeCounts.get(key)||0;if(count>0){beforeCounts.set(key,count-1);continue;}added.push(item);}
  if(!added.length)return {...result,historyAdded:false};
  const timestamp=iso(at)||new Date().toISOString(),history=exportVerificationImportHistory(settings),entry={id:`receipt-import-${timestamp}-${history.length+1}`.slice(0,120),at:timestamp,added:added.slice(0,MAX_RECEIPTS),addedCount:added.length,duplicates:result.duplicates||0,rejected:result.rejected||0,undoneAt:null};
  return {...result,settings:{...result.settings,safeExportVerificationImportHistory:[...history,entry].slice(-MAX_HISTORY)},historyAdded:true,historyEntry:entry};
}

export function undoLastExportVerificationReceiptImport(settings={},at=new Date().toISOString()){
  const history=exportVerificationImportHistory(settings),index=history.findLastIndex((item)=>!item.undoneAt);
  if(index<0)return {settings,changed:false,removed:0,reason:'nothing-to-undo'};
  const entry=history[index],current=exportVerificationReceipts(settings),need=new Map();
  for(const item of entry.added){const key=fingerprint(item);need.set(key,(need.get(key)||0)+1);}
  const have=new Map();for(const item of current){const key=fingerprint(item);have.set(key,(have.get(key)||0)+1);}
  for(const [key,count] of need)if((have.get(key)||0)<count)return {settings,changed:false,removed:0,reason:'receipt-state-diverged',entry};
  const remaining=new Map(need),kept=[];
  for(let i=current.length-1;i>=0;i-=1){const item=current[i],key=fingerprint(item),count=remaining.get(key)||0;if(count>0){remaining.set(key,count-1);continue;}kept.push(item);}
  kept.reverse();
  const undoneAt=iso(at)||new Date().toISOString(),nextHistory=history.map((item,i)=>i===index?{...item,undoneAt}:item);
  return {settings:{...settings,safeExportVerificationReceipts:kept.slice(-MAX_RECEIPTS),safeExportVerificationImportHistory:nextHistory.slice(-MAX_HISTORY)},changed:true,removed:entry.added.length,reason:'undone',entry:{...entry,undoneAt}};
}

export const EXPORT_VERIFICATION_IMPORT_HISTORY_NOTE='Lịch sử import receipt chỉ lưu delta metadata của chính receipt đã thêm (at/format/algorithm/valid-invalid) và trạng thái undo. Không lưu checksum nguồn/actual, file package, dữ liệu trẻ hoặc free-text. Undo chỉ chạy khi các receipt cần hoàn tác vẫn còn nguyên; nếu state đã lệch thì từ chối thay đổi.';
