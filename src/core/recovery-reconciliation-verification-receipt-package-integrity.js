import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { buildRecoveryReconciliationVerificationReceiptPackage, RECOVERY_RECONCILIATION_VERIFICATION_RECEIPT_PACKAGE_FORMAT } from './recovery-reconciliation-verification-receipt-management.js';

export const RECOVERY_RECONCILIATION_VERIFICATION_RECEIPT_PACKAGE_INTEGRITY_FORMAT='growup-recovery-reconciliation-verification-receipts-integrity-v1';
const MAX_RECEIPTS=50;

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
function count(value){return Math.max(0,Math.min(9999,Number(value)||0));}
function payloadWithoutManifest(pkg={}){const copy=structuredClone(pkg);delete copy.manifest;return copy;}
function normalizeCriteria(criteria={}){return {result:criteria.result==='valid'||criteria.result==='invalid'?criteria.result:'all',format:text(criteria.format,80),from:criteria.from?iso(criteria.from):null,to:criteria.to?iso(criteria.to):null};}
function normalizeReceipt(item={}){const at=iso(item.at),result=item.result==='valid'||item.result==='invalid'?item.result:'';if(!at||!result)return null;return {at,format:text(item.format,80)||'unknown',algorithm:text(item.algorithm,40)||'unknown',result,rowCount:count(item.rowCount)};}
function normalizeVerificationReceipt(item={}){const at=iso(item.at),result=item.result==='valid'||item.result==='invalid'?item.result:'';if(!at||!result)return null;return {at,format:text(item.format,80)||'unknown',algorithm:text(item.algorithm,40)||'unknown',result,receiptCount:count(item.receiptCount)};}

export function withRecoveryVerificationReceiptPackageManifest(pkg={}){
  const payload=payloadWithoutManifest(pkg),checksum=sha256Hex(canonicalStringify(payload));
  return {...payload,manifest:{format:RECOVERY_RECONCILIATION_VERIFICATION_RECEIPT_PACKAGE_INTEGRITY_FORMAT,algorithm:'SHA-256',scope:'canonical-package-without-manifest',checksum,receiptCount:array(payload.receipts).length}};
}

export function buildIntegrityRecoveryReconciliationVerificationReceiptPackage(settings={},criteria={}){
  return withRecoveryVerificationReceiptPackageManifest(buildRecoveryReconciliationVerificationReceiptPackage(settings,criteria));
}

export function verifyRecoveryReconciliationVerificationReceiptPackage(pkg={}){
  const payload=payloadWithoutManifest(pkg),expected=text(pkg?.manifest?.checksum,128),actual=sha256Hex(canonicalStringify(payload)),shape=pkg?.format===RECOVERY_RECONCILIATION_VERIFICATION_RECEIPT_PACKAGE_FORMAT&&Number(pkg?.version)===1&&pkg?.criteria&&Array.isArray(pkg?.receipts),receipts=shape?pkg.receipts.map(normalizeReceipt).filter(Boolean):[],criteria=shape?normalizeCriteria(pkg.criteria):normalizeCriteria({});
  return {valid:Boolean(expected)&&shape&&receipts.length===pkg.receipts.length&&pkg?.manifest?.format===RECOVERY_RECONCILIATION_VERIFICATION_RECEIPT_PACKAGE_INTEGRITY_FORMAT&&pkg?.manifest?.algorithm==='SHA-256'&&expected===actual,format:pkg?.manifest?.format||null,algorithm:'SHA-256',receiptCount:receipts.length,criteria,receipts};
}

export function recoveryVerificationReceiptPackageVerificationReceipts(settings={}){
  return array(settings.recoveryVerificationReceiptPackageVerificationReceipts).map(normalizeVerificationReceipt).filter(Boolean).slice(-MAX_RECEIPTS);
}

export function recordRecoveryVerificationReceiptPackageVerification(settings={},verification={},at=new Date().toISOString()){
  const receipt={at:iso(at)||new Date().toISOString(),format:text(verification?.format,80)||'unknown',algorithm:text(verification?.algorithm,40)||'SHA-256',result:verification?.valid?'valid':'invalid',receiptCount:verification?.valid?count(verification.receiptCount):0},current=recoveryVerificationReceiptPackageVerificationReceipts(settings);
  return {...settings,recoveryVerificationReceiptPackageVerificationReceipts:[...current,receipt].slice(-MAX_RECEIPTS)};
}

export const RECOVERY_RECONCILIATION_VERIFICATION_RECEIPT_PACKAGE_INTEGRITY_NOTE='Recovery verification-receipt package được bọc SHA-256 và chỉ verify cục bộ. Verification history tối đa 50 mục chỉ giữ at/format/algorithm/valid-invalid/receiptCount; không lưu raw checksum, report payload, child name, reminder title, raw ICS và không apply reminder/calendar.';
