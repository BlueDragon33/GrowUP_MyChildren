import { defaultWorkloadBandSettings, normalizeWorkloadBandSettings, setWorkloadBandSettings } from './workload-band-settings.js';

const PRESETS=Object.freeze([
  Object.freeze({id:'compact',name:'Gọn',config:Object.freeze({firstMax:30,secondMax:90,labels:Object.freeze({none:'Không có kế hoạch',light:'Đến 30 phút',moderate:'31–90 phút',extended:'Trên 90 phút'})})}),
  Object.freeze({id:'standard',name:'Tiêu chuẩn',config:Object.freeze({firstMax:60,secondMax:180,labels:Object.freeze({none:'Không có kế hoạch',light:'Đến 60 phút',moderate:'61–180 phút',extended:'Trên 180 phút'})})}),
  Object.freeze({id:'wide',name:'Mở rộng',config:Object.freeze({firstMax:90,secondMax:240,labels:Object.freeze({none:'Không có kế hoạch',light:'Đến 90 phút',moderate:'91–240 phút',extended:'Trên 240 phút'})})})
]);

export function workloadDisplayPresets(){return PRESETS.map((preset)=>({id:preset.id,name:preset.name,config:structuredClone(preset.config)}));}

export function applyWorkloadDisplayPreset(settings={},presetId='standard'){
  const preset=PRESETS.find((item)=>item.id===presetId);
  if(!preset)return {settings,changed:false,presetId:null};
  return {settings:setWorkloadBandSettings(settings,preset.config),changed:true,presetId:preset.id};
}

export function resetWorkloadDisplayPreset(settings={}){
  return {settings:setWorkloadBandSettings(settings,defaultWorkloadBandSettings()),changed:true,presetId:'standard'};
}

export function matchingWorkloadPresetId(settings={}){
  const current=normalizeWorkloadBandSettings(settings.workloadDisplayBands||{});
  return PRESETS.find((preset)=>JSON.stringify(normalizeWorkloadBandSettings(preset.config))===JSON.stringify(current))?.id||null;
}

export const WORKLOAD_PRESETS_NOTE='Preset chỉ là cấu hình cục bộ, trung tính và có thể hoàn tác cho các dải tổng phút kế hoạch. Không preset nào phụ thuộc hồ sơ trẻ, thành tích, sức khỏe hoặc cơ chế xếp hạng/đánh giá.';
