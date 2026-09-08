import { normalizeWorkloadBandSettings, setWorkloadBandSettings } from './workload-band-settings.js';

export const WORKLOAD_PRESET_LIBRARY_FORMAT='growup-workload-preset-library-v1';
const MAX_PRESETS=20;
const FORBIDDEN_TERMS=/(^|\s)(score|rank|rating|percentile|điểm|xếp\s*hạng|thành\s*tích|performance|health|sức\s*khỏe)(\s|$)/iu;
const FORBIDDEN_KEYS=new Set(['childId','childIds','score','rank','rating','percentile','health','healthRecords','nutritionLogs']);

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function containsForbiddenKey(value){if(!value||typeof value!=='object')return false;return Object.keys(value).some((key)=>FORBIDDEN_KEYS.has(key));}
function neutral(value){const t=text(value,80);return Boolean(t)&&!FORBIDDEN_TERMS.test(t);}

export function validateCustomWorkloadPreset(input={}){
  const name=text(input.name,60),labels=input?.config?.labels||{};
  const reasons=[];
  if(!neutral(name))reasons.push('unsafe-name');
  if(containsForbiddenKey(input)||containsForbiddenKey(input.config))reasons.push('forbidden-key');
  for(const key of ['none','light','moderate','extended'])if(labels[key]!=null&&!neutral(labels[key]))reasons.push(`unsafe-label-${key}`);
  const first=Number(input?.config?.firstMax),second=Number(input?.config?.secondMax);
  if(!Number.isFinite(first)||!Number.isFinite(second)||first<1||second<=first||second>1440)reasons.push('invalid-thresholds');
  const config=normalizeWorkloadBandSettings(input.config||{});
  return {valid:reasons.length===0,reasons,name,config};
}

export function customWorkloadPresets(settings={}){
  return array(settings.customWorkloadPresets).slice(0,MAX_PRESETS).map((item)=>{
    const checked=validateCustomWorkloadPreset(item);
    return checked.valid?{id:text(item.id,80),name:checked.name,config:checked.config}:null;
  }).filter((item)=>item?.id&&item.name);
}

export function saveCustomWorkloadPreset(settings={},preset={}){
  const checked=validateCustomWorkloadPreset(preset);
  if(!checked.valid)return {settings,changed:false,reason:checked.reasons[0]||'invalid-preset'};
  const id=text(preset.id,80)||`preset-${Date.now()}`;
  const current=customWorkloadPresets(settings).filter((item)=>item.id!==id);
  const next={id,name:checked.name,config:checked.config};
  return {settings:{...settings,customWorkloadPresets:[next,...current].slice(0,MAX_PRESETS)},changed:true,preset:next};
}

export function removeCustomWorkloadPreset(settings={},id=''){
  const current=customWorkloadPresets(settings),next=current.filter((item)=>item.id!==id);
  return {settings:{...settings,customWorkloadPresets:next},changed:next.length!==current.length};
}

export function applyCustomWorkloadPreset(settings={},id=''){
  const preset=customWorkloadPresets(settings).find((item)=>item.id===id);
  if(!preset)return {settings,changed:false,reason:'preset-not-found'};
  return {settings:setWorkloadBandSettings(settings,preset.config),changed:true,preset};
}

export function buildCustomWorkloadPresetPackage(settings={}){
  return {format:WORKLOAD_PRESET_LIBRARY_FORMAT,version:1,createdAt:new Date().toISOString(),presets:customWorkloadPresets(settings)};
}

export function previewCustomWorkloadPresetImport(pkg={},settings={}){
  if(pkg?.format!==WORKLOAD_PRESET_LIBRARY_FORMAT||Number(pkg?.version)!==1||!Array.isArray(pkg?.presets))return {valid:false,reason:'invalid-format',accepted:[],rejected:0,duplicates:0,total:0};
  const existing=customWorkloadPresets(settings),names=new Set(existing.map((item)=>item.name.toLocaleLowerCase('vi'))),accepted=[],seen=new Set();let rejected=0,duplicates=0;
  for(const raw of array(pkg.presets).slice(0,100)){
    const checked=validateCustomWorkloadPreset(raw);if(!checked.valid){rejected+=1;continue;}
    const key=checked.name.toLocaleLowerCase('vi');if(names.has(key)||seen.has(key)){duplicates+=1;continue;}seen.add(key);accepted.push({id:text(raw.id,80)||`import-${accepted.length+1}`,name:checked.name,config:checked.config});
  }
  return {valid:true,reason:null,accepted,total:array(pkg.presets).length,rejected,duplicates};
}

export function applyCustomWorkloadPresetImport(settings={},pkg={}){
  const preview=previewCustomWorkloadPresetImport(pkg,settings);if(!preview.valid)return {settings,changed:false,added:0,reason:preview.reason};
  const current=customWorkloadPresets(settings),capacity=Math.max(0,MAX_PRESETS-current.length),used=new Set(current.map((item)=>item.id));
  const incoming=preview.accepted.slice(0,capacity).map((item,index)=>{let id=item.id||`import-${index+1}`;let n=2;while(used.has(id))id=`${item.id||'import'}-${n++}`.slice(0,80);used.add(id);return {...item,id};});
  return {settings:{...settings,customWorkloadPresets:[...current,...incoming]},changed:incoming.length>0,added:incoming.length,rejected:preview.rejected,duplicates:preview.duplicates,reason:incoming.length?'imported':'nothing-to-import'};
}

export const WORKLOAD_PRESET_LIBRARY_NOTE='Thư viện preset tùy chỉnh chỉ lưu ngưỡng phút và nhãn trung tính cục bộ. Tên/nhãn có nghĩa score/rank/rating/percentile/thành tích/sức khỏe và các khóa gắn childId/Health/Nutrition bị từ chối; import luôn preview trước và không tự áp dụng preset.';
