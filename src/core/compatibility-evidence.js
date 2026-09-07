export const COMPATIBILITY_REQUIRED_FLOWS=Object.freeze(['overview','learning','skills','portfolio','mobile','axe']);

function array(v){return Array.isArray(v)?v:[];}
function text(v,max=100){return typeof v==='string'?v.trim().slice(0,max):'';}

export function normalizeCompatibilityEvidence(records=[]){
  return array(records).map((record)=>({
    module:text(record?.module,80),
    flow:COMPATIBILITY_REQUIRED_FLOWS.includes(record?.flow)?record.flow:'',
    observed:Boolean(record?.observed),
    active:Boolean(record?.active)
  })).filter((record)=>record.module&&record.flow&&record.observed);
}

export function compatibilityEvidenceMatrix(records=[]){
  const normalized=normalizeCompatibilityEvidence(records);
  const modules=[...new Set(normalized.map((record)=>record.module))].sort();
  return modules.map((module)=>{
    const evidence=Object.fromEntries(COMPATIBILITY_REQUIRED_FLOWS.map((flow)=>{
      const matches=normalized.filter((record)=>record.module===module&&record.flow===flow);
      return [flow,{observed:matches.length>0,active:matches.some((record)=>record.active)}];
    }));
    const complete=COMPATIBILITY_REQUIRED_FLOWS.every((flow)=>evidence[flow].observed);
    const activeAnywhere=COMPATIBILITY_REQUIRED_FLOWS.some((flow)=>evidence[flow].active);
    return {module,evidence,complete,activeAnywhere,retirementEligible:complete&&!activeAnywhere};
  });
}

export function retirementEligibleModules(records=[]){
  return compatibilityEvidenceMatrix(records).filter((row)=>row.retirementEligible).map((row)=>row.module);
}

export function missingCompatibilityFlows(records=[],module=''){
  const row=compatibilityEvidenceMatrix(records).find((item)=>item.module===module);
  if(!row)return [...COMPATIBILITY_REQUIRED_FLOWS];
  return COMPATIBILITY_REQUIRED_FLOWS.filter((flow)=>!row.evidence[flow].observed);
}

export const COMPATIBILITY_EVIDENCE_NOTE='Retire chỉ được phép khi cùng module đã được quan sát ở đủ Overview, Learning, Skills, Portfolio, mobile và Axe, đồng thời không active ở bất kỳ flow nào. Một snapshot hoặc một viewport không đủ bằng chứng.';
