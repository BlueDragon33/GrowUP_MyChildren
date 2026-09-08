import { exportVerificationReceipts } from './export-verification-history.js';
import { previewExportVerificationReceiptImport, applyExportVerificationReceiptImport } from './export-verification-package-integrity.js';

export const RECEIPT_IMPORT_HISTORY_FORMAT='growup-receipt-import-history-v1';
const MAX_HISTORY=20;

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?new Date().toISOString():d.toISOString();}
function normalizeReceipt(item={}){const at=iso(item.at),checksumResult=item.checksumResult==='valid'||item.checksumResult==='invalid'?item.checksumResult:'';if(!checksumResult)return null;return {at,format:text(item.format,80)||'unknown',algorithm:text(item.algorithm,40)||'unknown',checksumResult};}
function fingerprint(item){return `${item.at}\u0000${item.format}\u0000${item.algorithm}\u0000${item.checksumResult}`;}
function importId(at,index=0){return `receipt-import-${String(at).replace(/[^0-9]/g,'').slice(0,17)}-${index}`;}

export function receiptImportHistory(settings={}){
  return array(settings.receiptImportHistory).slice(-MAX_HISTORY).map((entry,index)=>({
    id:text(entry?.id,100)||importId(iso(entry?.at),index),
    at:iso(entry?.at),
    packageFormat:text(entry?.packageFormat,80)||'unknown',
    added:array(entry?.added).map(normalizeReceipt).filter(Boolean).slice(0,50)
  })).filter((entry)=>entry.added.length>0);
}

export function applyReceiptImportWithHistory(settings={},pkg={},at=new Date().toISOString()){
  const preview=previewExportVerificationReceiptImport(pkg,settings);
  if(!preview.valid)return {settings,changed:false,added:0,reason:preview.reason||'invalid-import'};
  const applied=applyExportVerificationReceiptImport(settings,pkg);
  if(!applied.changed)return {...applied,historyRecorded:false};
  const added=preview.accepted.slice(0,applied.added).map(normalizeReceipt).filter(Boolean);
  const when=iso(at),history=receiptImportHistory(settings),entry={id:importId(when,history.length+1),at:when,packageFormat:text(pkg?.format,80)||'unknown',added};
  return {...applied,settings:{...applied.settings,receiptImportHistory:[...history,entry].slice(-MAX_HISTORY)},historyRecorded:true,historyEntry:entry};
}

export function undoLastReceiptImport(settings={}){
  const history=receiptImportHistory(settings);
  if(!history.length)return {settings,changed:false,removed:0,missing:0,reason:'no-import-history'};
  const last=history[history.length-1],targets=new Set(last.added.map(fingerprint)),current=exportVerificationReceipts(settings),remaining=current.filter((item)=>!targets.has(fingerprint(item))),removed=current.length-remaining.length,missing=Math.max(0,last.added.length-removed);
  if(!removed)return {settings,changed:false,removed:0,missing:last.added.length,reason:'delta-not-present',historyEntry:last};
  return {settings:{...settings,safeExportVerificationReceipts:remaining,receiptImportHistory:history.slice(0,-1)},changed:true,removed,missing,reason:missing?'partial-undo':'undone',historyEntry:last};
}

export const RECEIPT_IMPORT_HISTORY_NOTE='Lịch sử import chỉ giữ metadata delta của receipt đã thực sự thêm: at/format/algorithm/valid-invalid và format package. Không lưu file nguồn, payload export, expected/actual checksum hay dữ liệu trẻ. Undo chỉ gỡ đúng metadata thuộc lần import gần nhất và không đụng mục khác.';
