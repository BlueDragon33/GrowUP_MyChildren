import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { customWorkloadPresets, buildCustomWorkloadPresetPackage, validateCustomWorkloadPreset, WORKLOAD_PRESET_LIBRARY_FORMAT } from './workload-preset-library.js';

export const WORKLOAD_PRESET_INTEGRITY_FORMAT='growup-workload-preset-library-integrity-v1';
const MAX_PRESETS=20;

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function payloadWithoutManifest(pkg={}){const copy=structuredClone(pkg);delete copy.manifest;return copy;}
function lower(value){return String(value||'').toLocaleLowerCase('vi');}
function uniqueName(base,used){let name=text(base,60)||'Preset nhập';if(!used.has(lower(name)))return name;let n=2;while(used.has(lower(`${name} (${n})`)))n+=1;return `${name} (${n})`.slice(0,60);}
function uniqueId(base,used){let id=text(base,80)||'preset-import';if(!used.has(id))return id;let n=2;while(used.has(`${id}-${n}`.slice(0,80)))n+=1;return `${id}-${n}`.slice(0,80);}

export function withWorkloadPresetPackageManifest(pkg={}){
  const payload=payloadWithoutManifest(pkg),checksum=sha256Hex(canonicalStringify(payload));
  return {...payload,manifest:{format:WORKLOAD_PRESET_INTEGRITY_FORMAT,algorithm:'SHA-256',scope:'canonical-package-without-manifest',checksum,presetCount:array(payload.presets).length}};
}

export function buildIntegrityWorkloadPresetPackage(settings={}){
  return withWorkloadPresetPackageManifest(buildCustomWorkloadPresetPackage(settings));
}

export function verifyWorkloadPresetPackageIntegrity(pkg={}){
  const expected=text(pkg?.manifest?.checksum,128),actual=sha256Hex(canonicalStringify(payloadWithoutManifest(pkg)));
  const payloadValid=pkg?.format===WORKLOAD_PRESET_LIBRARY_FORMAT&&Number(pkg?.version)===1&&Array.isArray(pkg?.presets);
  return {valid:Boolean(expected)&&payloadValid&&pkg?.manifest?.format===WORKLOAD_PRESET_INTEGRITY_FORMAT&&pkg?.manifest?.algorithm==='SHA-256'&&expected===actual,format:pkg?.manifest?.format||null,algorithm:'SHA-256',expected,actual};
}

export function previewIntegrityWorkloadPresetImport(pkg={},settings={},options={}){
  const verification=verifyWorkloadPresetPackageIntegrity(pkg);if(!verification.valid)return {valid:false,reason:'invalid-integrity',items:[],accepted:0,rejected:0,conflicts:0,total:array(pkg?.presets).length};
  const strategy=options.conflictStrategy==='rename'?'rename':'skip',existing=customWorkloadPresets(settings),usedIds=new Set(existing.map((item)=>item.id)),usedNames=new Set(existing.map((item)=>lower(item.name))),items=[];let rejected=0,conflicts=0;
  for(const raw of array(pkg.presets).slice(0,100)){
    const checked=validateCustomWorkloadPreset(raw);if(!checked.valid){rejected+=1;items.push({status:'rejected',reason:checked.reasons[0]||'invalid-preset'});continue;}
    const rawId=text(raw.id,80)||'preset-import',nameConflict=usedNames.has(lower(checked.name)),idConflict=usedIds.has(rawId),hasConflict=nameConflict||idConflict;
    if(hasConflict)conflicts+=1;
    if(hasConflict&&strategy==='skip'){items.push({status:'conflict-skip',id:rawId,name:checked.name,nameConflict,idConflict});continue;}
    const id=idConflict?uniqueId(rawId,usedIds):rawId,name=nameConflict?uniqueName(checked.name,usedNames):checked.name;
    usedIds.add(id);usedNames.add(lower(name));items.push({status:hasConflict?'resolved':'accepted',id,name,config:checked.config,nameConflict,idConflict});
  }
  const acceptedItems=items.filter((item)=>item.status==='accepted'||item.status==='resolved').slice(0,Math.max(0,MAX_PRESETS-existing.length));
  return {valid:true,reason:null,strategy,items,accepted:acceptedItems.length,acceptedItems,rejected,conflicts,total:array(pkg.presets).length};
}

export function applyIntegrityWorkloadPresetImport(settings={},pkg={},options={}){
  const preview=previewIntegrityWorkloadPresetImport(pkg,settings,options);if(!preview.valid)return {settings,changed:false,added:0,reason:preview.reason};
  const current=customWorkloadPresets(settings),incoming=preview.acceptedItems.map((item)=>({id:item.id,name:item.name,config:item.config}));
  return {settings:{...settings,customWorkloadPresets:[...current,...incoming].slice(0,MAX_PRESETS)},changed:incoming.length>0,added:incoming.length,rejected:preview.rejected,conflicts:preview.conflicts,strategy:preview.strategy,reason:incoming.length?'imported':'nothing-to-import'};
}

export const WORKLOAD_PRESET_INTEGRITY_NOTE='Preset library package phải qua SHA-256 trước preview/import. Xung đột tên/ID được hiển thị trước và chỉ skip hoặc đổi tên/ID theo lựa chọn người dùng; validation trung tính hiện có vẫn bắt buộc, không thêm childId, score/rank/performance/health semantics.';
