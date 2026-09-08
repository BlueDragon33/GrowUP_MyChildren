import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { workloadPresetImportHistory, WORKLOAD_PRESET_IMPORT_HISTORY_FORMAT } from './workload-preset-import-history.js';

export const WORKLOAD_PRESET_IMPORT_AUDIT_PACKAGE_FORMAT='growup-workload-preset-import-audit-package-v1';
export const WORKLOAD_PRESET_IMPORT_AUDIT_INTEGRITY_FORMAT='growup-workload-preset-import-audit-package-integrity-v1';

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
function payloadWithoutManifest(pkg={}){const copy=structuredClone(pkg);delete copy.manifest;return copy;}
function decision(item={}){const status=['accepted','resolved','conflict-skip','rejected'].includes(item.status)?item.status:'';if(!status)return null;return {status,sourceId:text(item.sourceId,80)||null,sourceName:text(item.sourceName,60)||null,resolvedId:text(item.resolvedId,80)||null,resolvedName:text(item.resolvedName,60)||null,nameConflict:Boolean(item.nameConflict),idConflict:Boolean(item.idConflict)};}
function added(item={}){const id=text(item.id,80),name=text(item.name,60);if(!id||!name)return null;return {id,name};}
function audit(item={}){const at=iso(item.at);if(!at)return null;return {at,strategy:item.strategy==='rename'?'rename':'skip',decisions:array(item.decisions).map(decision).filter(Boolean).slice(0,100),added:array(item.added).map(added).filter(Boolean).slice(0,20)};}

export function buildWorkloadPresetImportAuditPackage(settings={}){
  const audits=workloadPresetImportHistory(settings).map(audit).filter(Boolean);
  const payload={format:WORKLOAD_PRESET_IMPORT_AUDIT_PACKAGE_FORMAT,version:1,sourceFormat:WORKLOAD_PRESET_IMPORT_HISTORY_FORMAT,audits};
  const checksum=sha256Hex(canonicalStringify(payload));
  return {...payload,manifest:{format:WORKLOAD_PRESET_IMPORT_AUDIT_INTEGRITY_FORMAT,algorithm:'SHA-256',scope:'canonical-package-without-manifest',checksum,auditCount:audits.length}};
}

export function verifyWorkloadPresetImportAuditPackage(pkg={}){
  const payload=payloadWithoutManifest(pkg),expected=text(pkg?.manifest?.checksum,128),actual=sha256Hex(canonicalStringify(payload)),shape=pkg?.format===WORKLOAD_PRESET_IMPORT_AUDIT_PACKAGE_FORMAT&&Number(pkg?.version)===1&&pkg?.sourceFormat===WORKLOAD_PRESET_IMPORT_HISTORY_FORMAT&&Array.isArray(pkg?.audits),audits=shape?pkg.audits.map(audit).filter(Boolean):[];
  return {valid:Boolean(expected)&&shape&&audits.length===pkg.audits.length&&pkg?.manifest?.format===WORKLOAD_PRESET_IMPORT_AUDIT_INTEGRITY_FORMAT&&pkg?.manifest?.algorithm==='SHA-256'&&expected===actual,format:pkg?.manifest?.format||null,algorithm:'SHA-256',audits};
}

export function reviewWorkloadPresetImportAuditPackage(pkg={}){
  const verification=verifyWorkloadPresetImportAuditPackage(pkg);if(!verification.valid)return {valid:false,reason:'invalid-integrity',audits:[],summary:{auditCount:0,conflicts:0,resolved:0,skipped:0,rejected:0}};
  const decisions=verification.audits.flatMap((item)=>item.decisions),summary={auditCount:verification.audits.length,conflicts:decisions.filter((item)=>item.nameConflict||item.idConflict).length,resolved:decisions.filter((item)=>item.status==='resolved').length,skipped:decisions.filter((item)=>item.status==='conflict-skip').length,rejected:decisions.filter((item)=>item.status==='rejected').length};
  return {valid:true,reason:null,audits:verification.audits,summary};
}

export const WORKLOAD_PRESET_IMPORT_AUDIT_PACKAGE_NOTE='Audit package chỉ chứa metadata chiến lược và quyết định source→resolved của preset trung tính đã validation. Không chứa config preset, chữ ký nội bộ, raw import package, childId hoặc score/rank/performance/health semantics. Đây là export/verify/review read-only, không apply preset.';
