import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { receiptImportHistory, RECEIPT_IMPORT_HISTORY_FORMAT } from './receipt-import-history.js';

export const RECEIPT_IMPORT_HISTORY_PACKAGE_FORMAT='growup-receipt-import-history-package-v1';
export const RECEIPT_IMPORT_HISTORY_PACKAGE_INTEGRITY_FORMAT='growup-receipt-import-history-package-integrity-v1';

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
function payloadWithoutManifest(pkg={}){const copy=structuredClone(pkg);delete copy.manifest;return copy;}
function receipt(item={}){const at=iso(item.at),checksumResult=item.checksumResult==='valid'||item.checksumResult==='invalid'?item.checksumResult:'';if(!at||!checksumResult)return null;return {at,format:text(item.format,80)||'unknown',algorithm:text(item.algorithm,40)||'unknown',checksumResult};}
function entry(item={}){const at=iso(item.at),packageFormat=text(item.packageFormat,80);if(!at||!packageFormat)return null;const added=array(item.added).map(receipt).filter(Boolean).slice(0,50);if(!added.length)return null;return {at,packageFormat,added};}

export function buildReceiptImportHistoryPackage(settings={}){
  const imports=receiptImportHistory(settings).map(entry).filter(Boolean);
  const payload={format:RECEIPT_IMPORT_HISTORY_PACKAGE_FORMAT,version:1,sourceFormat:RECEIPT_IMPORT_HISTORY_FORMAT,imports};
  const checksum=sha256Hex(canonicalStringify(payload));
  return {...payload,manifest:{format:RECEIPT_IMPORT_HISTORY_PACKAGE_INTEGRITY_FORMAT,algorithm:'SHA-256',scope:'canonical-package-without-manifest',checksum,importCount:imports.length}};
}

export function verifyReceiptImportHistoryPackage(pkg={}){
  const payload=payloadWithoutManifest(pkg),expected=text(pkg?.manifest?.checksum,128),actual=sha256Hex(canonicalStringify(payload)),shape=pkg?.format===RECEIPT_IMPORT_HISTORY_PACKAGE_FORMAT&&Number(pkg?.version)===1&&pkg?.sourceFormat===RECEIPT_IMPORT_HISTORY_FORMAT&&Array.isArray(pkg?.imports);
  const normalized=shape?pkg.imports.map(entry).filter(Boolean):[];
  return {valid:Boolean(expected)&&shape&&normalized.length===pkg.imports.length&&pkg?.manifest?.format===RECEIPT_IMPORT_HISTORY_PACKAGE_INTEGRITY_FORMAT&&pkg?.manifest?.algorithm==='SHA-256'&&expected===actual,format:pkg?.manifest?.format||null,algorithm:'SHA-256',importCount:normalized.length,imports:normalized};
}

export function reviewReceiptImportHistoryPackage(pkg={}){
  const verification=verifyReceiptImportHistoryPackage(pkg);if(!verification.valid)return {valid:false,reason:'invalid-integrity',imports:[],importCount:0,receiptCount:0};
  return {valid:true,reason:null,imports:verification.imports,importCount:verification.importCount,receiptCount:verification.imports.reduce((sum,item)=>sum+item.added.length,0)};
}

export const RECEIPT_IMPORT_HISTORY_PACKAGE_NOTE='Package lịch sử import chỉ mang metadata at/packageFormat và receipt at/format/algorithm/valid-invalid đã được lưu cục bộ. Không chứa raw source package, manifest nguồn, expected/actual checksum, tên trẻ hay payload export. Package này chỉ để portability/verify/review, không tự nhập lịch sử vào state.';
