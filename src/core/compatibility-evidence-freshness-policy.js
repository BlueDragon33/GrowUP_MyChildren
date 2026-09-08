import { compatibilityEvidenceFreshnessSummary } from './compatibility-evidence-import-history.js';

export const COMPATIBILITY_EVIDENCE_FRESHNESS_POLICY_FORMAT='growup-compatibility-evidence-freshness-policy-v1';
export const DEFAULT_COMPATIBILITY_EVIDENCE_FRESH_DAYS=30;

function days(value){return Math.max(1,Math.min(3650,Number(value)||DEFAULT_COMPATIBILITY_EVIDENCE_FRESH_DAYS));}

export function compatibilityEvidenceFreshnessPolicy(settings={}){
  return {format:COMPATIBILITY_EVIDENCE_FRESHNESS_POLICY_FORMAT,freshDays:days(settings?.compatibilityEvidenceFreshnessPolicy?.freshDays)};
}

export function setCompatibilityEvidenceFreshnessPolicy(settings={},freshDays=DEFAULT_COMPATIBILITY_EVIDENCE_FRESH_DAYS){
  return {...settings,compatibilityEvidenceFreshnessPolicy:{format:COMPATIBILITY_EVIDENCE_FRESHNESS_POLICY_FORMAT,freshDays:days(freshDays)}};
}

export function resetCompatibilityEvidenceFreshnessPolicy(settings={}){
  return {...settings,compatibilityEvidenceFreshnessPolicy:{format:COMPATIBILITY_EVIDENCE_FRESHNESS_POLICY_FORMAT,freshDays:DEFAULT_COMPATIBILITY_EVIDENCE_FRESH_DAYS}};
}

export function buildCompatibilityEvidenceFreshnessReview(settings={},now=new Date().toISOString()){
  const policy=compatibilityEvidenceFreshnessPolicy(settings),summary=compatibilityEvidenceFreshnessSummary(settings,now,policy.freshDays),modules=summary.modules.filter((row)=>!row.fresh).map((row)=>({module:row.module,missingFlows:[...row.missingFlows],staleFlows:[...row.staleFlows],axeRecheckRequired:Boolean(row.axeRecheckRequired)}));
  return {format:'growup-compatibility-evidence-freshness-review-v1',generatedAt:summary.generatedAt,freshDays:policy.freshDays,attentionRequired:modules.length>0,modules,axeRecheckModules:[...summary.axeRecheckModules],retirementAllowed:false,actionsApplied:false};
}

export function compatibilityEvidenceFreshnessGate(settings={},now=new Date().toISOString()){
  const review=buildCompatibilityEvidenceFreshnessReview(settings,now);return {ready:!review.attentionRequired,reviewRequired:review.attentionRequired,freshDays:review.freshDays,attentionModules:review.modules.map((item)=>item.module),axeRecheckModules:review.axeRecheckModules,retirementAllowed:false,actionsApplied:false};
}

export const COMPATIBILITY_EVIDENCE_FRESHNESS_POLICY_NOTE='Freshness policy chỉ cấu hình tuổi bằng chứng và tạo stale/missing review gate. Review không xóa module, không đổi active state và luôn retirementAllowed:false/actionsApplied:false. Axe stale/missing vẫn phải tái tạo bằng actual local Axe run, không được nhập từ package.';
