import { SAFE_SEARCH_DATASETS } from './local-search.js';

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=120){return typeof value==='string'?value.trim().slice(0,max):'';}
function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''));}

export function normalizeSavedSearch(view={}){
  const datasets=array(view.datasets).filter((name)=>SAFE_SEARCH_DATASETS.includes(name));
  return {
    id:text(view.id,80)||`search-${Date.now()}`,
    name:text(view.name,80)||'Bộ lọc đã lưu',
    query:text(view.query,120),
    childId:text(view.childId,100),
    datasets:[...new Set(datasets)],
    domainId:text(view.domainId,80),
    fromDate:validDate(view.fromDate)?view.fromDate:'',
    toDate:validDate(view.toDate)?view.toDate:'',
    limit:Math.min(100,Math.max(1,Number(view.limit)||20))
  };
}

export function savedSearchViews(settings={}){
  return array(settings.savedSafeSearchViews).map(normalizeSavedSearch).slice(0,20);
}

export function saveSearchView(settings={},view={}){
  const normalized=normalizeSavedSearch(view);
  const current=savedSearchViews(settings).filter((item)=>item.id!==normalized.id);
  return {...settings,savedSafeSearchViews:[normalized,...current].slice(0,20)};
}

export function removeSearchView(settings={},id=''){
  return {...settings,savedSafeSearchViews:savedSearchViews(settings).filter((item)=>item.id!==id)};
}

export const SAVED_SEARCH_NOTE='Chỉ lưu điều kiện tìm kiếm đã chuẩn hóa; không lưu danh sách kết quả, snippet hay nội dung nhạy cảm.';
