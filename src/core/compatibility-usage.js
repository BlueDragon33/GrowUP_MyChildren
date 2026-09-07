const STORAGE_KEY='growup_compat_usage_v11';
const ALLOWED=Object.freeze(['v4','v5','v6','v7','v8','v9-runtime','v9-compat','v10-runtime','v11-runtime']);

function safeStore(environment=globalThis){try{return environment?.sessionStorage||null;}catch{return null;}}
function read(environment=globalThis){const store=safeStore(environment);if(!store)return {};try{const parsed=JSON.parse(store.getItem(STORAGE_KEY)||'{}');return parsed&&typeof parsed==='object'?parsed:{};}catch{return {};}}
function write(value,environment=globalThis){const store=safeStore(environment);if(!store)return;try{store.setItem(STORAGE_KEY,JSON.stringify(value));}catch{}}

export function markCompatibilityLayer(layerId='',environment=globalThis,now=new Date()){
  if(!ALLOWED.includes(layerId))return false;
  const data=read(environment),previous=data[layerId]||{};
  const at=now instanceof Date&&!Number.isNaN(now.getTime())?now.toISOString():new Date().toISOString();
  data[layerId]={count:Math.min(1000000,Math.max(0,Number(previous.count)||0)+1),lastSeenAt:at};
  write(data,environment);
  return true;
}

export function compatibilityUsage(environment=globalThis){
  const data=read(environment);
  return ALLOWED.filter((id)=>data[id]).map((id)=>({id,count:Math.max(0,Number(data[id].count)||0),lastSeenAt:typeof data[id].lastSeenAt==='string'?data[id].lastSeenAt:''}));
}

export function compatibilityRetirementPlan(environment=globalThis){
  const observed=new Set(compatibilityUsage(environment).map((item)=>item.id));
  return ALLOWED.filter((id)=>id!=='v11-runtime').map((id)=>({id,status:observed.has(id)?'active-observed':'unobserved',removable:false}));
}

export const COMPATIBILITY_LAYERS=ALLOWED;
export const COMPATIBILITY_USAGE_NOTE='Instrumentation chỉ lưu ID module, số lần nạp và thời điểm trong sessionStorage; không chứa dữ liệu trẻ. “Unobserved” chưa đủ bằng chứng để xóa module. v1.1 không tự loại compatibility layer nào.';
