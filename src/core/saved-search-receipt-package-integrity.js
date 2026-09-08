import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { savedSearchPackageVerificationReceipts } from './saved-search-package-integrity.js';
import { buildSavedSearchIntegrityReceiptPackage, SAVED_SEARCH_RECEIPT_PACKAGE_FORMAT } from './saved-search-integrity-receipt-management.js';

export const SAVED_SEARCH_RECEIPT_INTEGRITY_FORMAT='growup-saved-search-integrity-receipts-package-integrity-v1';
const MAX_RECEIPTS=50;

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function payloadWithoutManifest(pkg={}){const copy=structuredClone(pkg);delete copy.manifest;return copy;}
function normalizeReceipt(item={}){const date=new Date(item.at);if(Number.isNaN(date.getTime()))return null;const result=item.result==='valid'||item.result==='invalid'?item.result:'';if(!result)return null;return {at:date.toISOString(),format:text(item.format,80)||'unknown',algorithm:text(item.algorithm,40)||'unknown',result};}
function fingerprint(item){return `${item.at}\u0000${item.format}\u0000${item.algorithm}\u0000${item.result}`;}

export function withSavedSearchReceiptPackageManifest(pkg={}){
  const payload=payloadWithoutManifest(pkg),checksum=sha256Hex(canonicalStringify(payload));
  return {...payload,manifest:{format:SAVED_SEARCH_RECEIPT_INTEGRITY_FORMAT,algorithm:'SHA-256',scope:'canonical-package-without-manifest',checksum,receiptCount:array(payload.receipts).length}};
}

export function buildIntegritySavedSearchReceiptPackage(settings={},criteria={}){
  return withSavedSearchReceiptPackageManifest(buildSavedSearchIntegrityReceiptPackage(settings,criteria));
}

export function verifySavedSearchReceiptPackageIntegrity(pkg={}){
  const expected=text(pkg?.manifest?.checksum,128),actual=sha256Hex(canonicalStringify(payloadWithoutManifest(pkg))),shape=pkg?.format===SAVED_SEARCH_RECEIPT_PACKAGE_FORMAT&&Number(pkg?.version)===1&&Array.isArray(pkg?.receipts);
  return {valid:Boolean(expected)&&shape&&pkg?.manifest?.format===SAVED_SEARCH_RECEIPT_INTEGRITY_FORMAT&&pkg?.manifest?.algorithm==='SHA-256'&&expected===actual,format:pkg?.manifest?.format||null,algorithm:'SHA-256',expected,actual};
}

export function previewSavedSearchReceiptImport(pkg={},settings={}){
  const verification=verifySavedSearchReceiptPackageIntegrity(pkg);if(!verification.valid)return {valid:false,reason:'invalid-integrity',accepted:[],duplicates:0,rejected:0,total:array(pkg?.receipts).length};
  const existing=savedSearchPackageVerificationReceipts(settings),seen=new Set(existing.map(fingerprint)),accepted=[];let duplicates=0,rejected=0;
  for(const raw of array(pkg.receipts).slice(0,100)){
    const item=normalizeReceipt(raw);if(!item){rejected+=1;continue;}const key=fingerprint(item);if(seen.has(key)){duplicates+=1;continue;}seen.add(key);accepted.push(item);
  }
  return {valid:true,reason:null,accepted,duplicates,rejected,total:array(pkg.receipts).length};
}

export function applySavedSearchReceiptImport(settings={},pkg={}){
  const preview=previewSavedSearchReceiptImport(pkg,settings);if(!preview.valid)return {settings,changed:false,added:0,reason:preview.reason};
  const current=savedSearchPackageVerificationReceipts(settings),capacity=Math.max(0,MAX_RECEIPTS-current.length),incoming=preview.accepted.slice(0,capacity);
  return {settings:{...settings,savedSearchPackageVerificationReceipts:[...current,...incoming].slice(-MAX_RECEIPTS)},changed:incoming.length>0,added:incoming.length,duplicates:preview.duplicates,rejected:preview.rejected,reason:incoming.length?'imported':'nothing-to-import'};
}

export const SAVED_SEARCH_RECEIPT_INTEGRITY_NOTE='Receipt package của Saved Search được bọc SHA-256 trước preview/import. Import chỉ nhận metadata at/format/algorithm/valid-invalid, loại mục sai cấu trúc và trùng, giữ tối đa 50 mục; không lưu expected/actual checksum, criteria payload, result/snippet hoặc dữ liệu Health/Nutrition.';
