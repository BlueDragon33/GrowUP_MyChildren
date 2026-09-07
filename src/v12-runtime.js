import { migrateState } from './core/schema.js';
import { saveState, appendAudit } from './core/store.js';
import { SAFE_DATASETS } from './core/export.js';
import { previewSafeExport, buildSafeExportPackage, EXPORT_WIZARD_NOTE } from './core/export-wizard.js';
import { familyWorkloadCalendar, WORKLOAD_CALENDAR_NOTE } from './core/workload-calendar.js';
import { savedSearchViews, renameSearchView, moveSearchView, resetSavedSearchViews, privacySafeSearchDefaults, SAVED_SEARCH_NOTE } from './core/saved-search.js';
import { recoveryReminderStatus, integrateRecoveryReminder, RECOVERY_REMINDER_NOTE } from './core/recovery-reminder.js';
import { compatibilityUsageSnapshot } from './core/runtime-compatibility.js';
import { COMPATIBILITY_REQUIRED_FLOWS, compatibilityEvidenceMatrix, COMPATIBILITY_EVIDENCE_NOTE } from './core/compatibility-evidence.js';

const STORAGE_KEY='growup_mychildren_v1';
let scheduled=false;
const observer=new MutationObserver(()=>queueMicrotask(enhanceV12));
function readState(){try{return migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"version":5,"children":[]}'));}catch{return migrateState({version:5,children:[]});}}
function esc(v=''){return String(v).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function saveAudit(state,type,details={}){saveState(appendAudit(state,type,details));}
function download(name,text,type='application/json;charset=utf-8'){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
function currentMonth(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
const DATASET_LABELS={learningGoals:'Mục tiêu học tập',skills:'Kỹ năng',portfolio:'Portfolio',attachments:'Minh chứng metadata',roadmap:'Roadmap',reminders:'Nhắc nhở'};

function exportPanel(state){return `<section class="card v12-panel" data-v12="export-wizard"><div class="v12-heading"><div><span class="v12-kicker">Lượt 81 · Export wizard</span><h2>Preview dữ liệu trước khi xuất</h2></div><span class="pill">Safe export v2</span></div><form id="v12ExportForm" class="form"><fieldset class="v12-fieldset"><legend>Hồ sơ sẽ rời thiết bị</legend>${state.children.map((child)=>`<label><input type="checkbox" name="childIds" value="${esc(child.id)}"> ${esc(child.name)}</label>`).join('')||'<span>Chưa có hồ sơ trẻ.</span>'}</fieldset><fieldset class="v12-fieldset"><legend>Dataset an toàn</legend>${SAFE_DATASETS.map((name)=>`<label><input type="checkbox" name="datasets" value="${esc(name)}"> ${esc(DATASET_LABELS[name]||name)}</label>`).join('')}</fieldset><div class="actions"><button class="secondary" type="submit" data-export-action="preview">Xem preview</button><button class="primary" type="submit" data-export-action="download">Tải gói đã preview</button></div></form><div id="v12ExportPreview" class="v12-results"><div class="empty">Chưa chọn dữ liệu.</div></div><div class="v12-note">${esc(EXPORT_WIZARD_NOTE)}</div></section>`;}

function workloadCalendarPanel(state){return `<section class="card v12-panel" data-v12="workload-calendar"><div class="v12-heading"><div><span class="v12-kicker">Lượt 82 · Workload calendar</span><h2>Lịch tải kế hoạch theo tháng</h2></div></div><label class="v12-month"><span>Tháng</span><input id="v12WorkloadMonth" type="month" value="${currentMonth()}"></label><div id="v12WorkloadCalendar"></div><div class="v12-note">${esc(WORKLOAD_CALENDAR_NOTE)}</div></section>`;}

function savedSearchAdminPanel(state){const views=savedSearchViews(state.settings||{});return `<section class="card v12-panel" data-v12="saved-search-admin"><div class="v12-heading"><div><span class="v12-kicker">Lượt 83 · Search management</span><h2>Quản lý bộ lọc đã lưu</h2></div><button type="button" class="secondary" id="v12ResetSearchViews">Reset an toàn</button></div>${views.length?`<div class="v12-list">${views.map((view,index)=>`<div class="v12-search-manage"><form data-v12-rename-search="${esc(view.id)}"><label><span>Tên</span><input name="name" value="${esc(view.name)}" maxlength="80" required></label><button class="secondary" type="submit">Đổi tên</button></form><div class="actions"><button type="button" class="secondary" data-v12-move-search="${esc(view.id)}" data-direction="up" ${index===0?'disabled':''}>↑</button><button type="button" class="secondary" data-v12-move-search="${esc(view.id)}" data-direction="down" ${index===views.length-1?'disabled':''}>↓</button></div></div>`).join('')}</div>`:'<div class="empty">Chưa có bộ lọc đã lưu.</div>'}<div class="v12-note">${esc(SAVED_SEARCH_NOTE)}</div></section>`;}

function recoveryReminderPanel(state){const candidate=state.children.length?recoveryReminderStatus(state,state.selectedChildId||state.children[0].id):null;return `<section class="card v12-panel" data-v12="recovery-reminder"><div class="v12-heading"><div><span class="v12-kicker">Lượt 84 · Reminder integration</span><h2>Đưa recovery drill vào danh sách nhắc</h2></div><span class="pill">${candidate?.candidate?.date?esc(candidate.candidate.date):'Chưa có lịch'}</span></div>${state.children.length?`<form id="v12RecoveryReminderForm" class="form"><label><span>Hồ sơ nhận nhắc</span><select name="childId">${state.children.map((child)=>`<option value="${esc(child.id)}" ${child.id===state.selectedChildId?'selected':''}>${esc(child.name)}</option>`).join('')}</select></label><button class="primary" type="submit">Thêm nhắc cục bộ</button></form>`:'<div class="empty">Cần có hồ sơ trẻ trước khi gắn nhắc.</div>'}<div id="v12RecoveryReminderStatus">${candidate?.existing?`<div class="v12-status">Đã có nhắc recovery cùng ngày · trạng thái: ${esc(candidate.state)}</div>`:''}</div><div class="v12-note">${esc(RECOVERY_REMINDER_NOTE)}</div></section>`;}

function compatibilityEvidencePanel(){const snapshot=compatibilityUsageSnapshot(document);const flow='overview';const records=snapshot.map((item)=>({module:item.module,flow,observed:true,active:item.active}));const matrix=compatibilityEvidenceMatrix(records);return `<section class="card v12-panel" data-v12="compatibility-evidence"><div class="v12-heading"><div><span class="v12-kicker">Lượt 85 · Evidence matrix</span><h2>Ma trận bằng chứng retirement</h2></div><span class="pill">0 module được retire tự động</span></div><div class="v12-flow-list">${COMPATIBILITY_REQUIRED_FLOWS.map((name)=>`<span>${esc(name)}</span>`).join('')}</div><div class="v12-list">${matrix.map((row)=>`<div><strong>${esc(row.module)}</strong><span>${row.complete?'đủ flow':'thiếu flow'} · ${row.activeAnywhere?'active-observed':'chưa active ở flow hiện tại'} · ${row.retirementEligible?'eligible':'giữ lại'}</span></div>`).join('')}</div><div class="v12-note">${esc(COMPATIBILITY_EVIDENCE_NOTE)} Browser gate sẽ thu thập đủ 6 flow trước khi bất kỳ removal nào được xét.</div></section>`;}

function renderWorkloadCalendar(state,month=currentMonth()){
  const target=document.querySelector('#v12WorkloadCalendar');if(!target)return;
  const calendar=familyWorkloadCalendar(state.settings?.familyPlanItems||[],`${month}-01`);
  target.innerHTML=`<div class="v12-heatmap" aria-hidden="true">${calendar.days.map((day)=>`<span class="v12-heat ${day.band}" title="${esc(day.text)}">${day.day}</span>`).join('')}</div><details class="v12-text-equivalent"><summary>Mô tả văn bản ${esc(calendar.monthLabel)}</summary><ul>${calendar.days.map((day)=>`<li tabindex="0">${esc(day.text)}</li>`).join('')}</ul></details>`;
}

function addPanels(){const main=document.querySelector('.main'),title=document.querySelector('.topbar h1')?.textContent?.trim();if(!main||title!=='Tổng quan phát triển'||document.querySelector('[data-v12="export-wizard"]'))return;const state=readState();main.insertAdjacentHTML('beforeend',`<div class="v12-grid">${exportPanel(state)}${workloadCalendarPanel(state)}${savedSearchAdminPanel(state)}${recoveryReminderPanel(state)}${compatibilityEvidencePanel()}</div>`);renderWorkloadCalendar(state);}
function enhanceV12(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;addPanels();});}

function exportSelection(form){const fd=new FormData(form);return {childIds:fd.getAll('childIds'),datasets:fd.getAll('datasets')};}
function renderExportPreview(preview){const target=document.querySelector('#v12ExportPreview');if(!target)return;target.innerHTML=`<div class="v12-preview"><strong>${preview.childCount} hồ sơ · ${preview.totalRecords} bản ghi</strong>${preview.datasets.map((row)=>`<div><span>${esc(DATASET_LABELS[row.dataset]||row.dataset)}: ${row.records}</span><small>Trường: ${row.fields.map(esc).join(', ')}</small></div>`).join('')}<small>Health: không · Nutrition: không</small></div>`;}

document.addEventListener('submit',(event)=>{
  if(event.target.id==='v12ExportForm'){
    event.preventDefault();const state=readState(),selection=exportSelection(event.target),preview=previewSafeExport(state,selection);renderExportPreview(preview);if(event.submitter?.dataset.exportAction==='download'){try{const payload=buildSafeExportPackage(state,selection);download(`growup-safe-export-${Date.now()}.json`,JSON.stringify(payload,null,2));saveAudit(state,'safe_export_wizard_downloaded',{children:preview.childCount,datasets:preview.datasetCount,records:preview.totalRecords});}catch(error){alert(error.message);}}return;
  }
  const rename=event.target.closest('[data-v12-rename-search]');
  if(rename){event.preventDefault();const state=readState(),name=new FormData(rename).get('name');state.settings=renameSearchView(state.settings||{},rename.dataset.v12RenameSearch,name);saveAudit(state,'safe_search_view_renamed',{});location.reload();return;}
  if(event.target.id==='v12RecoveryReminderForm'){
    event.preventDefault();const childId=String(new FormData(event.target).get('childId')||''),state=readState(),result=integrateRecoveryReminder(state,childId);if(result.created){saveAudit(result.state,'recovery_reminder_created',{childId,date:result.reminder.date,source:'recovery-drill'});location.reload();return;}const target=document.querySelector('#v12RecoveryReminderStatus');if(target)target.innerHTML=`<div class="v12-status">${result.deduplicated?'Nhắc cùng ngày đã tồn tại; không tạo bản trùng.':'Chưa thể tạo nhắc: '+esc(result.reason||'không rõ nguyên nhân')}</div>`;return;
  }
},true);

document.addEventListener('click',(event)=>{
  const move=event.target.closest('[data-v12-move-search]');
  if(move){const state=readState();state.settings=moveSearchView(state.settings||{},move.dataset.v12MoveSearch,move.dataset.direction);saveAudit(state,'safe_search_view_reordered',{});location.reload();return;}
  if(event.target.closest('#v12ResetSearchViews')){if(!confirm('Reset sẽ xóa toàn bộ bộ lọc đã lưu và khôi phục tiêu chí tìm kiếm an toàn mặc định. Tiếp tục?'))return;const state=readState();state.settings=resetSavedSearchViews(state.settings||{});saveAudit(state,'safe_search_views_reset',{datasets:privacySafeSearchDefaults().datasets.length});location.reload();}
});
document.addEventListener('change',(event)=>{if(event.target.id==='v12WorkloadMonth')renderWorkloadCalendar(readState(),event.target.value);});
observer.observe(document.querySelector('#app'),{childList:true,subtree:true});enhanceV12();
