import { migrateState } from './core/schema.js';
import { saveState, appendAudit } from './core/store.js';
import { verifySafeExportIntegrity } from './core/export-integrity.js';
import { exportVerificationReceipts, recordExportVerificationReceipt, EXPORT_VERIFICATION_HISTORY_NOTE } from './core/export-verification-history.js';
import { workloadDisplayPresets, applyWorkloadDisplayPreset, resetWorkloadDisplayPreset, matchingWorkloadPresetId, WORKLOAD_PRESETS_NOTE } from './core/workload-presets.js';
import { buildSavedSearchCriteriaPackage, previewSavedSearchCriteriaImport, applySavedSearchCriteriaImport, SAVED_SEARCH_PACKAGE_NOTE } from './core/saved-search-package.js';
import { recoveryCalendarCandidates, recoveryRemindersToIcs, RECOVERY_CALENDAR_BRIDGE_NOTE } from './core/recovery-calendar-bridge.js';
import { compatibilityUsageSnapshot, legacyModuleDefinitions } from './core/runtime-compatibility.js';
import { buildLegacyRetirementDryRun, RETIREMENT_DRY_RUN_NOTE } from './core/retirement-dry-run.js';

const STORAGE_KEY='growup_mychildren_v1';
let scheduled=false,pendingSearchPackage=null;
const observer=new MutationObserver(()=>queueMicrotask(enhanceV14));
function readState(){try{return migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"version":5,"children":[]}'));}catch{return migrateState({version:5,children:[]});}}
function esc(value=''){return String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function auditedSave(state,type,details={}){saveState(appendAudit(state,type,details));}
function downloadText(name,text,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);}
function selectedChild(state){return state.children.find((item)=>item.id===state.selectedChildId)||state.children[0]||null;}

function receiptPanel(state){const receipts=exportVerificationReceipts(state.settings||{});return `<section class="card v14-panel" data-v14="verification-history"><div class="v14-heading"><div><span class="v14-kicker">Lượt 91 · Verification receipts</span><h2>Lịch sử xác minh safe export</h2></div><span class="pill">${receipts.length}/50</span></div><div id="v14ReceiptList" class="v14-list">${receipts.length?receipts.slice().reverse().slice(0,8).map((item)=>`<div><strong>${item.checksumResult==='valid'?'Hợp lệ':'Không hợp lệ'}</strong><span>${esc(item.at)} · ${esc(item.format)} · ${esc(item.algorithm)}</span></div>`).join(''):'<div class="empty">Chưa có receipt xác minh.</div>'}</div><div class="v14-note">${esc(EXPORT_VERIFICATION_HISTORY_NOTE)}</div></section>`;}

function workloadPresetPanel(state){const presets=workloadDisplayPresets(),current=matchingWorkloadPresetId(state.settings||{});return `<section class="card v14-panel" data-v14="workload-presets"><div class="v14-heading"><div><span class="v14-kicker">Lượt 92 · Presets</span><h2>Preset dải thời lượng</h2></div><span class="pill">${current?esc(current):'custom'}</span></div><form id="v14WorkloadPresetForm" class="form"><label><span>Preset trung tính</span><select name="presetId">${presets.map((item)=>`<option value="${esc(item.id)}" ${item.id===current?'selected':''}>${esc(item.name)}</option>`).join('')}</select></label><div class="v14-actions"><button class="primary" type="submit">Áp dụng preset</button><button class="secondary" type="button" id="v14ResetWorkloadPreset">Đặt lại mặc định</button></div></form><div class="v14-note">${esc(WORKLOAD_PRESETS_NOTE)}</div></section>`;}

function savedSearchPackagePanel(){return `<section class="card v14-panel" data-v14="saved-search-package"><div class="v14-heading"><div><span class="v14-kicker">Lượt 93 · Portable criteria</span><h2>Gói Saved Search an toàn</h2></div><span class="pill">criteria-only</span></div><div class="v14-actions"><button class="secondary" type="button" id="v14ExportSearchPackage">Xuất package JSON</button></div><form id="v14SavedSearchImportForm" class="form"><label><span>Package JSON cần nhập</span><input name="file" type="file" accept="application/json,.json" required></label><div class="v14-actions"><button class="secondary" type="submit">Preview import</button><button class="primary" type="button" id="v14ApplySearchImport" disabled>Áp dụng import</button></div></form><div id="v14SearchImportPreview" class="v14-status">Chưa preview package.</div><div class="v14-note">${esc(SAVED_SEARCH_PACKAGE_NOTE)}</div></section>`;}

function recoveryCalendarPanel(state){const child=selectedChild(state),items=child?recoveryCalendarCandidates(state,child.id):[];return `<section class="card v14-panel" data-v14="recovery-calendar"><div class="v14-heading"><div><span class="v14-kicker">Lượt 94 · Calendar bridge</span><h2>Xuất recovery reminder ra .ics</h2></div><span class="pill">explicit only</span></div>${items.length?`<form id="v14RecoveryCalendarForm" class="form"><fieldset><legend>Chọn reminder cần xuất</legend><div class="v14-checks">${items.map((item)=>`<label><input type="checkbox" name="reminderIds" value="${esc(item.id)}"><span>${esc(item.title)} · ${esc(item.date)} · gốc ${esc(item.originDate)}</span></label>`).join('')}</div></fieldset><button class="primary" type="submit">Tạo file .ics đã chọn</button></form>`:'<div class="empty">Chưa có recovery reminder để chọn.</div>'}<div id="v14RecoveryCalendarStatus" class="v14-status">Không có ghi lịch nền hoặc tự động.</div><div class="v14-note">${esc(RECOVERY_CALENDAR_BRIDGE_NOTE)}</div></section>`;}

function retirementDryRunPanel(){return `<section class="card v14-panel" data-v14="retirement-dry-run"><div class="v14-heading"><div><span class="v14-kicker">Lượt 95 · Dry run</span><h2>Gói review retirement không phá hủy</h2></div><span class="pill">report only</span></div><button class="primary" type="button" id="v14DryRunRetirement">Tạo báo cáo dry-run</button><div id="v14DryRunResult" class="v14-status">Chưa tạo báo cáo.</div><div class="v14-note">${esc(RETIREMENT_DRY_RUN_NOTE)}</div></section>`;}

function addPanels(){const main=document.querySelector('.main'),title=document.querySelector('.topbar h1')?.textContent?.trim();if(!main||title!=='Tổng quan phát triển'||document.querySelector('[data-v14="verification-history"]'))return;const state=readState();main.insertAdjacentHTML('beforeend',`<div class="v14-grid">${receiptPanel(state)}${workloadPresetPanel(state)}${savedSearchPackagePanel()}${recoveryCalendarPanel(state)}${retirementDryRunPanel()}</div>`);}
function enhanceV14(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;addPanels();});}
function refreshReceipts(){const panel=document.querySelector('[data-v14="verification-history"]');if(panel)panel.outerHTML=receiptPanel(readState());}

// L91 hooks the existing explicit v1.3 verification form. Only the four-field receipt is persisted.
document.addEventListener('submit',async(event)=>{
  if(event.target.id==='v13VerifyExportForm'){
    const file=new FormData(event.target).get('file');if(!(file instanceof File))return;
    try{const parsed=JSON.parse(await file.text()),verification=verifySafeExportIntegrity(parsed),state=readState();state.settings=recordExportVerificationReceipt(state.settings||{},verification);auditedSave(state,'safe_export_verification_receipt',{format:verification.format||'unknown',valid:Boolean(verification.valid)});refreshReceipts();}catch{const state=readState();state.settings=recordExportVerificationReceipt(state.settings||{},{format:'invalid-json',algorithm:'unknown',valid:false});auditedSave(state,'safe_export_verification_receipt',{format:'invalid-json',valid:false});refreshReceipts();}
    return;
  }
  if(event.target.id==='v14WorkloadPresetForm'){
    event.preventDefault();const state=readState(),presetId=new FormData(event.target).get('presetId'),result=applyWorkloadDisplayPreset(state.settings||{},presetId);if(result.changed){state.settings=result.settings;auditedSave(state,'workload_preset_applied',{presetId:result.presetId});location.reload();}return;
  }
  if(event.target.id==='v14SavedSearchImportForm'){
    event.preventDefault();const file=new FormData(event.target).get('file'),target=document.querySelector('#v14SearchImportPreview'),apply=document.querySelector('#v14ApplySearchImport');pendingSearchPackage=null;apply.disabled=true;try{const parsed=JSON.parse(await file.text()),preview=previewSavedSearchCriteriaImport(parsed,readState().settings||{});if(!preview.valid){target.textContent='Package không đúng format/version.';return;}pendingSearchPackage=parsed;apply.disabled=false;target.textContent=`Preview: ${preview.total} view · ${preview.accepted} có thể thêm · ${preview.duplicates} trùng · ${preview.strippedUnsafeDatasetEntries} dataset entry không an toàn đã loại.`;}catch{target.textContent='Không thể preview: JSON không hợp lệ.';}return;
  }
  if(event.target.id==='v14RecoveryCalendarForm'){
    event.preventDefault();const state=readState(),child=selectedChild(state),ids=new FormData(event.target).getAll('reminderIds').map(String),status=document.querySelector('#v14RecoveryCalendarStatus');if(!child||!ids.length){status.textContent='Hãy tích chọn ít nhất một recovery reminder.';return;}const ics=recoveryRemindersToIcs(state,child.id,ids);downloadText('growup-recovery-reminders.ics',ics,'text/calendar');status.textContent=`Đã tạo file .ics cho ${ids.length} reminder được chọn; chưa ghi vào lịch bên ngoài.`;return;
  }
},true);

document.addEventListener('click',async(event)=>{
  if(event.target.closest('#v14ResetWorkloadPreset')){const state=readState(),result=resetWorkloadDisplayPreset(state.settings||{});state.settings=result.settings;auditedSave(state,'workload_preset_reset',{presetId:result.presetId});location.reload();return;}
  if(event.target.closest('#v14ExportSearchPackage')){const pkg=buildSavedSearchCriteriaPackage(readState().settings||{});downloadText('growup-saved-search-criteria.json',JSON.stringify(pkg,null,2));return;}
  if(event.target.closest('#v14ApplySearchImport')){if(!pendingSearchPackage)return;const state=readState(),result=applySavedSearchCriteriaImport(state.settings||{},pendingSearchPackage);if(result.changed){state.settings=result.settings;auditedSave(state,'saved_search_package_imported',{added:result.added,skippedDuplicates:result.skippedDuplicates});pendingSearchPackage=null;location.reload();}else document.querySelector('#v14SearchImportPreview').textContent=`Không có view mới để nhập · ${result.skippedDuplicates||0} trùng.`;return;}
  if(event.target.closest('#v14DryRunRetirement')){const target=document.querySelector('#v14DryRunResult');try{const source=await fetch('./src/runtime-entry.js',{cache:'no-store'}).then((response)=>response.text()),evidence=compatibilityUsageSnapshot(document).map((item)=>({module:item.module,flow:'overview',observed:true,active:item.active})),pkg=buildLegacyRetirementDryRun({evidenceRecords:evidence,runtimeEntrySource:source,definitions:legacyModuleDefinitions()});downloadText('growup-legacy-retirement-dry-run.json',JSON.stringify(pkg,null,2));target.textContent=`Dry-run: ${pkg.candidateCount} candidate · removalsApplied=${pkg.removalsApplied}. Không file/module nào bị xóa.`;}catch{target.textContent='Không tạo được dry-run; giữ nguyên toàn bộ legacy module.';}return;}
});

document.addEventListener('change',(event)=>{if(event.target.closest('#v14SavedSearchImportForm input[name="file"]')){pendingSearchPackage=null;const apply=document.querySelector('#v14ApplySearchImport');if(apply)apply.disabled=true;}});
observer.observe(document.querySelector('#app'),{childList:true,subtree:true});enhanceV14();
