import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { buildRecoveryReconciliationReport, RECOVERY_RECONCILIATION_REPORT_FORMAT } from './recovery-reconciliation-report.js';

export const RECOVERY_RECONCILIATION_REPORT_INTEGRITY_FORMAT='growup-recovery-reconciliation-report-integrity-v1';
const MAX_RECEIPTS=50;
const TOP_KEYS=new Set(['format','version','createdAt','summary','rows','manifest']);
const SUMMARY_KEYS=new Set(['selected','same','different','localOnly','fileOnly']);
const MANIFEST_KEYS=new Set(['format','algorithm','scope','checksum','rowCount']);
const ROW_KEYS=new Set(['id','status','localDate','fileDate','localCompleted','fileCompleted','localOriginDate','fileOriginDate']);
function array(value){return Array.isArray(value)?value:[];}
function text(value,max=120){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
function onlyKeys(value,allowed){return Boolean(value)&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every((key)=>allowed.has(key));}
function withoutManifest(pkg={}){const copy=structuredClone(pkg);delete copy.manifest;return copy;}
function safeDateOrNull(value){return value===null||/^\d{4}-\d{2}-\d{2}$/.test(String(value||''));}
function safeRowShape(row){if(!onlyKeys(row,ROW_KEYS))return false;if(!text(row.id,120)||!['same','different','local-only','file-only'].includes(row.status))return false;for(const key of ['localDate','fileDate','localOriginDate','fileOriginDate'])if(!safeDateOrNull(row[key]))return false;for(const key of ['localCompleted','fileCompleted'])if(row[key]!==null&&typeof row[key]!=='boolean')return false;return true;}
function safeSummaryShape(summary={}){if(!onlyKeys(summary,SUMMARY_KEYS))return false;return [...SUMMARY_KEYS].every((key)=>Number.isInteger(summary[key])&&summary[key]>=0);}
function safeManifestShape(manifest={}){return onlyKeys(manifest,MANIFEST_KEYS)&&manifest.format===RECOVERY_RECONCILIATION_REPORT_INTEGRITY_FORMAT&&manifest.algorithm==='SHA-256'&&manifest.scope==='canonical-package-without-manifest'&&Number.isInteger(manifest.rowCount)&&manifest.rowCount>=0&&Boolean(text(manifest.checksum,128));}

export function withRecoveryReconciliationReportManifest(report={}){
  const payload=withoutManifest(report),checksum=sha256Hex(canonicalStringify(payload));
  return {...payload,manifest:{format:RECOVERY_RECONCILIATION_REPORT_INTEGRITY_FORMAT,algorithm:'SHA-256',scope:'canonical-package-without-manifest',checksum,rowCount:array(payload.rows).length}};
}

export function buildIntegrityRecoveryReconciliationReport(preview={},selectedIds=[]){
  return withRecoveryReconciliationReportManifest(buildRecoveryReconciliationReport(preview,selectedIds));
}

export function verifyRecoveryReconciliationReportIntegrity(pkg={}){
  const expected=text(pkg?.manifest?.checksum,128),actual=sha256Hex(canonicalStringify(withoutManifest(pkg)));
  const shape=onlyKeys(pkg,TOP_KEYS)&&pkg?.format===RECOVERY_RECONCILIATION_REPORT_FORMAT&&Number(pkg?.version)===1&&Boolean(iso(pkg?.createdAt))&&safeSummaryShape(pkg?.summary)&&Array.isArray(pkg?.rows)&&pkg.rows.every(safeRowShape)&&safeManifestShape(pkg?.manifest)&&pkg.manifest.rowCount===pkg.rows.length&&pkg.summary.selected===pkg.rows.length;
  return {valid:Boolean(expected)&&shape&&expected===actual,format:pkg?.manifest?.format||null,algorithm:'SHA-256',expected,actual,rowCount:array(pkg?.rows).length};
}

export function recoveryReconciliationReportVerificationReceipts(settings={}){
  return array(settings.recoveryReconciliationReportVerificationReceipts).slice(-MAX_RECEIPTS).map((item)=>({at:iso(item.at)||new Date().toISOString(),format:text(item.format,120)||'unknown',algorithm:text(item.algorithm,40)||'unknown',result:item.result==='valid'?'valid':'invalid',rowCount:Math.max(0,Number(item.rowCount)||0)}));
}

export function recordRecoveryReconciliationReportVerificationReceipt(settings={},verification={},at=new Date().toISOString()){
  const receipt={at:iso(at)||new Date().toISOString(),format:text(verification.format,120)||'unknown',algorithm:text(verification.algorithm,40)||'unknown',result:verification.valid?'valid':'invalid',rowCount:Math.max(0,Number(verification.rowCount)||0)};
  return {...settings,recoveryReconciliationReportVerificationReceipts:[...recoveryReconciliationReportVerificationReceipts(settings),receipt].slice(-MAX_RECEIPTS)};
}

export const RECOVERY_RECONCILIATION_REPORT_INTEGRITY_NOTE='Recovery reconciliation report được ký manifest SHA-256; verifier dùng allowlist nghiêm ngặt cho top-level, summary, manifest và row id/status/date/completed/originDate. Receipt cục bộ chỉ giữ at/format/algorithm/valid-invalid/rowCount, không lưu report nguồn, checksum expected/actual, tên trẻ, reminder title, ICS hoặc API apply/calendar mutation.';
