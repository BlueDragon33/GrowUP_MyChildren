import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { buildReceiptImportHistoryPackageVerificationReceiptPackage, RECEIPT_IMPORT_HISTORY_PACKAGE_VERIFICATION_RECEIPTS_FORMAT } from './receipt-import-history-package-verification-receipts.js';

export const RECEIPT_HISTORY_VERIFICATION_RECEIPT_PACKAGE_FORMAT='growup-receipt-history-verification-receipt-package-v1';
export const RECEIPT_HISTORY_VERIFICATION_RECEIPT_PACKAGE_INTEGRITY_FORMAT='growup-receipt-history-verification-receipt-package-integrity-v1';

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
function count(value){return Math.max(0,Math.min(9999,Number(value)||0));}
function payloadWithoutManifest(pkg={}){const copy=structuredClone(pkg);delete copy.manifest;return copy;}
function cleanReceipt(item={}){const at=iso(item.at),result=item.result==='valid'||item.result==='invalid'?item.result:'';if(!at||!result)return null;return {at,format:text(item.format,80)||'unknown',algorithm:text(item.algorithm,40)||'unknown',result,importCount:count(item.importCount),receiptCount:count(item.receiptCount)};}
function cleanCriteria(criteria={}){return {result:criteria.result==='valid'||criteria.result==='invalid'?criteria.result:'all',format:text(criteria.format,80)};}

export function buildReceiptHistoryVerificationReceiptIntegrityPackage(settings={},criteria={}){
  const base=buildReceiptImportHistoryPackageVerificationReceiptPackage(settings,criteria),receipts=array(base.receipts).map(cleanReceipt).filter(Boolean),payload={format:RECEIPT_HISTORY_VERIFICATION_RECEIPT_PACKAGE_FORMAT,version:1,sourceFormat:RECEIPT_IMPORT_HISTORY_PACKAGE_VERIFICATION_RECEIPTS_FORMAT,criteria:cleanCriteria(base.criteria),receipts},checksum=sha256Hex(canonicalStringify(payload));
  return {...payload,manifest:{format:RECEIPT_HISTORY_VERIFICATION_RECEIPT_PACKAGE_INTEGRITY_FORMAT,algorithm:'SHA-256',scope:'canonical-package-without-manifest',checksum,receiptCount:receipts.length}};
}

export function verifyReceiptHistoryVerificationReceiptIntegrityPackage(pkg={}){
  const payload=payloadWithoutManifest(pkg),expected=text(pkg?.manifest?.checksum,128),actual=sha256Hex(canonicalStringify(payload)),shape=pkg?.format===RECEIPT_HISTORY_VERIFICATION_RECEIPT_PACKAGE_FORMAT&&Number(pkg?.version)===1&&pkg?.sourceFormat===RECEIPT_IMPORT_HISTORY_PACKAGE_VERIFICATION_RECEIPTS_FORMAT&&Array.isArray(pkg?.receipts)&&pkg?.criteria&&typeof pkg.criteria==='object',receipts=shape?pkg.receipts.map(cleanReceipt).filter(Boolean):[];
  return {valid:Boolean(expected)&&shape&&receipts.length===pkg.receipts.length&&pkg?.manifest?.format===RECEIPT_HISTORY_VERIFICATION_RECEIPT_PACKAGE_INTEGRITY_FORMAT&&pkg?.manifest?.algorithm==='SHA-256'&&expected===actual,format:pkg?.manifest?.format||null,algorithm:'SHA-256',criteria:cleanCriteria(pkg?.criteria||{}),receipts,receiptCount:receipts.length};
}

export function reviewReceiptHistoryVerificationReceiptIntegrityPackage(pkg={}){
  const verification=verifyReceiptHistoryVerificationReceiptIntegrityPackage(pkg);if(!verification.valid)return {valid:false,reason:'invalid-integrity',receiptCount:0,validCount:0,invalidCount:0,readOnly:true,actionsApplied:false};
  return {valid:true,reason:null,receiptCount:verification.receiptCount,validCount:verification.receipts.filter((item)=>item.result==='valid').length,invalidCount:verification.receipts.filter((item)=>item.result==='invalid').length,readOnly:true,actionsApplied:false};
}

export const RECEIPT_HISTORY_VERIFICATION_RECEIPT_PACKAGE_INTEGRITY_NOTE='Lượt 121 ký SHA-256 cho package verification-receipt của L116. Package chỉ chứa criteria và receipt metadata at/format/algorithm/result/importCount/receiptCount; không chứa source history package, raw checksum, child payload hay free-text. Verify/review luôn read-only và không khôi phục history.';
