import { savedSearchPackageVerificationReceipts } from './saved-search-package-integrity.js';
import { previewSavedSearchReceiptImport, applySavedSearchReceiptImport } from './saved-search-receipt-package-integrity.js';

export const SAVED_SEARCH_RECEIPT_IMPORT_HISTORY_FORMAT='growup-saved-search-receipt-import-history-v1';
const MAX_HISTORY=20;

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?new Date().toISOString():d.toISOString();}
function normalizeReceipt(item={}){const result=item.result==='valid'||item.result==='invalid'?item.result:'';if(!result)return null;return {at:iso(item.at),format:text(item.format,80)||'unknown',algorithm:text(item.algorithm,40)||'unknown',result};}
function fingerprint(item){return `${item.at}\u0000${item.format}\u0000${item.algorithm}\u0000${item.result}`;}
function historyId(at,index=0){return `saved-receipt-import-${String(at).replace(/[^0-9]/g,'').slice(0,17)}-${index}`;}

export function savedSearchReceiptImportHistory(settings={}){
  return array(settings.savedSearchReceiptImportHistory).slice(-MAX_HISTORY).map((entry,index)=>({id:text(entry?.id,100)||historyId(iso(entry?.at),index),at:iso(entry?.at),packageFormat:text(entry?.packageFormat,80)||'unknown',added:array(entry?.added).map(normalizeReceipt).filter(Boolean).slice(0,50)})).filter((entry)=>entry.added.length);
}

export function applySavedSearchReceiptImportWithHistory(settings={},pkg={},at=new Date().toISOString()){
  const preview=previewSavedSearchReceiptImport(pkg,settings);if(!preview.valid)return {settings,changed:false,added:0,reason:preview.reason||'invalid-import'};
  const applied=applySavedSearchReceiptImport(settings,pkg);if(!applied.changed)return {...applied,historyRecorded:false};
  const added=preview.accepted.slice(0,applied.added).map(normalizeReceipt).filter(Boolean),when=iso(at),history=savedSearchReceiptImportHistory(settings),entry={id:historyId(when,history.length+1),at:when,packageFormat:text(pkg?.format,80)||'unknown',added};
  return {...applied,settings:{...applied.settings,savedSearchReceiptImportHistory:[...history,entry].slice(-MAX_HISTORY)},historyRecorded:true,historyEntry:entry};
}

export function undoLastSavedSearchReceiptImport(settings={}){
  const history=savedSearchReceiptImportHistory(settings);if(!history.length)return {settings,changed:false,removed:0,missing:0,reason:'no-import-history'};
  const last=history[history.length-1],targets=new Set(last.added.map(fingerprint)),current=savedSearchPackageVerificationReceipts(settings),remaining=current.filter((item)=>!targets.has(fingerprint(item))),removed=current.length-remaining.length,missing=Math.max(0,last.added.length-removed);
  if(!removed)return {settings,changed:false,removed:0,missing:last.added.length,reason:'delta-not-present',historyEntry:last};
  return {settings:{...settings,savedSearchPackageVerificationReceipts:remaining,savedSearchReceiptImportHistory:history.slice(0,-1)},changed:true,removed,missing,reason:missing?'partial-undo':'undone',historyEntry:last};
}

export const SAVED_SEARCH_RECEIPT_IMPORT_HISTORY_NOTE='Lịch sử Saved Search receipt import chỉ giữ metadata delta at/format/algorithm/valid-invalid và package format. Undo chỉ gỡ đúng metadata của lần managed import gần nhất; không lưu raw checksum, criteria/result/snippet, Health/Nutrition hay package nguồn.';
