import { normalizeSavedSearch, savedSearchViews } from './saved-search.js';
import { savedSearchCriteriaFingerprint } from './saved-search-organizer.js';

export const SAVED_SEARCH_PACKAGE_FORMAT='growup-saved-search-criteria-v1';
export const SAVED_SEARCH_PACKAGE_VERSION=1;

function array(value){return Array.isArray(value)?value:[];}
function safeView(view={}){const normalized=normalizeSavedSearch(view);return {...normalized,datasets:[...normalized.datasets]};}
function uniqueId(base,used,index){let id=String(base||`import-${index+1}`).slice(0,80)||`import-${index+1}`;if(!used.has(id))return id;let n=2;while(used.has(`${id}-${n}`))n+=1;return `${id}-${n}`.slice(0,80);}

export function buildSavedSearchCriteriaPackage(settings={}){
  return {
    format:SAVED_SEARCH_PACKAGE_FORMAT,
    version:SAVED_SEARCH_PACKAGE_VERSION,
    createdAt:new Date().toISOString(),
    views:savedSearchViews(settings).map(safeView)
  };
}

export function previewSavedSearchCriteriaImport(pkg={},settings={}){
  const valid=pkg?.format===SAVED_SEARCH_PACKAGE_FORMAT&&Number(pkg?.version)===SAVED_SEARCH_PACKAGE_VERSION&&Array.isArray(pkg?.views);
  if(!valid)return {valid:false,reason:'invalid-format',views:[],total:0,accepted:0,duplicates:0,strippedUnsafeDatasetEntries:0};
  const existing=savedSearchViews(settings),existingFingerprints=new Set(existing.map(savedSearchCriteriaFingerprint));
  const incomingFingerprints=new Set();
  let duplicates=0,strippedUnsafeDatasetEntries=0;
  const views=[];
  for(const raw of array(pkg.views).slice(0,100)){
    const before=array(raw?.datasets).length,normalized=safeView(raw),after=normalized.datasets.length;
    strippedUnsafeDatasetEntries+=Math.max(0,before-after);
    const fingerprint=savedSearchCriteriaFingerprint(normalized);
    if(existingFingerprints.has(fingerprint)||incomingFingerprints.has(fingerprint)){duplicates+=1;continue;}
    incomingFingerprints.add(fingerprint);views.push(normalized);
  }
  return {valid:true,reason:null,views,total:array(pkg.views).length,accepted:views.length,duplicates,strippedUnsafeDatasetEntries};
}

export function applySavedSearchCriteriaImport(settings={},pkg={}){
  const preview=previewSavedSearchCriteriaImport(pkg,settings);
  if(!preview.valid)return {settings,changed:false,added:0,skippedDuplicates:0,reason:preview.reason};
  const current=savedSearchViews(settings),used=new Set(current.map((view)=>view.id));
  const capacity=Math.max(0,20-current.length),incoming=preview.views.slice(0,capacity).map((view,index)=>{
    const id=uniqueId(view.id,used,index);used.add(id);return {...view,id};
  });
  return {
    settings:{...settings,savedSafeSearchViews:[...current,...incoming]},
    changed:incoming.length>0,
    added:incoming.length,
    skippedDuplicates:preview.duplicates,
    reason:incoming.length?'imported':'nothing-to-import'
  };
}

export const SAVED_SEARCH_PACKAGE_NOTE='Gói portable chỉ chứa criteria đã chuẩn hóa và metadata tổ chức của Saved Search. Import luôn preview trước, loại dataset không thuộc safe-search allowlist và bỏ criteria trùng; không chứa hay khôi phục result/snippet/Health/Nutrition payload.';
