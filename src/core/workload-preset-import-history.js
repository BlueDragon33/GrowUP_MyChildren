import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { customWorkloadPresets } from './workload-preset-library.js';
import { previewIntegrityWorkloadPresetImport, applyIntegrityWorkloadPresetImport } from './workload-preset-package-integrity.js';

const MAX_HISTORY=20;
function array(value){return Array.isArray(value)?value:[];}
function text(value,max=120){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
function presetFingerprint(preset={}){return sha256Hex(canonicalStringify({id:preset.id,name:preset.name,config:preset.config}));}
function normalizeDecision(item={}){const action=['accepted','renamed','skipped','rejected'].includes(item.action)?item.action:'';if(!action)return null;return {index:Math.max(0,Number(item.index)||0),action,id:text(item.id,80)||null,nameConflict:Boolean(item.nameConflict),idConflict:Boolean(item.idConflict)};}
function normalizeEntry(item={}){
  const at=iso(item.at),undoneAt=item.undoneAt?iso(item.undoneAt):null,addedIds=array(item.addedIds).map((id)=>text(id,80)).filter(Boolean).slice(0,20),addedFingerprints=array(item.addedFingerprints).map((hash)=>text(hash,128)).slice(0,20),decisions=array(item.decisions).map(normalizeDecision).filter(Boolean).slice(0,100);
  if(!at||!addedIds.length||addedIds.length!==addedFingerprints.length)return null;
  return {id:text(item.id,120)||`preset-import-${at}`,at,strategy:item.strategy==='rename'?'rename':'skip',addedIds,addedFingerprints,addedCount:addedIds.length,conflicts:Math.max(0,Number(item.conflicts)||0),rejected:Math.max(0,Number(item.rejected)||0),decisions,undoneAt};
}

export function workloadPresetImportHistory(settings={}){
  return array(settings.workloadPresetImportHistory).map(normalizeEntry).filter(Boolean).slice(-MAX_HISTORY);
}

export function applyIntegrityWorkloadPresetImportWithHistory(settings={},pkg={},options={},at=new Date().toISOString()){
  const preview=previewIntegrityWorkloadPresetImport(pkg,settings,options);
  if(!preview.valid)return {settings,changed:false,added:0,reason:preview.reason,historyAdded:false};
  const before=customWorkloadPresets(settings),beforeIds=new Set(before.map((item)=>item.id)),result=applyIntegrityWorkloadPresetImport(settings,pkg,options);
  if(!result.changed)return {...result,historyAdded:false};
  const after=customWorkloadPresets(result.settings),added=after.filter((item)=>!beforeIds.has(item.id));
  if(!added.length)return {...result,historyAdded:false};
  const decisions=preview.items.map((item,index)=>({index,action:item.status==='resolved'?'renamed':item.status==='conflict-skip'?'skipped':item.status==='rejected'?'rejected':'accepted',id:item.id||null,nameConflict:Boolean(item.nameConflict),idConflict:Boolean(item.idConflict)}));
  const timestamp=iso(at)||new Date().toISOString(),history=workloadPresetImportHistory(settings),entry={id:`preset-import-${timestamp}-${history.length+1}`.slice(0,120),at:timestamp,strategy:preview.strategy,addedIds:added.map((item)=>item.id),addedFingerprints:added.map(presetFingerprint),addedCount:added.length,conflicts:preview.conflicts,rejected:preview.rejected,decisions,undoneAt:null};
  return {...result,settings:{...result.settings,workloadPresetImportHistory:[...history,entry].slice(-MAX_HISTORY)},historyAdded:true,historyEntry:entry};
}

export function undoLastWorkloadPresetImport(settings={},at=new Date().toISOString()){
  const history=workloadPresetImportHistory(settings),index=history.findLastIndex((item)=>!item.undoneAt);
  if(index<0)return {settings,changed:false,removed:0,reason:'nothing-to-undo'};
  const entry=history[index],current=customWorkloadPresets(settings),byId=new Map(current.map((item)=>[item.id,item]));
  for(let i=0;i<entry.addedIds.length;i+=1){const preset=byId.get(entry.addedIds[i]);if(!preset||presetFingerprint(preset)!==entry.addedFingerprints[i])return {settings,changed:false,removed:0,reason:'preset-state-diverged',entry};}
  const remove=new Set(entry.addedIds),next=current.filter((item)=>!remove.has(item.id)),undoneAt=iso(at)||new Date().toISOString(),nextHistory=history.map((item,i)=>i===index?{...item,undoneAt}:item);
  return {settings:{...settings,customWorkloadPresets:next,workloadPresetImportHistory:nextHistory.slice(-MAX_HISTORY)},changed:true,removed:entry.addedIds.length,reason:'undone',entry:{...entry,undoneAt}};
}

export const WORKLOAD_PRESET_IMPORT_HISTORY_NOTE='Import preset ghi lịch sử cục bộ tối đa 20 lượt với strategy, số conflict/rejected, quyết định accepted/renamed/skipped/rejected và fingerprint của preset đã thêm. Không lưu package nguồn, childId, score/rank/performance/health data. Undo chỉ xóa preset nếu fingerprint vẫn khớp, tránh xóa nhầm preset đã được người dùng sửa sau import.';
