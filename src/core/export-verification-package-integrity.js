import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { exportVerificationReceipts } from './export-verification-history.js';
import { buildExportVerificationReceiptPackage, EXPORT_VERIFICATION_RECEIPT_PACKAGE_FORMAT } from './export-verification-management.js';

export const EXPORT_VERIFICATION_RECEIPT_INTEGRITY_FORMAT='growup-safe-export-verification-receipts-integrity-v1';
const MAX_RECEIPTS=50;

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function payloadWithoutManifest(pkg={}){const copy=structuredClone(pkg);delete copy.manifest;return copy;}
function normalizeReceipt(item={}){const date=new Date(item.at);if(Number.isNaN(date.getTime()))return null;const result=item.checksumResult==='valid'||item.checksumResult==='invalid'?item.checksumResult:'';if(!result)return null;return {at:date.toISOString(),format:text(item.format,80)||'unknown',algorithm:text(item.algorithm,40)||'unknown',checksumResult:result};}
function fingerprint(item){return `${item.at}\u0000${item.format}\u0000${item.algorithm}\u0000${item.checksumResult}`;}

export function withExportVerificationReceiptManifest(pkg={}){
  const payload=payloadWithoutManifest(pkg),checksum=sha256Hex(canonicalStringify(payload));
  return {...payload,manifest:{format:EXPORT_VERIFICATION_RECEIPT_INTEGRITY_FORMAT,algorithm:'SHA-256',scope:'canonical-package-without-manifest',checksum,receiptCount:array(payload.receipts).length}};
}

export function buildIntegrityExportVerificationReceiptPackage(settings={},criteria={}){
  return withExportVerificationReceiptManifest(buildExportVerificationReceiptPackage(settings,criteria));
}

export function verifyExportVerificationReceiptPackageIntegrity(pkg={}){
  const expected=text(pkg?.manifest?.checksum,128),actual=sha256Hex(canonicalStringify(payloadWithoutManifest(pkg)));
  const payloadValid=pkg?.format===EXPORT_VERIFICATION_RECEIPT_PACKAGE_FORMAT&&Number(pkg?.version)===1&&Array.isArray(pkg?.receipts);
  return {valid:Boolean(expected)&&payloadValid&&pkg?.manifest?.format===EXPORT_VERIFICATION_RECEIPT_INTEGRITY_FORMAT&&pkg?.manifest?.algorithm==='SHA-256'&&expected===actual,format:pkg?.manifest?.format||null,algorithm:'SHA-256',expected,actual};
}

export function previewExportVerificationReceiptImport(pkg={},settings={}){
  const verification=verifyExportVerificationReceiptPackageIntegrity(pkg);if(!verification.valid)return {valid:false,reason:'invalid-integrity',accepted:[],duplicates:0,rejected:0,total:array(pkg?.receipts).length};
  const existing=exportVerificationReceipts(settings),seen=new Set(existing.map(fingerprint)),accepted=[];let duplicates=0,rejected=0;
  for(const raw of array(pkg.receipts).slice(0,100)){
    const item=normalizeReceipt(raw);if(!item){rejected+=1;continue;}const key=fingerprint(item);if(seen.has(key)){duplicates+=1;continue;}seen.add(key);accepted.push(item);
  }
  return {valid:true,reason:null,accepted,total:array(pkg.receipts).length,duplicates,rejected};
}

export function applyExportVerificationReceiptImport(settings={},pkg={}){
  const preview=previewExportVerificationReceiptImport(pkg,settings);if(!preview.valid)return {settings,changed:false,added:0,reason:preview.reason};
  const current=exportVerificationReceipts(settings),capacity=Math.max(0,MAX_RECEIPTS-current.length),incoming=preview.accepted.slice(0,capacity);
  return {settings:{...settings,safeExportVerificationReceipts:[...current,...incoming].slice(-MAX_RECEIPTS)},changed:incoming.length>0,added:incoming.length,duplicates:preview.duplicates,rejected:preview.rejected,reason:incoming.length?'imported':'nothing-to-import'};
}

export const EXPORT_VERIFICATION_RECEIPT_INTEGRITY_NOTE='Receipt package có SHA-256 để phát hiện chỉnh sửa trước import. Preview loại receipt sai cấu trúc và receipt trùng; store vẫn tối đa 50 mục metadata at/format/algorithm/valid-invalid, không lưu checksum nguồn, payload export, dữ liệu trẻ hay free-text.';
