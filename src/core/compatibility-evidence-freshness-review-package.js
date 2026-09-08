import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { buildCompatibilityEvidenceFreshnessReview } from './compatibility-evidence-freshness-policy.js';
import { recordCompatibilityEvidence } from './compatibility-evidence-store.js';

export const COMPATIBILITY_EVIDENCE_FRESHNESS_REVIEW_PACKAGE_FORMAT='growup-compatibility-evidence-freshness-review-package-v1';
export const COMPATIBILITY_EVIDENCE_FRESHNESS_REVIEW_PACKAGE_INTEGRITY_FORMAT='growup-compatibility-evidence-freshness-review-package-integrity-v1';
export const COMPATIBILITY_AXE_RECHECK_REQUESTS_FORMAT='growup-compatibility-axe-recheck-requests-v1';
const MAX_REQUESTS=50;

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
function payloadWithoutManifest(pkg={}){const copy=structuredClone(pkg);delete copy.manifest;return copy;}
function cleanModule(item={}){const module=text(item.module,80);if(!module)return null;return {module,missingFlows:array(item.missingFlows).map((flow)=>text(flow,40)).filter(Boolean).slice(0,20),staleFlows:array(item.staleFlows).map((flow)=>text(flow,40)).filter(Boolean).slice(0,20),axeRecheckRequired:Boolean(item.axeRecheckRequired)};}
function cleanRequest(item={}){const module=text(item.module,80),requestedAt=iso(item.requestedAt),status=item.status==='passed'?'passed':'pending';if(!module||!requestedAt)return null;return {module,requestedAt,status,completedAt:status==='passed'?iso(item.completedAt):null,active:status==='passed'?Boolean(item.active):null};}

export function buildCompatibilityEvidenceFreshnessReviewPackage(settings={},now=new Date().toISOString()){
  const review=buildCompatibilityEvidenceFreshnessReview(settings,now),payload={format:COMPATIBILITY_EVIDENCE_FRESHNESS_REVIEW_PACKAGE_FORMAT,version:1,generatedAt:review.generatedAt,freshDays:review.freshDays,attentionRequired:Boolean(review.attentionRequired),modules:review.modules.map(cleanModule).filter(Boolean),axeRecheckModules:array(review.axeRecheckModules).map((module)=>text(module,80)).filter(Boolean),retirementAllowed:false,actionsApplied:false},checksum=sha256Hex(canonicalStringify(payload));
  return {...payload,manifest:{format:COMPATIBILITY_EVIDENCE_FRESHNESS_REVIEW_PACKAGE_INTEGRITY_FORMAT,algorithm:'SHA-256',scope:'canonical-package-without-manifest',checksum,moduleCount:payload.modules.length}};
}

export function verifyCompatibilityEvidenceFreshnessReviewPackage(pkg={}){
  const payload=payloadWithoutManifest(pkg),expected=text(pkg?.manifest?.checksum,128),actual=sha256Hex(canonicalStringify(payload)),generatedAt=iso(pkg?.generatedAt),shape=pkg?.format===COMPATIBILITY_EVIDENCE_FRESHNESS_REVIEW_PACKAGE_FORMAT&&Number(pkg?.version)===1&&Boolean(generatedAt)&&Array.isArray(pkg?.modules)&&Array.isArray(pkg?.axeRecheckModules)&&pkg?.retirementAllowed===false&&pkg?.actionsApplied===false,modules=shape?pkg.modules.map(cleanModule).filter(Boolean):[];
  return {valid:Boolean(expected)&&shape&&modules.length===pkg.modules.length&&pkg?.manifest?.format===COMPATIBILITY_EVIDENCE_FRESHNESS_REVIEW_PACKAGE_INTEGRITY_FORMAT&&pkg?.manifest?.algorithm==='SHA-256'&&expected===actual,format:pkg?.manifest?.format||null,algorithm:'SHA-256',generatedAt,moduleCount:modules.length,attentionRequired:Boolean(pkg?.attentionRequired),freshDays:Math.max(1,Math.min(3650,Number(pkg?.freshDays)||30)),modules,axeRecheckModules:array(pkg?.axeRecheckModules).map((module)=>text(module,80)).filter(Boolean),retirementAllowed:false,actionsApplied:false};
}

export function compatibilityAxeRecheckRequests(settings={}){
  return array(settings.compatibilityAxeRecheckRequests).map(cleanRequest).filter(Boolean).slice(-MAX_REQUESTS);
}

export function requestCompatibilityAxeRecheck(settings={},module='',at=new Date().toISOString()){
  const name=text(module,80),when=iso(at);if(!name||!when)return {settings,changed:false,reason:'invalid-request'};
  const current=compatibilityAxeRecheckRequests(settings);if(current.some((item)=>item.module===name&&item.status==='pending'))return {settings,changed:false,reason:'already-pending'};
  const request={module:name,requestedAt:when,status:'pending',completedAt:null,active:null};
  return {settings:{...settings,compatibilityAxeRecheckRequests:[...current,request].slice(-MAX_REQUESTS)},changed:true,request,reason:'requested'};
}

export function recordActualLocalAxeRecheck(settings={},result={},at=new Date().toISOString()){
  const module=text(result.module,80),when=iso(at),source=text(result.source,40);if(!module||!when||result.passed!==true||source!=='actual-local-axe')return {settings,changed:false,reason:'actual-local-axe-pass-required'};
  const requests=compatibilityAxeRecheckRequests(settings),index=requests.findLastIndex((item)=>item.module===module&&item.status==='pending');if(index<0)return {settings,changed:false,reason:'request-required'};
  const active=Boolean(result.active),withEvidence=recordCompatibilityEvidence(settings,[{module,flow:'axe',observed:true,active,at:when}],when),nextRequests=[...requests];nextRequests[index]={...nextRequests[index],status:'passed',completedAt:when,active};
  return {settings:{...withEvidence,compatibilityAxeRecheckRequests:nextRequests.slice(-MAX_REQUESTS)},changed:true,reason:'recorded-actual-local-axe-pass',record:{module,flow:'axe',observed:true,active,at:when}};
}

export const COMPATIBILITY_EVIDENCE_FRESHNESS_REVIEW_PACKAGE_NOTE='Freshness review export được bảo vệ SHA-256 và luôn retirementAllowed=false/actionsApplied=false. UI chỉ tạo Axe recheck request; không có thao tác người dùng để tự đánh dấu PASS. Axe PASS chỉ được ghi khi caller cung cấp kết quả actual-local-axe sau một audit thật, đồng thời phải có pending request; package verify không xóa legacy module.';
