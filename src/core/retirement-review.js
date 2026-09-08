import { compatibilityEvidenceMatrix } from './compatibility-evidence.js';
import { legacyModuleDefinitions } from './runtime-compatibility.js';

function moduleImportPattern(module=''){const escaped=module.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');return new RegExp(`(?:from\\s*['\"]|import\\s*['\"])(?:\\./)?${escaped}['\"]`);}

export function staticLegacyDependencyGraph(runtimeEntrySource='',definitions=legacyModuleDefinitions()){
  const source=String(runtimeEntrySource||'');
  return definitions.map((entry)=>({module:entry.module,referenced:moduleImportPattern(entry.module).test(source),selector:entry.selector}));
}

export function firstLegacyRetirementReview({evidenceRecords=[],runtimeEntrySource='',definitions=legacyModuleDefinitions()}={}){
  const matrix=compatibilityEvidenceMatrix(evidenceRecords);
  const graph=staticLegacyDependencyGraph(runtimeEntrySource,definitions);
  const rows=definitions.map((entry)=>{
    const evidence=matrix.find((row)=>row.module===entry.module)||{complete:false,activeAnywhere:false,retirementEligible:false};
    const dependency=graph.find((row)=>row.module===entry.module)||{referenced:false};
    const eligible=Boolean(evidence.retirementEligible)&&!dependency.referenced;
    return {module:entry.module,evidenceComplete:Boolean(evidence.complete),activeAnywhere:Boolean(evidence.activeAnywhere),runtimeReferenced:Boolean(dependency.referenced),eligible,decision:eligible?'candidate':'retain'};
  });
  return {rows,candidates:rows.filter((row)=>row.eligible).map((row)=>row.module),removed:[],safeToRemoveAutomatically:false};
}

export const RETIREMENT_REVIEW_NOTE='Review v1.3 chỉ đề xuất candidate khi đủ 6 flow, inactive ở mọi flow và runtime dependency graph không còn import. Không module nào bị xóa tự động; removal nếu có phải là commit riêng và chạy lại full verify + Chromium/Axe.';
