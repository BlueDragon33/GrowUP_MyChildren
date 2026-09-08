import { workloadPresetImportHistory } from './workload-preset-import-history.js';

export const WORKLOAD_PRESET_IMPORT_AUDIT_REVIEW_FORMAT='growup-workload-preset-import-audit-review-v1';

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function criteriaOf(criteria={}){const allowed=['accepted','resolved','conflict-skip','rejected'];return {strategy:criteria.strategy==='skip'||criteria.strategy==='rename'?criteria.strategy:'all',status:allowed.includes(criteria.status)?criteria.status:'all',conflictOnly:Boolean(criteria.conflictOnly)};}
function cleanDecision(item={}){return {status:['accepted','resolved','conflict-skip','rejected'].includes(item.status)?item.status:'rejected',sourceId:text(item.sourceId,80)||null,sourceName:text(item.sourceName,60)||null,resolvedId:text(item.resolvedId,80)||null,resolvedName:text(item.resolvedName,60)||null,nameConflict:Boolean(item.nameConflict),idConflict:Boolean(item.idConflict)};}
function cleanAudit(item={}){return {at:item.at,strategy:item.strategy==='rename'?'rename':'skip',decisions:array(item.decisions).map(cleanDecision),added:array(item.added).map((entry)=>({id:text(entry.id,80),name:text(entry.name,60)})).filter((entry)=>entry.id&&entry.name)};}
function decisionMatches(item,criteria){if(criteria.status!=='all'&&item.status!==criteria.status)return false;if(criteria.conflictOnly&&!item.nameConflict&&!item.idConflict)return false;return true;}

export function filterWorkloadPresetImportAuditReview(settings={},criteria={}){
  const normalized=criteriaOf(criteria),filtered=[];
  for(const raw of workloadPresetImportHistory(settings)){
    const audit=cleanAudit(raw);if(normalized.strategy!=='all'&&audit.strategy!==normalized.strategy)continue;
    const decisions=audit.decisions.filter((item)=>decisionMatches(item,normalized));
    const usesDecisionFilter=normalized.status!=='all'||normalized.conflictOnly;
    if(usesDecisionFilter&&!decisions.length)continue;
    filtered.push({...audit,decisions:usesDecisionFilter?decisions:audit.decisions});
  }
  return filtered;
}

export function workloadPresetImportAuditComparisonSummary(settings={},criteria={}){
  const audits=filterWorkloadPresetImportAuditReview(settings,criteria),decisions=audits.flatMap((item)=>item.decisions);
  return {auditCount:audits.length,decisionCount:decisions.length,renameAudits:audits.filter((item)=>item.strategy==='rename').length,skipAudits:audits.filter((item)=>item.strategy==='skip').length,conflicts:decisions.filter((item)=>item.nameConflict||item.idConflict).length,resolved:decisions.filter((item)=>item.status==='resolved').length,skipped:decisions.filter((item)=>item.status==='conflict-skip').length,rejected:decisions.filter((item)=>item.status==='rejected').length,accepted:decisions.filter((item)=>item.status==='accepted').length,sourceToResolvedChanges:decisions.filter((item)=>item.resolvedId&&(item.sourceId!==item.resolvedId||item.sourceName!==item.resolvedName)).length,addedPresets:audits.reduce((sum,item)=>sum+item.added.length,0)};
}

export function buildWorkloadPresetImportAuditReview(settings={},criteria={}){
  const normalized=criteriaOf(criteria),audits=filterWorkloadPresetImportAuditReview(settings,normalized),summary=workloadPresetImportAuditComparisonSummary(settings,normalized);
  return {format:WORKLOAD_PRESET_IMPORT_AUDIT_REVIEW_FORMAT,version:1,criteria:normalized,summary,audits,readOnly:true,actionsApplied:false};
}

export const WORKLOAD_PRESET_IMPORT_AUDIT_REVIEW_NOTE='Review chỉ lọc và tóm tắt audit metadata strategy/status/conflict/source→resolved của preset trung tính. Không đọc config/signature, không tạo score/rank/performance/health semantics, không sửa preset và luôn readOnly/actionsApplied=false.';
