import { normalizeSavedSearch, savedSearchViews } from './saved-search.js';

function criteria(view={}){
  const normalized=normalizeSavedSearch(view);
  return {query:normalized.query,childId:normalized.childId,datasets:[...normalized.datasets].sort(),domainId:normalized.domainId,fromDate:normalized.fromDate,toDate:normalized.toDate,limit:normalized.limit};
}

export function savedSearchCriteriaFingerprint(view={}){return JSON.stringify(criteria(view));}

export function duplicateSavedSearchIds(settings={}){
  const groups=new Map();
  for(const view of savedSearchViews(settings)){
    const key=savedSearchCriteriaFingerprint(view);
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(view.id);
  }
  return [...groups.values()].filter((ids)=>ids.length>1);
}

export function findDuplicateSavedSearch(settings={},candidate={}){
  const normalized=normalizeSavedSearch(candidate),fingerprint=savedSearchCriteriaFingerprint(normalized);
  return savedSearchViews(settings).find((view)=>view.id!==normalized.id&&savedSearchCriteriaFingerprint(view)===fingerprint)||null;
}

export function pinSavedSearch(settings={},id='',pinned=true){
  return {...settings,savedSafeSearchViews:savedSearchViews(settings).map((view)=>view.id===id?{...view,pinned:Boolean(pinned)}:view)};
}

export function moveSavedSearchToFolder(settings={},id='',folder=''){
  const safeFolder=typeof folder==='string'?folder.trim().slice(0,60):'';
  return {...settings,savedSafeSearchViews:savedSearchViews(settings).map((view)=>view.id===id?{...view,folder:safeFolder}:view)};
}

export function savedSearchFolders(settings={}){
  return [...new Set(savedSearchViews(settings).map((view)=>view.folder).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
}

export function organizedSavedSearchViews(settings={}){
  return [...savedSearchViews(settings)].sort((a,b)=>Number(b.pinned)-Number(a.pinned)||a.folder.localeCompare(b.folder,'vi')||a.name.localeCompare(b.name,'vi'));
}

export const SAVED_SEARCH_ORGANIZER_NOTE='Folder và pinned chỉ là metadata tổ chức. Duplicate detection so sánh criteria đã chuẩn hóa, không đọc hoặc lưu kết quả tìm kiếm, snippet, Health hay Nutrition.';
