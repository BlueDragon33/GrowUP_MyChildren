import { SAFE_SEARCH_DATASETS } from './local-search.js';

function text(value,max=120){return typeof value==='string'?value.trim().slice(0,max):'';}
function list(value){return Array.isArray(value)?value:[];}
function validDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return '';const d=new Date(`${value}T00:00:00`);return Number.isNaN(d.getTime())?'':String(value);}
function makeId(){return `search-view-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;}

function sanitizeView(view={},now=new Date()){
  const datasets=[...new Set(list(view.datasets).filter((name)=>SAFE_SEARCH_DATASETS.includes(name)))];
  return {
    id:text(view.id,100)||makeId(),
    label:text(view.label,80)||'Bộ lọc đã lưu',
    datasets,
    childId:text(view.childId,100),
    domainId:text(view.domainId,80),
    fromDate:validDate(view.fromDate),
    toDate:validDate(view.toDate),
    limit:Math.min(100,Math.max(1,Number(view.limit)||20)),
    createdAt:(()=>{const d=new Date(view.createdAt||now);return Number.isNaN(d.getTime())?now.toISOString():d.toISOString();})()
  };
}

export function savedSearchViews(settings={},limit=12){
  const max=Math.min(30,Math.max(1,Number(limit)||12));
  return list(settings.savedSafeSearchViews).map((view)=>sanitizeView(view)).slice(0,max);
}

export function saveSearchView(settings={},view={},options={}){
  const limit=Math.min(30,Math.max(1,Number(options.limit)||12));
  const now=options.now instanceof Date?options.now:new Date();
  const next=sanitizeView(view,now);
  const previous=list(settings.savedSafeSearchViews).map((item)=>sanitizeView(item,now)).filter((item)=>item.id!==next.id);
  return {...settings,savedSafeSearchViews:[next,...previous].slice(0,limit)};
}

export function removeSavedSearchView(settings={},id=''){
  const target=text(id,100);
  return {...settings,savedSafeSearchViews:list(settings.savedSafeSearchViews).filter((view)=>text(view?.id,100)!==target)};
}

export function searchViewFilters(view={}){
  const safe=sanitizeView(view);
  return {datasets:safe.datasets,childId:safe.childId,domainId:safe.domainId,fromDate:safe.fromDate,toDate:safe.toDate,limit:safe.limit};
}

export const SAVED_SEARCH_NOTE='Bộ lọc đã lưu chỉ giữ cấu hình phạm vi tìm kiếm an toàn. Không lưu từ khóa tìm kiếm, danh sách kết quả, Health/Nutrition hay nội dung ghi chú.';
