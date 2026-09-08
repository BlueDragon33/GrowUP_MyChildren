import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { buildRecoveryReconciliationReport, RECOVERY_RECONCILIATION_REPORT_FORMAT } from './recovery-reconciliation-report.js';

export const RECOVERY_RECONCILIATION_REPORT_INTEGRITY_FORMAT='growup-recovery-reconciliation-report-integrity-v1';
const MAX_RECEIPTS=50;

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?new Date().toISOString():d.toISOString();}
function payloadWithoutManifest(report={}){const copy=structuredClone(report);delete copy.manifest;return copy;}

export function withRecoveryReconciliationReportManifest(report={}){
  const payload=payloadWithoutManifest(report),checksum=sha256Hex(canonicalStringify(payload));
  return {...payload,manifest:{format:RECOVERY_RECONCILIATION_REPORT_INTEGRITY_FORMAT,algorithm:'SHA-256',scope:'canonical-report-without-manifest',checksum,rowCount:array(payload.rows).length}};
}

export function buildIntegrityRecoveryReconciliationReport(preview={},selectedIds=[]){
  return withRecoveryReconciliationReportManifest(buildRecoveryReconciliationReport(preview,selectedIds));
}

export function verifyRecoveryReconciliationReportIntegrity(report={}){
  const expected=text(report?.manifest?.checksum,128),actual=sha256Hex(canonicalStringify(payloadWithoutManifest(report))),shape=report?.format===RECOVERY_RECONCILIATION_REPORT_FORMAT&&Number(report?.version)===1&&Array.isArray(report?.rows);
  return {valid:Boolean(expected)&&shape&&report?.manifest?.format===RECOVERY_RECONCILIATION_REPORT_INTEGRITY_FORMAT&&report?.manifest?.algorithm==='SHA-256'&&expected===actual,format:report?.manifest?.format||null,algorithm:'SHA-256',expected,actual,rowCount:array(report?.rows).length};
}

export function recoveryReconciliationReportVerificationReceipts(settings={}){
  return array(settings.recoveryReconciliationReportVerificationReceipts).slice(-MAX_RECEIPTS).map((item)=>({at:iso(item?.at),format:text(item?.format,80)||'unknown',algorithm:text(item?.algorithm,40)||'unknown',result:item?.result==='valid'?'valid':'invalid',rowCount:Math.max(0,Math.min(9999,Number(item?.rowCount)||0))}));
}

export function recordRecoveryReconciliationReportVerificationReceipt(settings={},verification={},at=new Date().toISOString()){
  const receipt={at:iso(at),format:text(verification?.format,80)||'unknown',algorithm:text(verification?.algorithm,40)||'unknown',result:verification?.valid?'valid':'invalid',rowCount:Math.max(0,Math.min(9999,Number(verification?.rowCount)||0))};
  return {...settings,recoveryReconciliationReportVerificationReceipts:[...recoveryReconciliationReportVerificationReceipts(settings),receipt].slice(-MAX_RECEIPTS)};
}

export const RECOVERY_RECONCILIATION_REPORT_INTEGRITY_NOTE='Báo cáo reconciliation có SHA-256 để phát hiện sửa đổi. Receipt xác minh cục bộ chỉ giữ thời điểm/format/algorithm/valid-invalid/số dòng; không lưu raw checksum, tên trẻ, title reminder, raw ICS hay nội dung report. Đây vẫn là report-only: không apply reminder và không ghi calendar.';
