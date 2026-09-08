import { migrateState } from './core/schema.js';
import { saveState, appendAudit } from './core/store.js';
import { filterExportVerificationReceipts, exportVerificationReceiptFormats, buildExportVerificationReceiptPackage, clearExportVerificationReceipts, EXPORT_VERIFICATION_MANAGEMENT_NOTE } from './core/export-verification-management.js';
import { customWorkloadPresets, saveCustomWorkloadPreset, removeCustomWorkloadPreset, applyCustomWorkloadPreset, buildCustomWorkloadPresetPackage, previewCustomWorkloadPresetImport, applyCustomWorkloadPresetImport, WORKLOAD_PRESET_LIBRARY_NOTE } from './core/workload-preset-library.js';
import { buildIntegritySavedSearchCriteriaPackage, verifySavedSearchCriteriaPackageIntegrity, savedSearchPackageVerificationReceipts, recordSavedSearchPackageVerificationReceipt, SAVED_SEARCH_PACKAGE_INTEGRITY_NOTE } from './core/saved-search-package-integrity.js';
import { previewSavedSearchCriteriaImport, applySavedSearchCriteriaImport } from './core/saved-search-package.js';
import { previewRecoveryIcsReconciliation, RECOVERY_ICS_RECONCILIATION_NOTE } from './core/recovery-ics-reconciliation.js';
import { compatibilityUsageSnapshot, legacyModuleDefinitions } from './core/runtime-compatibility.js';
import { recordCompatibilityFlowSnapshot, compatibilityEvidenceCoverage, clearCompatibilityEvidence, COMPATIBILITY_EVIDENCE_STORE_NOTE } from './core/compatibility-evidence-store.js';
import { buildLegacyRetirementDryRun } from './core/retirement-dry-run.js';

const STORAGE_KEY='growup_mychildren_v1';
let scheduled=false,pendingPresetPackage=null,pendingSearchIntegrityPackage=null,receiptFilter={};
const capturedEvidence=new Set();
const observer=new MutationObserver(()=>queueMicrotask(enhanceV15));

function readState(){try{return migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"version":5,"children":[]}'));}catch{return migrateState({version:5,children:[]});}}
function esc(value=''){return String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function auditedSave(state,type,details={}){saveState(appendAudit(state,type,details));}
function downloadText(name,text,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);}
function selectedChild(state){return state.children.find((item)=>item.id===state.selectedChildId)||state.children[0]||null;}
function activePage(){return document.querySelector('.nav [data-nav].active')?.dataset.nav||document.querySelector('#mobileNav')?.value||'';}

function receiptManagementPanel(state){
  const settings=state.settings||{},items=filterExportVerificationReceipts(settings,receiptFilter),formats=exportVerificationReceiptFormats(settings);
  return `<section class="card v15-panel" data-v15="receipt-management"><div class="v15-heading"><div><span class="v15-kicker">Lượt 96 · Receipt management</span><h2>Quản lý receipt xác minh</h2></div><span class="pill">${items.length} mục</span></div><form id="v15ReceiptFilterForm" class="form"><div class="form-row"><label><span>Kết quả</span><select name="result"><option value="">Tất cả</option><option value="valid" ${receiptFilter.result==='valid'?'selected':''}>Hợp lệ</option><option value="invalid" ${receiptFilter.result==='invalid'?'selected':''}>Không hợp lệ</option></select></label><label><span>Format</span><input name="format" value="${esc(receiptFilter.format||'')}" list="v15ReceiptFormats" placeholder="Lọc format"><datalist id="v15ReceiptFormats">${formats.map((item)=>`<option value="${esc(item)}"></option>`).join('')}</datalist></label></div><div class="form-row"><label><span>Từ ngày</span><input type="date" name="fromDate" value="${esc(receiptFilter.fromDate||'')}"></label><label><span>Đến ngày</span><input type="date" name="toDate" value="${esc(receiptFilter.toDate||'')}"></label></div><div class="v15-actions"><button class="secondary" type="submit">Áp dụng lọc</button><button class="secondary" type="button" id="v15ExportReceipts">Xuất receipt JSON</button><button class="danger" type="button" id="v15ClearReceipts">Xóa lịch sử</button></div></form><div class="v15-list">${items.length?items.slice().reverse().slice(0,12).map((item)=>`<div><strong>${item.checksumResult==='valid'?'Hợp lệ':'Không hợp lệ'}</strong><span>${esc(item.at)} · ${esc(item.format)} · ${esc(item.algorithm)}</span></div>`).join(''):'<div class="empty">Không có receipt phù hợp bộ lọc.</div>'}</div><div class="v15-note">${esc(EXPORT_VERIFICATION_MANAGEMENT_NOTE)}</div></section>`;
}

function presetLibraryPanel(state){
  const presets=customWorkloadPresets(state.settings||{});
  return `<section class="card v15-panel" data-v15="preset-library"><div class="v15-heading"><div><span class="v15-kicker">Lượt 97 · Custom presets</span><h2>Thư viện preset thời lượng trung tính</h2></div><span class="pill">${presets.length}/20</span></div><form id="v15PresetCreateForm" class="form"><label><span>Tên preset</span><input name="name" maxlength="60" required placeholder="Ví dụ: Cuối tuần"></label><div class="form-row"><label><span>Ngưỡng 1 (phút)</span><input name="firstMax" type="number" min="1" max="720" value="45" required></label><label><span>Ngưỡng 2 (phút)</span><input name="secondMax" type="number" min="2" max="1440" value="120" required></label></div><div class="form-row"><label><span>Nhãn nhẹ</span><input name="light" value="Đến 45 phút" required></label><label><span>Nhãn vừa</span><input name="moderate" value="46–120 phút" required></label></div><label><span>Nhãn dài</span><input name="extended" value="Trên 120 phút" required></label><button class="primary" type="submit">Lưu preset cục bộ</button></form><div class="v15-list">${presets.length?presets.map((item)=>`<div><span><strong>${esc(item.name)}</strong><small>${item.config.firstMax}/${item.config.secondMax} phút</small></span><span class="v15-inline"><button type="button" class="secondary" data-v15-apply-preset="${esc(item.id)}">Áp dụng</button><button type="button" class="secondary" data-v15-remove-preset="${esc(item.id)}">Xóa</button></span></div>`).join(''):'<div class="empty">Chưa có preset tùy chỉnh.</div>'}</div><div class="v15-actions"><button class="secondary" type="button" id="v15ExportPresetLibrary">Xuất thư viện</button></div><form id="v15PresetImportForm" class="form"><label><span>Thư viện preset JSON</span><input name="file" type="file" accept="application/json,.json" required></label><div class="v15-actions"><button class="secondary" type="submit">Preview import</button><button class="primary" type="button" id="v15ApplyPresetImport" disabled>Áp dụng import</button></div></form><div id="v15PresetImportStatus" class="v15-status">Chưa preview.</div><div class="v15-note">${esc(WORKLOAD_PRESET_LIBRARY_NOTE)}</div></section>`;
}

function savedSearchIntegrityPanel(state){
  const receipts=savedSearchPackageVerificationReceipts(state.settings||{});
  return `<section class="card v15-panel" data-v15="saved-search-integrity"><div class="v15-heading"><div><span class="v15-kicker">Lượt 98 · Criteria integrity</span><h2>Saved Search package có checksum</h2></div><span class="pill">${receipts.length} receipt</span></div><button class="secondary" type="button" id="v15ExportSearchIntegrity">Xuất package SHA-256</button><form id="v15SearchIntegrityImportForm" class="form"><label><span>Package cần kiểm tra/import</span><input name="file" type="file" accept="application/json,.json" required></label><div class="v15-actions"><button class="secondary" type="submit">Xác minh & preview</button><button class="primary" type="button" id="v15ApplySearchIntegrityImport" disabled>Áp dụng import</button></div></form><div id="v15SearchIntegrityStatus" class="v15-status">Chưa xác minh package.</div><div class="v15-note">${esc(SAVED_SEARCH_PACKAGE_INTEGRITY_NOTE)}</div></section>`;
}

function recoveryReconciliationPanel(state){
  const child=selectedChild(state);
  return `<section class="card v15-panel" data-v15="recovery-reconcile"><div class="v15-heading"><div><span class="v15-kicker">Lượt 99 · ICS reconciliation</span><h2>So sánh recovery .ics cục bộ</h2></div><span class="pill">preview only</span></div>${child?`<form id="v15RecoveryReconcileForm" class="form"><label><span>File .ics đã xuất trước đó</span><input name="file" type="file" accept="text/calendar,.ics" required></label><button class="primary" type="submit">So sánh với reminder hiện tại</button></form>`:'<div class="empty">Cần có hồ sơ trẻ để đối chiếu.</div>'}<div id="v15RecoveryReconcileStatus" class="v15-status">Không có thay đổi nào được áp dụng.</div><div class="v15-note">${esc(RECOVERY_ICS_RECONCILIATION_NOTE)}</div></section>`;
}

function evidencePanel(state){
  const coverage=compatibilityEvidenceCoverage(state.settings||{}),missing=coverage.missingFlows;
  return `<section class="card v15-panel" data-v15="compatibility-store"><div class="v15-heading"><div><span class="v15-kicker">Lượt 100 · Six-flow evidence</span><h2>Evidence tương thích tích lũy</h2></div><span class="pill">${coverage.coveredFlows.length}/6 flow</span></div><div class="v15-status"><strong>Đã có:</strong> ${coverage.coveredFlows.length?coverage.coveredFlows.map(esc).join(', '):'chưa có'}<br><strong>Còn thiếu:</strong> ${missing.length?missing.map(esc).join(', '):'không'}<br><strong>Module đủ 6 flow:</strong> ${coverage.completeModules.length}</div><div class="v15-actions"><button class="primary" type="button" id="v15StoredEvidenceDryRun">Tạo dry-run từ evidence đã lưu</button><button class="secondary" type="button" id="v15ClearEvidence">Xóa evidence đã lưu</button></div><div id="v15StoredEvidenceStatus" class="v15-status">Thiếu flow thì module luôn giữ retain.</div><div class="v15-note">${esc(COMPATIBILITY_EVIDENCE_STORE_NOTE)}</div></section>`;
}

function addPanels(){const main=document.querySelector('.main'),page=activePage();if(!main||page!=='overview'||document.querySelector('[data-v15="receipt-management"]'))return;const state=readState();main.insertAdjacentHTML('beforeend',`<div class="v15-grid">${receiptManagementPanel(state)}${presetLibraryPanel(state)}${savedSearchIntegrityPanel(state)}${recoveryReconciliationPanel(state)}${evidencePanel(state)}</div>`);}
function rerenderPanel(selector,html){const panel=document.querySelector(selector);if(panel)panel.outerHTML=html;}
function refreshReceiptPanel(){rerenderPanel('[data-v15="receipt-management"]',receiptManagementPanel(readState()));}
function refreshPresetPanel(){rerenderPanel('[data-v15="preset-library"]',presetLibraryPanel(readState()));}
function refreshEvidencePanel(){rerenderPanel('[data-v15="compatibility-store"]',evidencePanel(readState()));}

function captureCurrentEvidence(){
  const page=activePage(),flowMap={overview:'overview',learning:'learning',skills:'skills',portfolio:'portfolio'},flow=flowMap[page];
  const snapshot=compatibilityUsageSnapshot(document);
  if(flow&&snapshot.length){const signature=`${flow}:${snapshot.map((item)=>`${item.module}:${item.active?1:0}`).join('|')}`;if(!capturedEvidence.has(signature)){capturedEvidence.add(signature);const state=readState();state.settings=recordCompatibilityFlowSnapshot(state.settings||{},flow,snapshot);saveState(state);if(page==='overview')refreshEvidencePanel();}}
  if(window.innerWidth<=600&&snapshot.length){const signature=`mobile:${snapshot.map((item)=>`${item.module}:${item.active?1:0}`).join('|')}`;if(!capturedEvidence.has(signature)){capturedEvidence.add(signature);const state=readState();state.settings=recordCompatibilityFlowSnapshot(state.settings||{},'mobile',snapshot);saveState(state);if(page==='overview')refreshEvidencePanel();}}
}
function enhanceV15(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;addPanels();captureCurrentEvidence();});}

document.addEventListener('submit',async(event)=>{
  if(event.target.id==='v15ReceiptFilterForm'){
    event.preventDefault();const form=new FormData(event.target);receiptFilter={result:String(form.get('result')||''),format:String(form.get('format')||''),fromDate:String(form.get('fromDate')||''),toDate:String(form.get('toDate')||'')};refreshReceiptPanel();return;
  }
  if(event.target.id==='v15PresetCreateForm'){
    event.preventDefault();const form=new FormData(event.target),state=readState(),firstMax=Number(form.get('firstMax')),secondMax=Number(form.get('secondMax'));
    const result=saveCustomWorkloadPreset(state.settings||{},{name:String(form.get('name')||''),config:{firstMax,secondMax,labels:{none:'Không có kế hoạch',light:String(form.get('light')||''),moderate:String(form.get('moderate')||''),extended:String(form.get('extended')||'')}}});
    if(result.changed){state.settings=result.settings;auditedSave(state,'custom_workload_preset_saved',{presetId:result.preset.id});refreshPresetPanel();}else document.querySelector('#v15PresetImportStatus').textContent=`Preset bị từ chối: ${result.reason}.`;return;
  }
  if(event.target.id==='v15PresetImportForm'){
    event.preventDefault();const file=new FormData(event.target).get('file'),status=document.querySelector('#v15PresetImportStatus'),apply=document.querySelector('#v15ApplyPresetImport');pendingPresetPackage=null;apply.disabled=true;
    try{const parsed=JSON.parse(await file.text()),preview=previewCustomWorkloadPresetImport(parsed,readState().settings||{});if(!preview.valid){status.textContent='Package preset không đúng format/version.';return;}pendingPresetPackage=parsed;apply.disabled=false;status.textContent=`Preview: ${preview.total} preset · ${preview.accepted.length} có thể thêm · ${preview.rejected} bị từ chối · ${preview.duplicates} trùng.`;}catch{status.textContent='Không thể preview: JSON không hợp lệ.';}return;
  }
  if(event.target.id==='v15SearchIntegrityImportForm'){
    event.preventDefault();const file=new FormData(event.target).get('file'),status=document.querySelector('#v15SearchIntegrityStatus'),apply=document.querySelector('#v15ApplySearchIntegrityImport');pendingSearchIntegrityPackage=null;apply.disabled=true;
    let parsed,verification;try{parsed=JSON.parse(await file.text());verification=verifySavedSearchCriteriaPackageIntegrity(parsed);}catch{verification={valid:false,format:'invalid-json',algorithm:'SHA-256'};}
    const state=readState();state.settings=recordSavedSearchPackageVerificationReceipt(state.settings||{},verification);auditedSave(state,'saved_search_package_integrity_checked',{format:verification.format||'unknown',valid:Boolean(verification.valid)});
    if(!verification.valid){status.textContent='Checksum/manifest không hợp lệ. Import bị khóa.';return;}
    const preview=previewSavedSearchCriteriaImport(parsed,state.settings||{});if(!preview.valid){status.textContent='Criteria package không đúng format/version.';return;}pendingSearchIntegrityPackage=parsed;apply.disabled=false;status.textContent=`Checksum hợp lệ · ${preview.accepted} view có thể thêm · ${preview.duplicates} trùng · ${preview.strippedUnsafeDatasetEntries} dataset entry không an toàn đã loại.`;return;
  }
  if(event.target.id==='v15RecoveryReconcileForm'){
    event.preventDefault();const file=new FormData(event.target).get('file'),state=readState(),child=selectedChild(state),status=document.querySelector('#v15RecoveryReconcileStatus');if(!child||!(file instanceof File)){status.textContent='Thiếu hồ sơ hoặc file .ics.';return;}const preview=previewRecoveryIcsReconciliation(state,child.id,await file.text());status.textContent=preview.validCalendar?`Preview: local ${preview.localCount} · file ${preview.fileCount} · giống ${preview.same} · khác ${preview.different} · chỉ local ${preview.localOnly} · chỉ file ${preview.fileOnly}. Không áp dụng thay đổi.`:'File không có cấu trúc VCALENDAR hợp lệ; không có thay đổi nào được áp dụng.';return;
  }
},true);

document.addEventListener('click',async(event)=>{
  if(event.target.closest('#v15ExportReceipts')){downloadText('growup-safe-export-verification-receipts.json',JSON.stringify(buildExportVerificationReceiptPackage(readState().settings||{},receiptFilter),null,2));return;}
  if(event.target.closest('#v15ClearReceipts')){if(!confirm('Xóa toàn bộ lịch sử receipt xác minh cục bộ? Thao tác này không xóa file export.'))return;const state=readState();state.settings=clearExportVerificationReceipts(state.settings||{});auditedSave(state,'safe_export_receipts_cleared',{});refreshReceiptPanel();return;}
  const applyPreset=event.target.closest('[data-v15-apply-preset]');if(applyPreset){const state=readState(),result=applyCustomWorkloadPreset(state.settings||{},applyPreset.dataset.v15ApplyPreset);if(result.changed){state.settings=result.settings;auditedSave(state,'custom_workload_preset_applied',{presetId:result.preset.id});location.reload();}return;}
  const removePreset=event.target.closest('[data-v15-remove-preset]');if(removePreset){if(!confirm('Xóa preset tùy chỉnh này?'))return;const state=readState(),result=removeCustomWorkloadPreset(state.settings||{},removePreset.dataset.v15RemovePreset);if(result.changed){state.settings=result.settings;auditedSave(state,'custom_workload_preset_removed',{presetId:removePreset.dataset.v15RemovePreset});refreshPresetPanel();}return;}
  if(event.target.closest('#v15ExportPresetLibrary')){downloadText('growup-workload-preset-library.json',JSON.stringify(buildCustomWorkloadPresetPackage(readState().settings||{}),null,2));return;}
  if(event.target.closest('#v15ApplyPresetImport')){if(!pendingPresetPackage)return;const state=readState(),result=applyCustomWorkloadPresetImport(state.settings||{},pendingPresetPackage);if(result.changed){state.settings=result.settings;auditedSave(state,'custom_workload_preset_library_imported',{added:result.added,rejected:result.rejected,duplicates:result.duplicates});pendingPresetPackage=null;refreshPresetPanel();}return;}
  if(event.target.closest('#v15ExportSearchIntegrity')){downloadText('growup-saved-search-criteria-integrity.json',JSON.stringify(buildIntegritySavedSearchCriteriaPackage(readState().settings||{}),null,2));return;}
  if(event.target.closest('#v15ApplySearchIntegrityImport')){if(!pendingSearchIntegrityPackage)return;const state=readState(),verification=verifySavedSearchCriteriaPackageIntegrity(pendingSearchIntegrityPackage);if(!verification.valid)return;const result=applySavedSearchCriteriaImport(state.settings||{},pendingSearchIntegrityPackage);if(result.changed){state.settings=result.settings;auditedSave(state,'saved_search_integrity_package_imported',{added:result.added,skippedDuplicates:result.skippedDuplicates});pendingSearchIntegrityPackage=null;location.reload();}else document.querySelector('#v15SearchIntegrityStatus').textContent='Không có Saved Search mới để nhập.';return;}
  if(event.target.closest('#v15StoredEvidenceDryRun')){const state=readState(),coverage=compatibilityEvidenceCoverage(state.settings||{}),target=document.querySelector('#v15StoredEvidenceStatus');try{const source=await fetch('./src/runtime-entry.js',{cache:'no-store'}).then((response)=>response.text()),pkg=buildLegacyRetirementDryRun({evidenceRecords:coverage.records,runtimeEntrySource:source,definitions:legacyModuleDefinitions()});downloadText('growup-legacy-retirement-stored-evidence-dry-run.json',JSON.stringify(pkg,null,2));target.textContent=`Dry-run từ ${coverage.coveredFlows.length}/6 flow: ${pkg.candidateCount} candidate · removalsApplied=${pkg.removalsApplied}.`;}catch{target.textContent='Không tạo được dry-run; giữ nguyên toàn bộ legacy module.';}return;}
  if(event.target.closest('#v15ClearEvidence')){if(!confirm('Xóa evidence tương thích tích lũy cục bộ? Việc này không xóa module.'))return;const state=readState();state.settings=clearCompatibilityEvidence(state.settings||{});auditedSave(state,'compatibility_evidence_cleared',{});capturedEvidence.clear();refreshEvidencePanel();captureCurrentEvidence();return;}
});

document.addEventListener('change',(event)=>{
  if(event.target.closest('#v15PresetImportForm input[name="file"]')){pendingPresetPackage=null;const button=document.querySelector('#v15ApplyPresetImport');if(button)button.disabled=true;}
  if(event.target.closest('#v15SearchIntegrityImportForm input[name="file"]')){pendingSearchIntegrityPackage=null;const button=document.querySelector('#v15ApplySearchIntegrityImport');if(button)button.disabled=true;}
});
window.addEventListener('resize',()=>queueMicrotask(captureCurrentEvidence));
observer.observe(document.querySelector('#app'),{childList:true,subtree:true});enhanceV15();
