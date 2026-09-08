import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { customWorkloadPresets } from './workload-preset-library.js';
import { previewIntegrityWorkloadPresetImport, applyIntegrityWorkloadPresetImport } from './workload-preset-package-integrity.js';

export const WORKLOAD_PRESET_IMPORT_HISTORY_FORMAT='growup-workload-preset-import-history-v1';
const MAX_HISTORY=20;

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?new Date().toISOString():d.toISOString();}
function presetSignature(preset={}){return sha256Hex(canonicalStringify({id:text(preset.id,80),name:text(preset.name,60),config:preset.config||{}}));}
function entryId(at,index=0){return `preset-import-${String(at).replace(/[^0-9]/g,'').slice(0,17)}-${index}`;}
function normalizeDecision(item={}){return {status:['accepted','resolved','conflict-skip','rejected'].includes(item.status)?item.status:'rejected',sourceId:text(item.sourceId||item.id,80)||null,sourceName:text(item.sourceName||item.name,60)||null,resolvedId:text(item.resolvedId,80)||null,resolvedName:text(item.resolvedName,60)||null,nameConflict:Boolean(item.nameConflict),idConflict:Boolean(item.idConflict)};}

export function workloadPresetImportHistory(settings={}){
  return array(settings.workloadPresetImportHistory).slice(-MAX_HISTORY).map((entry,index)=>({
    id:text(entry?.id,100)||entryId(iso(entry?.at),index),
    at:iso(entry?.at),
    strategy:entry?.strategy==='rename'?'rename':'skip',
    decisions:array(entry?.decisions).map(normalizeDecision).slice(0,100),
    added:array(entry?.added).map((item)=>({id:text(item?.id,80),name:text(item?.name,60),signature:text(item?.signature,128)})).filter((item)=>item.id&&item.signature).slice(0,20)
  })).filter((entry)=>entry.added.length||entry.decisions.length);
}

export function applyWorkloadPresetImportWithHistory(settings={},pkg={},options={},at=new Date().toISOString()){
  const strategy=options.conflictStrategy==='rename'?'rename':'skip',preview=previewIntegrityWorkloadPresetImport(pkg,settings,{conflictStrategy:strategy});
  if(!preview.valid)return {settings,changed:false,added:0,reason:preview.reason||'invalid-import'};
  const applied=applyIntegrityWorkloadPresetImport(settings,pkg,{conflictStrategy:strategy});
  if(!applied.changed)return {...applied,historyRecorded:false};
  const after=customWorkloadPresets(applied.settings),addedIds=new Set(preview.acceptedItems.slice(0,applied.added).map((item)=>item.id)),added=after.filter((item)=>addedIds.has(item.id)).map((item)=>({id:item.id,name:item.name,signature:presetSignature(item)}));
  const decisions=preview.items.map((item)=>normalizeDecision({status:item.status,sourceId:item.id,sourceName:item.name,resolvedId:item.status==='accepted'||item.status==='resolved'?item.id:null,resolvedName:item.status==='accepted'||item.status==='resolved'?item.name:null,nameConflict:item.nameConflict,idConflict:item.idConflict}));
  const when=iso(at),history=workloadPresetImportHistory(settings),entry={id:entryId(when,history.length+1),at:when,strategy,decisions,added};
  return {...applied,settings:{...applied.settings,workloadPresetImportHistory:[...history,entry].slice(-MAX_HISTORY)},historyRecorded:true,historyEntry:entry};
}

export function undoLastWorkloadPresetImport(settings={}){
  const history=workloadPresetImportHistory(settings);
  if(!history.length)return {settings,changed:false,removed:0,preservedModified:0,reason:'no-import-history'};
  const last=history[history.length-1],targets=new Map(last.added.map((item)=>[item.id,item.signature])),current=customWorkloadPresets(settings);let removed=0,preservedModified=0;
  const remaining=current.filter((preset)=>{const expected=targets.get(preset.id);if(!expected)return true;if(presetSignature(preset)===expected){removed+=1;return false;}preservedModified+=1;return true;});
  if(!removed&&preservedModified===0)return {settings,changed:false,removed:0,preservedModified:0,reason:'delta-not-present',historyEntry:last};
  return {settings:{...settings,customWorkloadPresets:remaining,workloadPresetImportHistory:history.slice(0,-1)},changed:true,removed,preservedModified,reason:preservedModified?'partial-undo-preserved-modified':'undone',historyEntry:last};
}

export const WORKLOAD_PRESET_IMPORT_HISTORY_NOTE='Lịch sử import preset chỉ giữ audit metadata về chiến lược skip/rename, quyết định xung đột và chữ ký của preset trung tính đã thêm. Undo chỉ xóa preset vẫn còn đúng chữ ký lúc import; preset đã được người dùng sửa sau đó được giữ lại. Không lưu childId, score/rank/performance/health semantics hay package nguồn.';
