import { COMPATIBILITY_REQUIRED_FLOWS } from './compatibility-evidence.js';
import { storedCompatibilityEvidence } from './compatibility-evidence-store.js';
import { previewCompatibilityEvidenceImport, applyCompatibilityEvidenceImport } from './compatibility-evidence-package.js';

export const COMPATIBILITY_EVIDENCE_IMPORT_HISTORY_FORMAT='growup-compatibility-evidence-import-history-v1';
const MAX_HISTORY=20;
const DEFAULT_FRESH_DAYS=30;

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?new Date().toISOString():d.toISOString();}
function key(record){return `${record.module}\u0000${record.flow}`;}
function normalizeRecord(record={}){const module=text(record.module,80),flow=COMPATIBILITY_REQUIRED_FLOWS.includes(record.flow)?record.flow:'',date=new Date(record.at);if(!module||!flow||flow==='axe'||record.observed!==true||typeof record.active!=='boolean'||Number.isNaN(date.getTime()))return null;return {module,flow,observed:true,active:record.active,at:date.toISOString()};}
function sameRecord(a,b){return Boolean(a&&b&&a.module===b.module&&a.flow===b.flow&&a.observed===b.observed&&a.active===b.active&&a.at===b.at);}
function historyId(at,index=0){return `compat-import-${String(at).replace(/[^0-9]/g,'').slice(0,17)}-${index}`;}

export function compatibilityEvidenceImportHistory(settings={}){
  return array(settings.compatibilityEvidenceImportHistory).slice(-MAX_HISTORY).map((entry,index)=>({
    id:text(entry?.id,100)||historyId(iso(entry?.at),index),
    at:iso(entry?.at),
    packageFormat:text(entry?.packageFormat,80)||'unknown',
    axeRecheckRequired:Math.max(0,Number(entry?.axeRecheckRequired)||0),
    deltas:array(entry?.deltas).map((delta)=>({before:normalizeRecord(delta?.before),after:normalizeRecord(delta?.after)})).filter((delta)=>delta.after).slice(0,120)
  })).filter((entry)=>entry.deltas.length);
}

export function applyCompatibilityEvidenceImportWithHistory(settings={},pkg={},at=new Date().toISOString()){
  const preview=previewCompatibilityEvidenceImport(pkg,settings);if(!preview.valid)return {settings,changed:false,added:0,reason:preview.reason||'invalid-import'};
  const beforeRecords=storedCompatibilityEvidence(settings),beforeMap=new Map(beforeRecords.filter((record)=>record.flow!=='axe').map((record)=>[key(record),record]));
  const applied=applyCompatibilityEvidenceImport(settings,pkg);if(!applied.changed)return {...applied,historyRecorded:false};
  const afterMap=new Map(storedCompatibilityEvidence(applied.settings).filter((record)=>record.flow!=='axe').map((record)=>[key(record),record])),deltas=[];
  for(const accepted of preview.accepted){const after=afterMap.get(key(accepted));if(after)deltas.push({before:beforeMap.get(key(accepted))||null,after});}
  const when=iso(at),history=compatibilityEvidenceImportHistory(settings),entry={id:historyId(when,history.length+1),at:when,packageFormat:text(pkg?.format,80)||'unknown',axeRecheckRequired:preview.axeRecheckRequired,deltas};
  return {...applied,settings:{...applied.settings,compatibilityEvidenceImportHistory:[...history,entry].slice(-MAX_HISTORY)},historyRecorded:true,historyEntry:entry};
}

export function undoLastCompatibilityEvidenceImport(settings={}){
  const history=compatibilityEvidenceImportHistory(settings);if(!history.length)return {settings,changed:false,reverted:0,preservedModified:0,reason:'no-import-history'};
  const last=history[history.length-1],current=storedCompatibilityEvidence(settings),map=new Map(current.map((record)=>[key(record),record]));let reverted=0,preservedModified=0;
  for(const delta of last.deltas){const currentRecord=map.get(key(delta.after));if(!sameRecord(currentRecord,delta.after)){preservedModified+=1;continue;}if(delta.before)map.set(key(delta.before),delta.before);else map.delete(key(delta.after));reverted+=1;}
  if(!reverted&&preservedModified===0)return {settings,changed:false,reverted:0,preservedModified:0,reason:'delta-not-present',historyEntry:last};
  const records=[...map.values()].sort((a,b)=>a.at.localeCompare(b.at)).slice(-120);
  return {settings:{...settings,compatibilityEvidenceRecords:records,compatibilityEvidenceImportHistory:history.slice(0,-1)},changed:true,reverted,preservedModified,reason:preservedModified?'partial-undo-preserved-modified':'undone',historyEntry:last};
}

export function compatibilityEvidenceFreshnessSummary(settings={},now=new Date().toISOString(),freshDays=DEFAULT_FRESH_DAYS){
  const current=new Date(now);const nowMs=Number.isNaN(current.getTime())?Date.now():current.getTime(),limit=Math.max(1,Math.min(3650,Number(freshDays)||DEFAULT_FRESH_DAYS)),records=storedCompatibilityEvidence(settings),modules=[...new Set(records.map((record)=>record.module))].sort();
  const rows=modules.map((module)=>{const flows=Object.fromEntries(COMPATIBILITY_REQUIRED_FLOWS.map((flow)=>{const record=records.find((item)=>item.module===module&&item.flow===flow);if(!record)return [flow,{status:'missing',at:null,ageDays:null,active:null}];const ageDays=Math.max(0,Math.floor((nowMs-new Date(record.at).getTime())/86400000));return [flow,{status:ageDays<=limit?'fresh':'stale',at:record.at,ageDays,active:record.active}];}));const missing=COMPATIBILITY_REQUIRED_FLOWS.filter((flow)=>flows[flow].status==='missing'),stale=COMPATIBILITY_REQUIRED_FLOWS.filter((flow)=>flows[flow].status==='stale');return {module,flows,missingFlows:missing,staleFlows:stale,fresh:missing.length===0&&stale.length===0,axeRecheckRequired:flows.axe.status!=='fresh'};});
  return {freshDays:limit,generatedAt:new Date(nowMs).toISOString(),modules:rows,freshModules:rows.filter((row)=>row.fresh).map((row)=>row.module),attentionModules:rows.filter((row)=>!row.fresh).map((row)=>row.module),axeRecheckModules:rows.filter((row)=>row.axeRecheckRequired).map((row)=>row.module)};
}

export const COMPATIBILITY_EVIDENCE_IMPORT_HISTORY_NOTE='Import audit chỉ ghi delta metadata module/flow/observed/active/timestamp của non-Axe records. Undo chỉ hoàn tác record vẫn đúng trạng thái sau import; record đã thay đổi sau đó được giữ lại. Axe không bao giờ được import/undo từ package và phải tái tạo bằng Axe local thật. Freshness chỉ là cảnh báo tuổi bằng chứng; không kích hoạt legacy retirement.';
