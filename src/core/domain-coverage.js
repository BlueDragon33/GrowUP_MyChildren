import { resolvedDevelopmentDomains } from './taxonomy.js';

const DATASETS = Object.freeze([
  { key:'learningGoals', label:'Học tập' },
  { key:'skills', label:'Kỹ năng' },
  { key:'portfolio', label:'Portfolio' }
]);

function list(value){ return Array.isArray(value) ? value : []; }

export function developmentDomainCoverage(state = {}) {
  const domains = resolvedDevelopmentDomains(state.settings?.developmentTaxonomy || {});
  const domainLabels = new Map(domains.map((domain)=>[domain.id,domain.label]));
  const byDataset = DATASETS.map((dataset)=>{
    let total=0,bound=0;
    const domainCounts={};
    for(const child of list(state.children)){
      for(const record of list(child[dataset.key])){
        total+=1;
        const domainId=typeof record?.developmentDomainId==='string' ? record.developmentDomainId : '';
        if(domainId){ bound+=1; domainCounts[domainId]=(domainCounts[domainId]||0)+1; }
      }
    }
    return { dataset:dataset.key, label:dataset.label, total, bound, unbound:Math.max(0,total-bound), domainCounts };
  });
  const total=byDataset.reduce((sum,item)=>sum+item.total,0);
  const bound=byDataset.reduce((sum,item)=>sum+item.bound,0);
  const domainTotals={};
  for(const dataset of byDataset){
    for(const [domainId,count] of Object.entries(dataset.domainCounts)) domainTotals[domainId]=(domainTotals[domainId]||0)+count;
  }
  return {
    total,
    bound,
    unbound:Math.max(0,total-bound),
    byDataset,
    byDomain:Object.entries(domainTotals).map(([domainId,count])=>({domainId,label:domainLabels.get(domainId)||domainId,count})).sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'vi'))
  };
}

export const DOMAIN_COVERAGE_NOTE='Coverage chỉ đếm bản ghi đã/ chưa gắn taxonomy để hỗ trợ dọn dữ liệu; đây không phải điểm phát triển, tỷ lệ thành tích hay xếp hạng trẻ.';
