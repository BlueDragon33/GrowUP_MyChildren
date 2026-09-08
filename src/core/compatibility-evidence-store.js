import { COMPATIBILITY_REQUIRED_FLOWS, compatibilityEvidenceMatrix } from './compatibility-evidence.js';

const MAX_RECORDS=120;
function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?new Date().toISOString():d.toISOString();}

export function normalizeStoredCompatibilityEvidence(records=[]){
  return array(records).map((record)=>({
    module:text(record?.module,80),
    flow:COMPATIBILITY_REQUIRED_FLOWS.includes(record?.flow)?record.flow:'',
    observed:Boolean(record?.observed),
    active:Boolean(record?.active),
    at:iso(record?.at||new Date().toISOString())
  })).filter((record)=>record.module&&record.flow&&record.observed).slice(-MAX_RECORDS);
}

export function storedCompatibilityEvidence(settings={}){
  return normalizeStoredCompatibilityEvidence(settings.compatibilityEvidenceRecords||[]);
}

export function recordCompatibilityEvidence(settings={},records=[],at=new Date().toISOString()){
  const current=storedCompatibilityEvidence(settings),incoming=normalizeStoredCompatibilityEvidence(array(records).map((record)=>({...record,at:record.at||at})));
  const latest=new Map();
  for(const record of [...current,...incoming])latest.set(`${record.module}\u0000${record.flow}`,record);
  const next=[...latest.values()].sort((a,b)=>a.at.localeCompare(b.at)).slice(-MAX_RECORDS);
  return {...settings,compatibilityEvidenceRecords:next};
}

export function recordCompatibilityFlowSnapshot(settings={},flow='',snapshot=[],at=new Date().toISOString()){
  if(!COMPATIBILITY_REQUIRED_FLOWS.includes(flow))return settings;
  return recordCompatibilityEvidence(settings,array(snapshot).map((item)=>({module:item.module,flow,observed:true,active:Boolean(item.active),at})),at);
}

export function compatibilityEvidenceCoverage(settings={}){
  const records=storedCompatibilityEvidence(settings),matrix=compatibilityEvidenceMatrix(records);
  const coveredFlows=COMPATIBILITY_REQUIRED_FLOWS.filter((flow)=>records.some((record)=>record.flow===flow));
  return {records,matrix,coveredFlows,missingFlows:COMPATIBILITY_REQUIRED_FLOWS.filter((flow)=>!coveredFlows.includes(flow)),completeModules:matrix.filter((row)=>row.complete).map((row)=>row.module)};
}

export function clearCompatibilityEvidence(settings={}){
  return {...settings,compatibilityEvidenceRecords:[]};
}

export const COMPATIBILITY_EVIDENCE_STORE_NOTE='Store chỉ giữ metadata module/flow/observed/active/timestamp và tối đa 120 record gần nhất, dedupe theo module+flow. Runtime có thể ghi Overview/Learning/Skills/Portfolio/mobile; flow Axe chỉ được ghi sau khi audit Axe thực sự PASS. Thiếu bất kỳ flow nào thì retirement vẫn giữ retain và không tự xóa module.';
