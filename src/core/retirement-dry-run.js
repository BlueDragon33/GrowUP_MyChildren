import { firstLegacyRetirementReview, staticLegacyDependencyGraph } from './retirement-review.js';
import { legacyModuleDefinitions } from './runtime-compatibility.js';

export const RETIREMENT_DRY_RUN_FORMAT='growup-legacy-retirement-dry-run-v1';

export function buildLegacyRetirementDryRun({evidenceRecords=[],runtimeEntrySource='',definitions=legacyModuleDefinitions()}={}){
  const review=firstLegacyRetirementReview({evidenceRecords,runtimeEntrySource,definitions});
  const graph=staticLegacyDependencyGraph(runtimeEntrySource,definitions);
  const rows=review.rows.map((row)=>({
    module:row.module,
    evidenceComplete:Boolean(row.evidenceComplete),
    activeAnywhere:Boolean(row.activeAnywhere),
    runtimeReferenced:Boolean(row.runtimeReferenced),
    decision:row.decision
  }));
  const candidates=rows.filter((row)=>row.decision==='candidate').map((row)=>row.module);
  return {
    format:RETIREMENT_DRY_RUN_FORMAT,
    generatedAt:new Date().toISOString(),
    candidateCount:candidates.length,
    candidates,
    rows,
    dependencyGraph:graph.map((row)=>({module:row.module,referenced:Boolean(row.referenced),selector:row.selector})),
    proposedDiff:candidates.map((module)=>({module,action:'remove-in-separate-commit'})),
    removalsApplied:false,
    safeToRemoveAutomatically:false,
    requiresSeparateRemovalCommit:true,
    requiredGate:'verify + Chromium E2E + Axe on exact removal head'
  };
}

export function retirementDryRunSummary(pkg={}){
  return {format:pkg.format||null,candidateCount:Number(pkg.candidateCount)||0,removalsApplied:Boolean(pkg.removalsApplied),requiresSeparateRemovalCommit:Boolean(pkg.requiresSeparateRemovalCommit)};
}

export const RETIREMENT_DRY_RUN_NOTE='Dry-run chỉ tạo báo cáo evidence/dependency và proposed diff metadata. Không chỉnh runtime-entry, không xóa file/module và không được dùng làm bằng chứng thay cho một commit removal riêng đã PASS full verify + Chromium/Axe trên exact head.';
