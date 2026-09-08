import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { compatibilityAxeRecheckRequests } from './compatibility-evidence-freshness-review-package.js';
import { buildCompatibilityEvidenceFreshnessReview } from './compatibility-evidence-freshness-policy.js';

export const COMPATIBILITY_AXE_RECHECK_FRESHNESS_EVIDENCE_PACKAGE_FORMAT='growup-compatibility-axe-recheck-freshness-evidence-v1';
export const COMPATIBILITY_AXE_RECHECK_FRESHNESS_EVIDENCE_INTEGRITY_FORMAT='growup-compatibility-axe-recheck-freshness-evidence-integrity-v1';

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
function payloadWithoutManifest(pkg={}){const copy=structuredClone(pkg);delete copy.manifest;return copy;}
function criteriaOf(criteria={}){return {status:criteria.status==='pending'||criteria.status==='passed'?criteria.status:'all',module:text(criteria.module,80)};}
function cleanRequest(item={}){const module=text(item.module,80),requestedAt=iso(item.requestedAt),status=item.status==='passed'?'passed':'pending';if(!module||!requestedAt)return null;return {module,requestedAt,status,completedAt:status==='passed'?iso(item.completedAt):null,active:status==='passed'?Boolean(item.active):null};}
function matches(item,criteria){if(criteria.status!=='all'&&item.status!==criteria.status)return false;if(criteria.module&&item.module!==criteria.module)return false;return true;}
function cleanModule(item={}){const module=text(item.module,80);if(!module)return null;return {module,missingFlows:array(item.missingFlows).map((flow)=>text(flow,40)).filter(Boolean).slice(0,20),staleFlows:array(item.staleFlows).map((flow)=>text(flow,40)).filter(Boolean).slice(0,20),axeRecheckRequired:Boolean(item.axeRecheckRequired)};}

export function filterCompatibilityAxeRecheckRequests(settings={},criteria={}){
  const normalized=criteriaOf(criteria);return compatibilityAxeRecheckRequests(settings).map(cleanRequest).filter(Boolean).filter((item)=>matches(item,normalized));
}

export function clearCompatibilityAxeRecheckRequests(settings={},criteria={},confirmed=false){
  if(!confirmed)return {settings,changed:false,removed:0,reason:'confirmation-required'};
  const normalized=criteriaOf(criteria),current=compatibilityAxeRecheckRequests(settings).map(cleanRequest).filter(Boolean),remaining=current.filter((item)=>!matches(item,normalized)),removed=current.length-remaining.length;if(!removed)return {settings,changed:false,removed:0,reason:'nothing-to-clear'};
  return {settings:{...settings,compatibilityAxeRecheckRequests:remaining},changed:true,removed,reason:'cleared'};
}

export function buildCompatibilityAxeRecheckFreshnessEvidencePackage(settings={},criteria={},now=new Date().toISOString()){
  const normalized=criteriaOf(criteria),review=buildCompatibilityEvidenceFreshnessReview(settings,now),requests=filterCompatibilityAxeRecheckRequests(settings,normalized),payload={format:COMPATIBILITY_AXE_RECHECK_FRESHNESS_EVIDENCE_PACKAGE_FORMAT,version:1,generatedAt:review.generatedAt,freshDays:review.freshDays,criteria:normalized,requests,review:{attentionRequired:Boolean(review.attentionRequired),modules:array(review.modules).map(cleanModule).filter(Boolean),axeRecheckModules:array(review.axeRecheckModules).map((module)=>text(module,80)).filter(Boolean),retirementAllowed:false,actionsApplied:false}},checksum=sha256Hex(canonicalStringify(payload));
  return {...payload,manifest:{format:COMPATIBILITY_AXE_RECHECK_FRESHNESS_EVIDENCE_INTEGRITY_FORMAT,algorithm:'SHA-256',scope:'canonical-package-without-manifest',checksum,requestCount:requests.length,moduleCount:payload.review.modules.length}};
}

export function verifyCompatibilityAxeRecheckFreshnessEvidencePackage(pkg={}){
  const payload=payloadWithoutManifest(pkg),expected=text(pkg?.manifest?.checksum,128),actual=sha256Hex(canonicalStringify(payload)),generatedAt=iso(pkg?.generatedAt),shape=pkg?.format===COMPATIBILITY_AXE_RECHECK_FRESHNESS_EVIDENCE_PACKAGE_FORMAT&&Number(pkg?.version)===1&&Boolean(generatedAt)&&pkg?.criteria&&typeof pkg.criteria==='object'&&Array.isArray(pkg?.requests)&&pkg?.review&&typeof pkg.review==='object'&&Array.isArray(pkg.review.modules)&&Array.isArray(pkg.review.axeRecheckModules)&&pkg.review.retirementAllowed===false&&pkg.review.actionsApplied===false,requests=shape?pkg.requests.map(cleanRequest).filter(Boolean):[],modules=shape?pkg.review.modules.map(cleanModule).filter(Boolean):[];
  return {valid:Boolean(expected)&&shape&&requests.length===pkg.requests.length&&modules.length===pkg.review.modules.length&&pkg?.manifest?.format===COMPATIBILITY_AXE_RECHECK_FRESHNESS_EVIDENCE_INTEGRITY_FORMAT&&pkg?.manifest?.algorithm==='SHA-256'&&expected===actual,format:pkg?.manifest?.format||null,algorithm:'SHA-256',generatedAt,criteria:criteriaOf(pkg?.criteria||{}),requestCount:requests.length,moduleCount:modules.length,retirementAllowed:false,actionsApplied:false};
}

export const COMPATIBILITY_AXE_RECHECK_MANAGEMENT_NOTE='Lượt 125 quản lý request/history Axe metadata cục bộ và xuất freshness re-evaluation evidence có SHA-256. Confirmed-clear chỉ xóa request metadata, không xóa compatibility evidence. Package luôn retirementAllowed=false/actionsApplied=false; PASS vẫn chỉ được tạo bởi actual local browser Axe qua cơ chế L120.';
