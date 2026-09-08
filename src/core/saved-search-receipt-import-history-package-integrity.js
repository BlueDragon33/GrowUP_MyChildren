import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { savedSearchReceiptImportHistory, SAVED_SEARCH_RECEIPT_IMPORT_HISTORY_FORMAT } from './saved-search-receipt-import-history.js';

export const SAVED_SEARCH_RECEIPT_IMPORT_HISTORY_PACKAGE_FORMAT='growup-saved-search-receipt-import-history-package-v1';
export const SAVED_SEARCH_RECEIPT_IMPORT_HISTORY_PACKAGE_INTEGRITY_FORMAT='growup-saved-search-receipt-import-history-package-integrity-v1';

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
function payloadWithoutManifest(pkg={}){const copy=structuredClone(pkg);delete copy.manifest;return copy;}
function receipt(item={}){const at=iso(item.at),result=item.result==='valid'||item.result==='invalid'?item.result:'';if(!at||!result)return null;return {at,format:text(item.format,80)||'unknown',algorithm:text(item.algorithm,40)||'unknown',result};}
function entry(item={}){const at=iso(item.at),packageFormat=text(item.packageFormat,80);if(!at||!packageFormat)return null;const added=array(item.added).map(receipt).filter(Boolean).slice(0,50);if(!added.length)return null;return {at,packageFormat,added};}

export function buildSavedSearchReceiptImportHistoryPackage(settings={}){
  const imports=savedSearchReceiptImportHistory(settings).map(entry).filter(Boolean),payload={format:SAVED_SEARCH_RECEIPT_IMPORT_HISTORY_PACKAGE_FORMAT,version:1,sourceFormat:SAVED_SEARCH_RECEIPT_IMPORT_HISTORY_FORMAT,imports},checksum=sha256Hex(canonicalStringify(payload));
  return {...payload,manifest:{format:SAVED_SEARCH_RECEIPT_IMPORT_HISTORY_PACKAGE_INTEGRITY_FORMAT,algorithm:'SHA-256',scope:'canonical-package-without-manifest',checksum,importCount:imports.length}};
}

export function verifySavedSearchReceiptImportHistoryPackage(pkg={}){
  const payload=payloadWithoutManifest(pkg),expected=text(pkg?.manifest?.checksum,128),actual=sha256Hex(canonicalStringify(payload)),shape=pkg?.format===SAVED_SEARCH_RECEIPT_IMPORT_HISTORY_PACKAGE_FORMAT&&Number(pkg?.version)===1&&pkg?.sourceFormat===SAVED_SEARCH_RECEIPT_IMPORT_HISTORY_FORMAT&&Array.isArray(pkg?.imports),imports=shape?pkg.imports.map(entry).filter(Boolean):[];
  return {valid:Boolean(expected)&&shape&&imports.length===pkg.imports.length&&pkg?.manifest?.format===SAVED_SEARCH_RECEIPT_IMPORT_HISTORY_PACKAGE_INTEGRITY_FORMAT&&pkg?.manifest?.algorithm==='SHA-256'&&expected===actual,format:pkg?.manifest?.format||null,algorithm:'SHA-256',imports,importCount:imports.length};
}

export function reviewSavedSearchReceiptImportHistoryPackage(pkg={}){
  const verification=verifySavedSearchReceiptImportHistoryPackage(pkg);if(!verification.valid)return {valid:false,reason:'invalid-integrity',imports:[],importCount:0,receiptCount:0,readOnly:true};
  return {valid:true,reason:null,imports:verification.imports,importCount:verification.importCount,receiptCount:verification.imports.reduce((sum,item)=>sum+item.added.length,0),readOnly:true};
}

export const SAVED_SEARCH_RECEIPT_IMPORT_HISTORY_PACKAGE_NOTE='Saved Search receipt import-history package chỉ chứa at/packageFormat và receipt metadata at/format/algorithm/valid-invalid, được bảo vệ SHA-256. Không chứa criteria/result/snippet, Health/Nutrition, raw checksum, raw source package hay internal history id. Package chỉ portability/verify/review; undo vẫn chỉ tác động managed state cục bộ.';
