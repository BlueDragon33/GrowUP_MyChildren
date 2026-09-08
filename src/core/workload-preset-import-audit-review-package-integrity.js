import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { buildWorkloadPresetImportAuditReview, WORKLOAD_PRESET_IMPORT_AUDIT_REVIEW_FORMAT } from './workload-preset-import-audit-review.js';

export const WORKLOAD_PRESET_IMPORT_AUDIT_REVIEW_PACKAGE_FORMAT='growup-workload-preset-import-audit-review-package-v1';
export const WORKLOAD_PRESET_IMPORT_AUDIT_REVIEW_PACKAGE_INTEGRITY_FORMAT='growup-workload-preset-import-audit-review-package-integrity-v1';

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
function payloadWithoutManifest(pkg={}){const copy=structuredClone(pkg);delete copy.manifest;return copy;}
function exactKeys(obj,allowed){return obj&&typeof obj==='object'&&!Array.isArray(obj)&&Object.keys(obj).every((key)=>allowed.includes(key));}
function cleanCriteria(criteria={}){const allowed=['accepted','resolved','conflict-skip','rejected'];return {strategy:criteria.strategy==='skip'||criteria.strategy==='rename'?criteria.strategy:'all',status:allowed.includes(criteria.status)?criteria.status:'all',conflictOnly:Boolean(criteria.conflictOnly)};}
function cleanDecision(item={}){return {status:['accepted','resolved','conflict-skip','rejected'].includes(item.status)?item.status:'rejected',sourceId:text(item.sourceId,80)||null,sourceName:text(item.sourceName,60)||null,resolvedId:text(item.resolvedId,80)||null,resolvedName:text(item.resolvedName,60)||null,nameConflict:Boolean(item.nameConflict),idConflict:Boolean(item.idConflict)};}
function cleanAudit(item={}){const at=iso(item.at);if(!at)return null;return {at,strategy:item.strategy==='rename'?'rename':'skip',decisions:array(item.decisions).map(cleanDecision),added:array(item.added).map((entry)=>({id:text(entry.id,80),name:text(entry.name,60)})).filter((entry)=>entry.id&&entry.name)};}
function cleanSummary(summary={}){const n=(value)=>Math.max(0,Math.min(9999,Number(value)||0));return {auditCount:n(summary.auditCount),decisionCount:n(summary.decisionCount),renameAudits:n(summary.renameAudits),skipAudits:n(summary.skipAudits),conflicts:n(summary.conflicts),resolved:n(summary.resolved),skipped:n(summary.skipped),rejected:n(summary.rejected),accepted:n(summary.accepted),sourceToResolvedChanges:n(summary.sourceToResolvedChanges),addedPresets:n(summary.addedPresets)};}
function safeAuditShape(item={}){return exactKeys(item,['at','strategy','decisions','added'])&&array(item.decisions).every((decision)=>exactKeys(decision,['status','sourceId','sourceName','resolvedId','resolvedName','nameConflict','idConflict']))&&array(item.added).every((entry)=>exactKeys(entry,['id','name']));}

export function buildWorkloadPresetImportAuditReviewIntegrityPackage(settings={},criteria={}){
  const review=buildWorkloadPresetImportAuditReview(settings,criteria),payload={format:WORKLOAD_PRESET_IMPORT_AUDIT_REVIEW_PACKAGE_FORMAT,version:1,sourceFormat:WORKLOAD_PRESET_IMPORT_AUDIT_REVIEW_FORMAT,criteria:cleanCriteria(review.criteria),summary:cleanSummary(review.summary),audits:review.audits.map(cleanAudit).filter(Boolean),readOnly:true,actionsApplied:false},checksum=sha256Hex(canonicalStringify(payload));
  return {...payload,manifest:{format:WORKLOAD_PRESET_IMPORT_AUDIT_REVIEW_PACKAGE_INTEGRITY_FORMAT,algorithm:'SHA-256',scope:'canonical-package-without-manifest',checksum,auditCount:payload.audits.length,decisionCount:payload.summary.decisionCount}};
}

export function verifyWorkloadPresetImportAuditReviewIntegrityPackage(pkg={}){
  const payload=payloadWithoutManifest(pkg),expected=text(pkg?.manifest?.checksum,128),actual=sha256Hex(canonicalStringify(payload)),shape=pkg?.format===WORKLOAD_PRESET_IMPORT_AUDIT_REVIEW_PACKAGE_FORMAT&&Number(pkg?.version)===1&&pkg?.sourceFormat===WORKLOAD_PRESET_IMPORT_AUDIT_REVIEW_FORMAT&&pkg?.readOnly===true&&pkg?.actionsApplied===false&&Array.isArray(pkg?.audits)&&exactKeys(pkg?.criteria||{},['strategy','status','conflictOnly'])&&exactKeys(pkg?.summary||{},['auditCount','decisionCount','renameAudits','skipAudits','conflicts','resolved','skipped','rejected','accepted','sourceToResolvedChanges','addedPresets'])&&pkg.audits.every(safeAuditShape),audits=shape?pkg.audits.map(cleanAudit).filter(Boolean):[];
  return {valid:Boolean(expected)&&shape&&audits.length===pkg.audits.length&&pkg?.manifest?.format===WORKLOAD_PRESET_IMPORT_AUDIT_REVIEW_PACKAGE_INTEGRITY_FORMAT&&pkg?.manifest?.algorithm==='SHA-256'&&expected===actual,format:pkg?.manifest?.format||null,algorithm:'SHA-256',criteria:cleanCriteria(pkg?.criteria||{}),summary:cleanSummary(pkg?.summary||{}),audits,readOnly:true,actionsApplied:false};
}

export function reviewWorkloadPresetImportAuditReviewIntegrityPackage(pkg={}){
  const verification=verifyWorkloadPresetImportAuditReviewIntegrityPackage(pkg);if(!verification.valid)return {valid:false,reason:'invalid-integrity',summary:cleanSummary({}),readOnly:true,actionsApplied:false};
  return {valid:true,reason:null,summary:verification.summary,criteria:verification.criteria,readOnly:true,actionsApplied:false};
}

export const WORKLOAD_PRESET_IMPORT_AUDIT_REVIEW_PACKAGE_INTEGRITY_NOTE='Lượt 122 chỉ portability audit-review metadata trung tính và SHA-256. Package không chấp nhận config/internal signature/child data hay trường ngoài allowlist, không tạo score/rank/performance/health semantics và không có đường apply preset.';
