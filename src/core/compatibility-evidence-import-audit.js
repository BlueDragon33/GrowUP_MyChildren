import { COMPATIBILITY_REQUIRED_FLOWS } from './compatibility-evidence.js';
import { storedCompatibilityEvidence, normalizeStoredCompatibilityEvidence, recordCompatibilityEvidence } from './compatibility-evidence-store.js';
import { previewCompatibilityEvidenceImport } from './compatibility-evidence-package.js';

const MAX_HISTORY=20;
const MAX_RECORDS=120;
function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
function key(record={}){return `${record.module}\u0000${record.flow}`;}
function normalizeRecord(record={}){const at=iso(record.at),module=text(record.module,80),flow=COMPATIBILITY_REQUIRED_FLOWS.includes(record.flow)?record.flow:'';if(!at||!module||!flow||record.observed!==true||typeof record.active!=='boolean')return null;return {module,flow,observed:true,active:record.active,at};}
function sameRecord(a,b){return Boolean(a&&b)&&a.module===b.module&&a.flow===b.flow&&a.observed===b.observed&&a.active===b.active&&a.at===b.at;}
function normalizeDelta(delta={}){const after=normalizeRecord(delta.after),before=delta.before==null?null:normalizeRecord(delta.before);if(!after)return null;return {module:after.module,flow:after.flow,before,after};}
function normalizeHistoryEntry(item={}){const at=iso(item.at),undoneAt=item.undoneAt?iso(item.undoneAt):null,deltas=array(item.deltas).map(normalizeDelta).filter(Boolean).slice(0,MAX_RECORDS);if(!at||!deltas.length)return null;return {id:text(item.id,120)||`evidence-import-${at}`,at,deltas,addedCount:deltas.filter((d)=>!d.before).length,replacedCount:deltas.filter((d)=>d.before).length,duplicates:Math.max(0,Number(item.duplicates)||0),rejected:Math.max(0,Number(item.rejected)||0),axeRecheckRequired:Math.max(0,Number(item.axeRecheckRequired)||0),capacitySkipped:Math.max(0,Number(item.capacitySkipped)||0),undoneAt};}

export function compatibilityEvidenceImportHistory(settings={}){
  return array(settings.compatibilityEvidenceImportHistory).map(normalizeHistoryEntry).filter(Boolean).slice(-MAX_HISTORY);
}

export function applyCompatibilityEvidenceImportWithAudit(settings={},pkg={},at=new Date().toISOString()){
  const preview=previewCompatibilityEvidenceImport(pkg,settings);if(!preview.valid)return {settings,changed:false,added:0,replaced:0,reason:preview.reason,auditAdded:false};
  const current=storedCompatibilityEvidence(settings),currentMap=new Map(current.map((record)=>[key(record),record])),freeStart=Math.max(0,MAX_RECORDS-currentMap.size),latestIncoming=new Map();
  for(const record of preview.accepted)latestIncoming.set(key(record),record);
  let free=freeStart,capacitySkipped=0;const selected=[];
  for(const record of latestIncoming.values()){const k=key(record);if(currentMap.has(k)){selected.push(record);continue;}if(free>0){selected.push(record);free-=1;}else capacitySkipped+=1;}
  const deltas=selected.map((record)=>({module:record.module,flow:record.flow,before:currentMap.get(key(record))||null,after:record})).filter((delta)=>!sameRecord(delta.before,delta.after));
  if(!deltas.length)return {settings,changed:false,added:0,replaced:0,duplicates:preview.duplicates,rejected:preview.rejected,axeRecheckRequired:preview.axeRecheckRequired,capacitySkipped,reason:'nothing-to-import',auditAdded:false};
  const next=recordCompatibilityEvidence(settings,deltas.map((delta)=>delta.after)),timestamp=iso(at)||new Date().toISOString(),history=compatibilityEvidenceImportHistory(settings),entry={id:`evidence-import-${timestamp}-${history.length+1}`.slice(0,120),at:timestamp,deltas,addedCount:deltas.filter((d)=>!d.before).length,replacedCount:deltas.filter((d)=>d.before).length,duplicates:preview.duplicates,rejected:preview.rejected,axeRecheckRequired:preview.axeRecheckRequired,capacitySkipped,undoneAt:null};
  return {settings:{...next,compatibilityEvidenceImportHistory:[...history,entry].slice(-MAX_HISTORY)},changed:true,added:entry.addedCount,replaced:entry.replacedCount,duplicates:preview.duplicates,rejected:preview.rejected,axeRecheckRequired:preview.axeRecheckRequired,capacitySkipped,reason:'imported',auditAdded:true,auditEntry:entry};
}

export function undoLastCompatibilityEvidenceImport(settings={},at=new Date().toISOString()){
  const history=compatibilityEvidenceImportHistory(settings),index=history.findLastIndex((item)=>!item.undoneAt);if(index<0)return {settings,changed:false,restored:0,removed:0,reason:'nothing-to-undo'};
  const entry=history[index],current=storedCompatibilityEvidence(settings),map=new Map(current.map((record)=>[key(record),record]));
  for(const delta of entry.deltas){const now=map.get(key(delta.after));if(!sameRecord(now,delta.after))return {settings,changed:false,restored:0,removed:0,reason:'evidence-state-diverged',entry};}
  let restored=0,removed=0;for(const delta of entry.deltas){const k=key(delta.after);if(delta.before){map.set(k,delta.before);restored+=1;}else{map.delete(k);removed+=1;}}
  const undoneAt=iso(at)||new Date().toISOString(),nextHistory=history.map((item,i)=>i===index?{...item,undoneAt}:item),records=normalizeStoredCompatibilityEvidence([...map.values()].sort((a,b)=>a.at.localeCompare(b.at)));
  return {settings:{...settings,compatibilityEvidenceRecords:records,compatibilityEvidenceImportHistory:nextHistory.slice(-MAX_HISTORY)},changed:true,restored,removed,reason:'undone',entry:{...entry,undoneAt}};
}

export function compatibilityEvidenceFreshness(settings={},options={}){
  const nowDate=new Date(options.now||new Date()),now=Number.isNaN(nowDate.getTime())?new Date():nowDate,staleAfterDays=Math.min(365,Math.max(1,Number(options.staleAfterDays)||30)),records=storedCompatibilityEvidence(settings),latest=new Map();
  for(const record of records){const prior=latest.get(record.flow);if(!prior||record.at>prior.at)latest.set(record.flow,record);}
  const flows=COMPATIBILITY_REQUIRED_FLOWS.map((flow)=>{const record=latest.get(flow);if(!record)return {flow,status:'missing',latestAt:null,ageDays:null};const ageDays=Math.max(0,(now.getTime()-new Date(record.at).getTime())/86400000);return {flow,status:ageDays>staleAfterDays?'stale':'fresh',latestAt:record.at,ageDays:Number(ageDays.toFixed(1))};});
  return {asOf:now.toISOString(),staleAfterDays,flows,freshFlows:flows.filter((item)=>item.status==='fresh').map((item)=>item.flow),staleFlows:flows.filter((item)=>item.status==='stale').map((item)=>item.flow),missingFlows:flows.filter((item)=>item.status==='missing').map((item)=>item.flow),allFresh:flows.every((item)=>item.status==='fresh')};
}

export const COMPATIBILITY_EVIDENCE_IMPORT_AUDIT_NOTE='Evidence import chỉ audit/undo record non-Axe. Delta lưu module/flow/observed/active/timestamp trước-sau, không lưu package/checksum/DOM/selector/dữ liệu trẻ. Axe từ package vẫn bị loại và phải chạy lại cục bộ; undo từ chối nếu evidence đã thay đổi sau import. Freshness chỉ mô tả tuổi evidence theo flow, không tự cho phép retirement hay xóa legacy.';
