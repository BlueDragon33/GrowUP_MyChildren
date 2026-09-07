import { SAFE_DATASETS } from './export.js';

export const SAFE_EXPORT_FIELDS=Object.freeze({
  learningGoals:['id','title','subject','dueDate','completed','createdAt','developmentDomainId','developmentDomainLabelSnapshot','developmentTaxonomyVersion'],
  skills:['id','name','level','date','developmentDomainId','developmentDomainLabelSnapshot','developmentTaxonomyVersion'],
  portfolio:['id','title','type','date','developmentDomainId','developmentDomainLabelSnapshot','developmentTaxonomyVersion'],
  attachments:['id','name','type','url','createdAt'],
  roadmap:['id','age','area','goal','status','targetDate'],
  reminders:['id','title','date','type','completed','source']
});

function array(v){return Array.isArray(v)?v:[];}
function text(v,max=120){return typeof v==='string'?v.trim().slice(0,max):'';}
function pick(record,fields){return Object.fromEntries(fields.filter((key)=>record?.[key]!==undefined).map((key)=>[key,record[key]]));}

export function normalizeExportWizardSelection(state={},selection={}){
  const validChildren=new Set(array(state.children).map((child)=>child.id));
  const childIds=[...new Set(array(selection.childIds).filter((id)=>validChildren.has(id)))];
  const datasets=[...new Set(array(selection.datasets).filter((name)=>SAFE_DATASETS.includes(name)&&SAFE_EXPORT_FIELDS[name]))];
  return {childIds,datasets};
}

export function previewSafeExport(state={},selection={}){
  const normalized=normalizeExportWizardSelection(state,selection);
  const children=array(state.children).filter((child)=>normalized.childIds.includes(child.id));
  return {
    format:'growup-safe-export-preview-v1',
    childCount:children.length,
    datasetCount:normalized.datasets.length,
    healthIncluded:false,
    nutritionIncluded:false,
    children:children.map((child)=>({id:child.id,name:text(child.name,100)})),
    datasets:normalized.datasets.map((dataset)=>({
      dataset,
      fields:[...SAFE_EXPORT_FIELDS[dataset]],
      records:children.reduce((sum,child)=>sum+array(child[dataset]).length,0)
    })),
    totalRecords:normalized.datasets.reduce((sum,dataset)=>sum+children.reduce((n,child)=>n+array(child[dataset]).length,0),0)
  };
}

export function buildSafeExportPackage(state={},selection={}){
  const preview=previewSafeExport(state,selection);
  if(!preview.childCount) throw new Error('Chọn ít nhất một hồ sơ trẻ để xuất.');
  if(!preview.datasetCount) throw new Error('Chọn ít nhất một nhóm dữ liệu an toàn để xuất.');
  const children=array(state.children).filter((child)=>preview.children.some((item)=>item.id===child.id));
  return {
    format:'growup-safe-export-v2',
    generatedAt:new Date().toISOString(),
    healthIncluded:false,
    nutritionIncluded:false,
    datasets:preview.datasets.map((item)=>item.dataset),
    children:children.map((child)=>({
      id:child.id,
      name:text(child.name,100),
      ...Object.fromEntries(preview.datasets.map(({dataset,fields})=>[dataset,array(child[dataset]).map((record)=>pick(record,fields))]))
    }))
  };
}

export const EXPORT_WIZARD_NOTE='Preview hiển thị đúng hồ sơ, dataset, số bản ghi và allowlist trường trước khi tải. Health/Nutrition và free-text ngoài allowlist không được đưa vào gói safe export.';
