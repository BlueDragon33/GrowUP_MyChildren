import { migrateState } from './core/schema.js';
import { saveState, appendAudit } from './core/store.js';
import { dataPortabilityMap, dataPortabilitySummary, portabilityModeLabel, DATA_PORTABILITY_NOTE } from './core/data-portability.js';
import { familyWorkloadWindows, WORKLOAD_WINDOWS_NOTE } from './core/workload-windows.js';
import { savedSearchViews, saveSearchView, removeSavedSearchView, searchViewFilters, SAVED_SEARCH_NOTE } from './core/saved-searches.js';
import { normalizeRecoverySchedule, updateRecoverySchedule, recoveryChecklistComplete, createRecoveryReminder, RECOVERY_SCHEDULE_NOTE } from './core/recovery-schedule.js';
import { compatibilityUsage, compatibilityRetirementPlan, markCompatibilityLayer, COMPATIBILITY_USAGE_NOTE } from './core/compatibility-usage.js';

const STORAGE_KEY='growup_mychildren_v1';
let scheduled=false;
const observer=new MutationObserver(()=>queueMicrotask(enhanceV11));

function readState(){try{return migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"version":5,"children":[]}'));}catch{return migrateState({version:5,children:[]});}}
function selectedChild(state){return state.children.find((child)=>child.id===state.selectedChildId)||state.children[0]||null;}
function esc(value=''){return String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function saveWithAudit(state,type,details={}){saveState(appendAudit(state,type,details));}
function fmtDate(value){if(!value)return '—';const d=new Date(`${value}T00:00:00`);return Number.isNaN(d.getTime())?esc(value):d.toLocaleDateString('vi-VN');}
function checked(value){return value?'checked':'';}

function portabilityPanel(){
  const items=dataPortabilityMap(),summary=dataPortabilitySummary();
  const groups=['safe-exportable','local-only','encrypted-backup-only','future-cloud-capable'];
  return `<section class="card v11-panel" data-v11="portability"><div class="v11-heading"><div><span class="v11-kicker">Lượt 76 · Data portability</span><h2>Bản đồ đường đi dữ liệu</h2></div><span class="pill">${items.length} module</span></div><div class="v11-summary-grid">${groups.map((mode)=>`<div><strong>${summary[mode]||0}</strong><span>${esc(portabilityModeLabel(mode))}</span></div>`).join('')}</div><div class="v11-table" role="region" aria-label="Bảng khả năng di chuyển dữ liệu" tabindex="0"><table><thead><tr><th>Module</th><th>Trạng thái</th><th>Giới hạn hiện tại</th></tr></thead><tbody>${items.map((item)=>`<tr><td><strong>${esc(item.label)}</strong><small>${esc(item.path)}</small></td><td><span class="pill">${esc(portabilityModeLabel(item.mode))}</span></td><td>${esc(item.detail)}</td></tr>`).join('')}</tbody></table></div><div class="v11-note">${esc(DATA_PORTABILITY_NOTE)}</div></section>`;
}

function workloadPanel(state){
  const windows=familyWorkloadWindows(state.settings?.familyPlanItems||[],new Date(),{windows:[7,14,30],maxMinutesPerDay:180});
  return `<section class="card v11-panel" data-v11="workload"><div class="v11-heading"><div><span class="v11-kicker">Lượt 77 · Workload windows</span><h2>Tải lịch gia đình 7/14/30 ngày</h2></div><span class="pill">Không xếp hạng trẻ</span></div><div class="v11-window-grid">${windows.map((item)=>`<article><strong>${item.days} ngày</strong><span>${item.totalItems} mục · ${item.totalMinutes} phút</span><small>${item.plannedDays} ngày có kế hoạch · ${item.freeDays} ngày chưa có kế hoạch</small><small>TB ${item.averageMinutesPerCalendarDay} phút/ngày lịch · còn ${item.remainingReferenceMinutes} phút theo mốc tham chiếu</small></article>`).join('')}</div><div class="v11-note">${esc(WORKLOAD_WINDOWS_NOTE)}</div></section>`;
}

function recoverySchedulePanel(state){
  const schedule=normalizeRecoverySchedule(state.settings?.recoverySchedule||{}),complete=recoveryChecklistComplete(schedule);
  return `<section class="card v11-panel" data-v11="recovery-schedule"><div class="v11-heading"><div><span class="v11-kicker">Lượt 79 · Recovery schedule</span><h2>Lịch kiểm tra khả năng khôi phục</h2></div><span class="pill">${complete?'Checklist đủ':'Checklist chưa đủ'}</span></div><form id="v11RecoveryScheduleForm" class="form"><label><input type="checkbox" name="enabled" style="width:auto" ${checked(schedule.enabled)}> Bật lịch recovery cục bộ</label><div class="form-row"><label><span>Ngày kiểm tra tiếp theo</span><input type="date" name="nextDate" value="${esc(schedule.nextDate)}"></label><label><span>Chu kỳ (ngày)</span><input type="number" name="intervalDays" min="7" max="365" value="${schedule.intervalDays}"></label></div><label><span>Nhãn nhắc nhở</span><input name="label" maxlength="80" value="${esc(schedule.label)}"></label><fieldset class="v11-fieldset"><legend>Checklist gần nhất</legend><label><input type="checkbox" name="backupLocated" ${checked(schedule.checklist.backupLocated)}> Đã xác định tệp backup</label><label><input type="checkbox" name="decryptTested" ${checked(schedule.checklist.decryptTested)}> Đã thử giải mã</label><label><input type="checkbox" name="checksumVerified" ${checked(schedule.checklist.checksumVerified)}> Đã kiểm checksum</label><label><input type="checkbox" name="restoreReviewed" ${checked(schedule.checklist.restoreReviewed)}> Đã xem lại quy trình restore</label></fieldset><div class="actions"><button class="secondary" type="submit" data-v11-recovery-action="save">Lưu lịch/checklist</button><button class="primary" type="submit" data-v11-recovery-action="save-reminder">Lưu và tạo nhắc nhở cục bộ</button></div></form><div class="v11-note">${esc(RECOVERY_SCHEDULE_NOTE)}</div></section>`;
}

function compatibilityPanelHtml(){
  const usage=compatibilityUsage(),plan=compatibilityRetirementPlan(),removable=plan.filter((item)=>item.removable).length;
  return `<section class="card v11-panel" data-v11="compatibility"><div class="v11-heading"><div><span class="v11-kicker">Lượt 80 · Compatibility evidence</span><h2>Retirement plan cho runtime cũ</h2></div><span class="pill">${removable} module đủ bằng chứng để loại</span></div><div class="v11-compat-list">${plan.map((item)=>`<div><strong>${esc(item.id)}</strong><span>${item.status==='active-observed'?'Đã quan sát nạp':'Chưa quan sát trong phiên'}</span><small>${item.removable?'Có thể xem xét loại':'Giữ lại — chưa đủ bằng chứng xóa'}</small></div>`).join('')}</div><p class="v11-code">Phiên hiện tại ghi nhận: ${usage.length?usage.map((item)=>`${esc(item.id)} ×${item.count}`).join(' · '):'chưa có marker'}</p><div class="v11-note">${esc(COMPATIBILITY_USAGE_NOTE)}</div></section>`;
}

function addOverviewPanels(){
  const main=document.querySelector('.main'),title=document.querySelector('.topbar h1')?.textContent?.trim();
  if(!main||title!=='Tổng quan phát triển'||document.querySelector('[data-v11="portability"]'))return;
  const state=readState();
  main.insertAdjacentHTML('beforeend',`<div class="v11-grid">${portabilityPanel()}${workloadPanel(state)}${recoverySchedulePanel(state)}${compatibilityPanelHtml()}</div>`);
}

function savedViewsHtml(state){
  const views=savedSearchViews(state.settings||{},12);
  return `<div class="v11-saved-searches" data-v11="saved-searches"><div class="v11-saved-head"><strong>Lượt 78 · Bộ lọc đã lưu</strong><span class="pill">${views.length}/12</span></div><div class="form-row"><label><span>Tên bộ lọc</span><input id="v11SearchViewLabel" maxlength="80" placeholder="Ví dụ: Portfolio AI tháng này"></label><button class="secondary" id="v11SaveSearchView" type="button">Lưu bộ lọc hiện tại</button></div>${views.length?`<div class="v11-saved-list">${views.map((view)=>`<div><span><strong>${esc(view.label)}</strong><small>${view.datasets.length?view.datasets.map(esc).join(', '):'mọi safe dataset'}${view.domainId?` · ${esc(view.domainId)}`:''}${view.fromDate||view.toDate?` · ${fmtDate(view.fromDate)} → ${fmtDate(view.toDate)}`:''}</small></span><span class="actions"><button class="secondary" type="button" data-v11-apply-view="${esc(view.id)}">Áp dụng</button><button class="danger" type="button" data-v11-delete-view="${esc(view.id)}">Xóa</button></span></div>`).join('')}</div>`:'<div class="empty">Chưa lưu bộ lọc nào.</div>'}<div class="v11-note">${esc(SAVED_SEARCH_NOTE)}</div></div>`;
}

function enhanceSavedSearches(){
  const form=document.querySelector('#v9SearchForm');
  if(!form||document.querySelector('[data-v11="saved-searches"]'))return;
  const state=readState();
  form.insertAdjacentHTML('afterend',savedViewsHtml(state));
}

function currentSearchView(form,label){
  const fd=new FormData(form);
  return {label,datasets:fd.getAll('datasets'),childId:String(fd.get('childId')||''),domainId:String(fd.get('domainId')||''),fromDate:String(fd.get('fromDate')||''),toDate:String(fd.get('toDate')||''),limit:Number(fd.get('limit'))||20};
}
function setControl(form,name,value){const control=form.elements.namedItem(name);if(control&&'value'in control)control.value=value||'';}
function applySearchView(view){
  const form=document.querySelector('#v9SearchForm');if(!form)return;
  const filters=searchViewFilters(view),wanted=new Set(filters.datasets);
  for(const box of form.querySelectorAll('input[name="datasets"]'))box.checked=!wanted.size||wanted.has(box.value);
  setControl(form,'childId',filters.childId);setControl(form,'domainId',filters.domainId);setControl(form,'fromDate',filters.fromDate);setControl(form,'toDate',filters.toDate);setControl(form,'limit',String(filters.limit));
  form.querySelector('input[name="query"]')?.focus();
}

function saveRecoverySchedule(form,createReminderRequested){
  const fd=new FormData(form),state=readState(),input={enabled:fd.has('enabled'),nextDate:String(fd.get('nextDate')||''),intervalDays:Number(fd.get('intervalDays'))||90,label:String(fd.get('label')||''),checklist:{backupLocated:fd.has('backupLocated'),decryptTested:fd.has('decryptTested'),checksumVerified:fd.has('checksumVerified'),restoreReviewed:fd.has('restoreReviewed')}};
  state.settings=updateRecoverySchedule(state.settings||{},input);
  let reminderCreated=false;
  if(createReminderRequested){
    const child=selectedChild(state),reminder=createRecoveryReminder(state.settings.recoverySchedule,{requested:true});
    if(child&&reminder){
      child.reminders=Array.isArray(child.reminders)?child.reminders:[];
      const duplicate=child.reminders.some((item)=>item.source==='recovery-schedule'&&!item.completed&&item.date===reminder.date&&item.title===reminder.title);
      if(!duplicate){child.reminders.push(reminder);reminderCreated=true;}
    }
  }
  saveWithAudit(state,'recovery_schedule_updated',{enabled:state.settings.recoverySchedule.enabled,reminderCreated});
  location.reload();
}

function refreshCompatibilityPanel(){
  const current=document.querySelector('[data-v11="compatibility"]');
  if(!current)return;
  const wrapper=document.createElement('div');wrapper.innerHTML=compatibilityPanelHtml();current.replaceWith(wrapper.firstElementChild);
}

function enhanceV11(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;markCompatibilityLayer('v11-runtime');addOverviewPanels();enhanceSavedSearches();});
}

document.addEventListener('click',(event)=>{
  const saveButton=event.target.closest('#v11SaveSearchView');
  if(saveButton){
    const form=document.querySelector('#v9SearchForm'),label=document.querySelector('#v11SearchViewLabel')?.value?.trim();if(!form||!label)return;
    const state=readState();state.settings=saveSearchView(state.settings||{},currentSearchView(form,label));saveWithAudit(state,'safe_search_view_saved',{labelLength:label.length});location.reload();return;
  }
  const applyButton=event.target.closest('[data-v11-apply-view]');
  if(applyButton){const state=readState(),view=savedSearchViews(state.settings||{}).find((item)=>item.id===applyButton.dataset.v11ApplyView);if(view)applySearchView(view);return;}
  const deleteButton=event.target.closest('[data-v11-delete-view]');
  if(deleteButton){const state=readState();state.settings=removeSavedSearchView(state.settings||{},deleteButton.dataset.v11DeleteView);saveWithAudit(state,'safe_search_view_deleted',{});location.reload();}
});

document.addEventListener('submit',(event)=>{
  if(event.target.id!=='v11RecoveryScheduleForm')return;
  event.preventDefault();
  const action=event.submitter?.dataset?.v11RecoveryAction||'save';
  saveRecoverySchedule(event.target,action==='save-reminder');
},true);

document.addEventListener('growup:compatibility-usage-updated',refreshCompatibilityPanel);
observer.observe(document.querySelector('#app'),{childList:true,subtree:true});
enhanceV11();
