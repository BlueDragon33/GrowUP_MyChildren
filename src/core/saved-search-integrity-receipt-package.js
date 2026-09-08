import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { savedSearchPackageVerificationReceipts } from './saved-search-package-integrity.js';
import { buildSavedSearchIntegrityReceiptPackage, SAVED_SEARCH_RECEIPT_PACKAGE_FORMAT } from './saved-search-integrity-receipt-management.js';

export const SAVED_SEARCH_RECEIPT_INTEGRITY_FORMAT='growup-saved-search-integrity-receipts-sha256-v1';
const MAX_RECEIPTS=50;
function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
function withoutManifest(pkg={}){const copy=structuredClone(pkg);delete copy.manifest;return copy;}
function normalizeReceipt(item={}){const at=iso(item.at),result=item.result==='valid'||item.result==='invalid'?item.result:'';if(!at||!result)return null;return {at,format:text(item.format,80)||'unknown',algorithm:text(item.algorithm,40)||'unknown',result};}
function fingerprint(item){return `${item.at}\u0000${item.format}\u0000${item.algorithm}\u0000${item.result}`;}

export function withSavedSearchIntegrityReceiptManifest(pkg={}){
  const payload=withoutManifest(pkg),checksum=sha256Hex(canonicalStringify(payload));
  return {...payload,manifest:{format:SAVED_SEARCH_RECEIPT_INTEGRITY_FORMAT,algorithm:'SHA-256',scope:'canonical-package-without-manifest',checksum,receiptCount:array(payload.receipts).length}};
}

export function buildIntegritySavedSearchReceiptPackage(settings={},criteria={}){
  return withSavedSearchIntegrityReceiptManifest(buildSavedSearchIntegrityReceiptPackage(settings,criteria));
}

export function verifySavedSearchIntegrityReceiptPackage(pkg={}){
  const expected=text(pkg?.manifest?.checksum,128),actual=sha256Hex(canonicalStringify(withoutManifest(pkg))),shape=pkg?.format===SAVED_SEARCH_RECEIPT_PACKAGE_FORMAT&&Number(pkg?.version)===1&&Array.isArray(pkg?.receipts);
  return {valid:Boolean(expected)&&shape&&pkg?.manifest?.format===SAVED_SEARCH_RECEIPT_INTEGRITY_FORMAT&&pkg?.manifest?.algorithm==='SHA-256'&&expected===actual,format:pkg?.manifest?.format||null,algorithm:'SHA-256',expected,actual};
}

export function previewSavedSearchIntegrityReceiptImport(pkg={},settings={}){
  const verification=verifySavedSearchIntegrityReceiptPackage(pkg);if(!verification.valid)return {valid:false,reason:'invalid-integrity',accepted:[],duplicates:0,rejected:0,total:array(pkg?.receipts).length};
  const existing=savedSearchPackageVerificationReceipts(settings),seen=new Set(existing.map(fingerprint)),accepted=[];let duplicates=0,rejected=0;
  for(const raw of array(pkg.receipts).slice(0,100)){const item=normalizeReceipt(raw);if(!item){rejected+=1;continue;}const key=fingerprint(item);if(seen.has(key)){duplicates+=1;continue;}seen.add(key);accepted.push(item);}
  return {valid:true,reason:null,accepted,duplicates,rejected,total:array(pkg.receipts).length};
}

export function applySavedSearchIntegrityReceiptImport(settings={},pkg={}){
  const preview=previewSavedSearchIntegrityReceiptImport(pkg,settings);if(!preview.valid)return {settings,changed:false,added:0,reason:preview.reason};
  const current=savedSearchPackageVerificationReceipts(settings),capacity=Math.max(0,MAX_RECEIPTS-current.length),incoming=preview.accepted.slice(0,capacity);
  return {settings:{...settings,savedSearchPackageVerificationReceipts:[...current,...incoming].slice(-MAX_RECEIPTS)},changed:incoming.length>0,added:incoming.length,duplicates:preview.duplicates,rejected:preview.rejected,reason:incoming.length?'imported':'nothing-to-import'};
}

export const SAVED_SEARCH_RECEIPT_PACKAGE_INTEGRITY_NOTE='Receipt Saved Search có package SHA-256 riêng; import chỉ mở sau khi checksum/format hợp lệ, loại metadata sai và receipt trùng, rồi giữ tối đa 50 mục at/format/algorithm/valid-invalid. Không lưu criteria, query result, snippet, checksum expected/actual, Health/Nutrition hay dữ liệu trẻ.';
