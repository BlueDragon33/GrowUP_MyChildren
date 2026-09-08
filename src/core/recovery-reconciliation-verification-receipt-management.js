import { recoveryReconciliationReportVerificationReceipts } from './recovery-reconciliation-report-integrity.js';

export const RECOVERY_RECONCILIATION_VERIFICATION_RECEIPT_PACKAGE_FORMAT='growup-recovery-reconciliation-verification-receipts-v1';

function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
function criteriaOf(criteria={}){const from=iso(criteria.from),to=iso(criteria.to);return {result:criteria.result==='valid'||criteria.result==='invalid'?criteria.result:'all',format:text(criteria.format,80),from,to};}
function matches(item,criteria){if(criteria.result!=='all'&&item.result!==criteria.result)return false;if(criteria.format&&item.format!==criteria.format)return false;const at=new Date(item.at).getTime();if(criteria.from&&at<new Date(criteria.from).getTime())return false;if(criteria.to&&at>new Date(criteria.to).getTime())return false;return true;}

export function filterRecoveryReconciliationVerificationReceipts(settings={},criteria={}){
  const normalized=criteriaOf(criteria);return recoveryReconciliationReportVerificationReceipts(settings).filter((item)=>matches(item,normalized));
}

export function buildRecoveryReconciliationVerificationReceiptPackage(settings={},criteria={}){
  const normalized=criteriaOf(criteria),receipts=filterRecoveryReconciliationVerificationReceipts(settings,normalized);
  return {format:RECOVERY_RECONCILIATION_VERIFICATION_RECEIPT_PACKAGE_FORMAT,version:1,criteria:normalized,receipts};
}

export function clearRecoveryReconciliationVerificationReceipts(settings={},criteria={},confirmed=false){
  if(!confirmed)return {settings,changed:false,removed:0,reason:'confirmation-required'};
  const normalized=criteriaOf(criteria),current=recoveryReconciliationReportVerificationReceipts(settings),remaining=current.filter((item)=>!matches(item,normalized)),removed=current.length-remaining.length;
  if(!removed)return {settings,changed:false,removed:0,reason:'nothing-to-clear'};
  return {settings:{...settings,recoveryReconciliationReportVerificationReceipts:remaining},changed:true,removed,reason:'cleared'};
}

export const RECOVERY_RECONCILIATION_VERIFICATION_RECEIPT_MANAGEMENT_NOTE='Quản lý receipt chỉ lọc/xuất/xóa có xác nhận metadata at/format/algorithm/valid-invalid/rowCount. Không xuất report payload, raw checksum, child name, reminder title hoặc raw ICS; không apply reminder/calendar.';
