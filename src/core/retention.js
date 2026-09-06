export const RETENTION_DATASETS = Object.freeze(['completedReminders','physicalActivities']);

function array(value) { return Array.isArray(value) ? value : []; }
function validYears(value) { const n=Number(value); return Number.isFinite(n) && n>=1 && n<=20 ? Math.round(n) : 5; }
function cutoffDate(years,onDate=new Date()) { const d=new Date(onDate); d.setFullYear(d.getFullYear()-years); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function ids(items=[]) { return new Set(array(items).map((item)=>item?.id).filter(Boolean)); }

export function normalizeRetentionPolicy(input = {}) {
  const datasets = array(input.datasets).filter((name)=>RETENTION_DATASETS.includes(name));
  return {
    mode: 'manual',
    keepYears: validYears(input.keepYears),
    datasets: [...new Set(datasets)],
    requireArchiveBeforeRemoval: true,
    updatedAt: input.updatedAt || null
  };
}

export function retentionPreview(child = {}, policyInput = {}, onDate = new Date()) {
  const policy = normalizeRetentionPolicy(policyInput);
  const cutoff = cutoffDate(policy.keepYears,onDate);
  const candidates = {};
  if (policy.datasets.includes('completedReminders')) {
    candidates.completedReminders = array(child.reminders).filter((item)=>item?.completed && item?.date && item.date < cutoff);
  }
  if (policy.datasets.includes('physicalActivities')) {
    candidates.physicalActivities = array(child.physicalActivities).filter((item)=>item?.date && item.date < cutoff);
  }
  const total = Object.values(candidates).reduce((sum,items)=>sum+items.length,0);
  return { policy, cutoff, candidates, total };
}

export function applyRetentionRemoval(child = {}, preview = {}) {
  const next = structuredClone(child);
  const removed = [];
  if (preview.candidates?.completedReminders) {
    const candidateIds = ids(preview.candidates.completedReminders);
    next.reminders = array(next.reminders).filter((item)=>{
      if (candidateIds.has(item?.id)) { removed.push({dataset:'completedReminders',item}); return false; }
      return true;
    });
  }
  if (preview.candidates?.physicalActivities) {
    const candidateIds = ids(preview.candidates.physicalActivities);
    next.physicalActivities = array(next.physicalActivities).filter((item)=>{
      if (candidateIds.has(item?.id)) { removed.push({dataset:'physicalActivities',item}); return false; }
      return true;
    });
  }
  return { child: next, removed, changed: removed.length>0 };
}
