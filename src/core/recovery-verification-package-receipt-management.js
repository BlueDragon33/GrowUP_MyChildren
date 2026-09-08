import { recoveryVerificationReceiptPackageVerificationReceipts } from './recovery-reconciliation-verification-receipt-package-integrity.js';

export const RECOVERY_VERIFICATION_PACKAGE_RECEIPT_MANAGEMENT_FORMAT='growup-recovery-verification-package-verification-receipts-v1';

function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function criteriaOf(criteria={}){return {result:criteria.result==='valid'||criteria.result==='invalid'?criteria.result:'all',format:text(criteria.format,80)};}
function matches(item,criteria){if(criteria.result!=='all'&&item.result!==criteria.result)return false;if(criteria.format&&item.format!==criteria.format)return false;return true;}

export function filterRecoveryVerificationPackageReceipts(settings={},criteria={}){
  const normalized=criteriaOf(criteria);return recoveryVerificationReceiptPackageVerificationReceipts(settings).filter((item)=>matches(item,normalized));
}

export function buildRecoveryVerificationPackageReceiptManagementPackage(settings={},criteria={}){
  const normalized=criteriaOf(criteria);return {format:RECOVERY_VERIFICATION_PACKAGE_RECEIPT_MANAGEMENT_FORMAT,version:1,criteria:normalized,receipts:filterRecoveryVerificationPackageReceipts(settings,normalized)};
}

export function clearRecoveryVerificationPackageReceipts(settings={},criteria={},confirmed=false){
  if(!confirmed)return {settings,changed:false,removed:0,reason:'confirmation-required'};
  const normalized=criteriaOf(criteria),current=recoveryVerificationReceiptPackageVerificationReceipts(settings),remaining=current.filter((item)=>!matches(item,normalized)),removed=current.length-remaining.length;if(!removed)return {settings,changed:false,removed:0,reason:'nothing-to-clear'};
  return {settings:{...settings,recoveryVerificationReceiptPackageVerificationReceipts:remaining},changed:true,removed,reason:'cleared'};
}

export const RECOVERY_VERIFICATION_PACKAGE_RECEIPT_MANAGEMENT_NOTE='Lượt 124 chỉ quản lý verification-receipt metadata do L119 tạo: filter/export/confirmed-clear trên at/format/algorithm/result/receiptCount. Không chứa report payload, raw checksum, child name, reminder title hay ICS và không thay đổi reminder/calendar.';
