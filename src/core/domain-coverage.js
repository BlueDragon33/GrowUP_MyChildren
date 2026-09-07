import { resolvedDevelopmentDomains } from './taxonomy.js';

const DATASETS = Object.freeze([
  { key:'learningGoals', label:'Học tập' },
  { key:'skills', label:'Kỹ năng' },
  { key:'portfolio', label:'Portfolio' }
]);

function array(value){return Array.isArray(value)?value:[];}

export function developmentDomainCoverage(state = {}, options = {}) {
  const childId=typeof options.childId==='string'?options.childId:'';
  const children=array(state.children).filter((child)=>!childId || child.id===childId);
  const taxonomy=resolvedDevelopmentDomains(state.settings?.developmentTaxonomy||{});
  const domainMap=new Map(taxonomy.map((domain)=>[domain.id,{id:domain.id,label:domain.label,enabled:domain.enabled,count:0}]));
  const datasets=DATASETS.map((dataset)=>({key:dataset.key,label:dataset.label,total:0,bound:0,unbound:0}));
  let total=0,bound=0;
  for(const child of children){
    for(const dataset of datasets){
      for(const record of array(child[dataset.key])){
        dataset.total+=1;
        total+=1;
        const id=typeof record?.developmentDomainId==='string'?record.developmentDomainId:'';
        if(id){
          dataset.bound+=1;bound+=1;
          if(!domainMap.has(id)) domainMap.set(id,{id,label:record.developmentDomainLabelSnapshot||id,enabled:false,count:0,legacyDefinition:true});
          domainMap.get(id).count+=1;
        }else dataset.unbound+=1;
      }
    }
  }
  return {
    scope:childId?'child':'family',
    childId:childId||null,
    total,
    bound,
    unbound:total-bound,
    datasets,
    domains:[...domainMap.values()].filter((domain)=>domain.count>0).sort((a,b)=>b.count-a.count || a.label.localeCompare(b.label,'vi')),
    note:'Coverage chỉ đếm bản ghi đã/chưa gắn taxonomy; không phải điểm, tỷ lệ năng lực hay xếp hạng trẻ.'
  };
}

export const DOMAIN_COVERAGE_DATASETS=DATASETS;
