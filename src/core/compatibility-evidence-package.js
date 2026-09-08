import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { COMPATIBILITY_REQUIRED_FLOWS } from './compatibility-evidence.js';
import { storedCompatibilityEvidence, recordCompatibilityEvidence } from './compatibility-evidence-store.js';

export const COMPATIBILITY_EVIDENCE_PACKAGE_FORMAT='growup-compatibility-evidence-v1';
export const COMPATIBILITY_EVIDENCE_INTEGRITY_FORMAT='growup-compatibility-evidence-integrity-v1';

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function payloadWithoutManifest(pkg={}){const copy=structuredClone(pkg);delete copy.manifest;return copy;}
function validIso(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
function normalizeRawRecord(record={}){const module=text(record.module,80),flow=COMPATIBILITY_REQUIRED_FLOWS.includes(record.flow)?record.flow:'',at=validIso(record.at);if(!module||!flow||!at||record.observed!==true||typeof record.active!=='boolean')return null;return {module,flow,observed:true,active:record.active,at};}
function fingerprint(record){return `${record.module}\u0000${record.flow}\u0000${record.active?1:0}\u0000${record.at}`;}

export function buildCompatibilityEvidencePackage(settings={}){
  const payload={format:COMPATIBILITY_EVIDENCE_PACKAGE_FORMAT,version:1,createdAt:new Date().toISOString(),records:storedCompatibilityEvidence(settings)};
  const checksum=sha256Hex(canonicalStringify(payload));
  return {...payload,manifest:{format:COMPATIBILITY_EVIDENCE_INTEGRITY_FORMAT,algorithm:'SHA-256',scope:'canonical-package-without-manifest',checksum,recordCount:payload.records.length}};
}

export function verifyCompatibilityEvidencePackage(pkg={}){
  const expected=text(pkg?.manifest?.checksum,128),actual=sha256Hex(canonicalStringify(payloadWithoutManifest(pkg)));
  const shape=pkg?.format===COMPATIBILITY_EVIDENCE_PACKAGE_FORMAT&&Number(pkg?.version)===1&&Array.isArray(pkg?.records);
  return {valid:Boolean(expected)&&shape&&pkg?.manifest?.format===COMPATIBILITY_EVIDENCE_INTEGRITY_FORMAT&&pkg?.manifest?.algorithm==='SHA-256'&&expected===actual,format:pkg?.manifest?.format||null,algorithm:'SHA-256',expected,actual};
}

export function previewCompatibilityEvidenceImport(pkg={},settings={}){
  const verification=verifyCompatibilityEvidencePackage(pkg);if(!verification.valid)return {valid:false,reason:'invalid-integrity',accepted:[],duplicates:0,rejected:0,total:array(pkg?.records).length};
  const existing=storedCompatibilityEvidence(settings),seen=new Set(existing.map(fingerprint)),accepted=[];let duplicates=0,rejected=0;
  for(const raw of array(pkg.records).slice(0,240)){
    const record=normalizeRawRecord(raw);if(!record){rejected+=1;continue;}const key=fingerprint(record);if(seen.has(key)){duplicates+=1;continue;}seen.add(key);accepted.push(record);
  }
  return {valid:true,reason:null,accepted,total:array(pkg.records).length,duplicates,rejected,coveredFlows:[...new Set(accepted.map((item)=>item.flow))]};
}

export function applyCompatibilityEvidenceImport(settings={},pkg={}){
  const preview=previewCompatibilityEvidenceImport(pkg,settings);if(!preview.valid)return {settings,changed:false,added:0,reason:preview.reason};
  if(!preview.accepted.length)return {settings,changed:false,added:0,duplicates:preview.duplicates,rejected:preview.rejected,reason:'nothing-to-import'};
  const next=recordCompatibilityEvidence(settings,preview.accepted);
  return {settings:next,changed:true,added:preview.accepted.length,duplicates:preview.duplicates,rejected:preview.rejected,reason:'imported'};
}

export const COMPATIBILITY_EVIDENCE_PACKAGE_NOTE='Evidence package chỉ chứa module/flow/observed/active/timestamp đã chuẩn hóa, có SHA-256 và validation đủ 6 tên flow hợp lệ. Import không tạo Axe evidence giả, không chứa selector/DOM payload/child data và không thực hiện legacy removal; retirement vẫn là thao tác riêng qua exact-head full gate.';
