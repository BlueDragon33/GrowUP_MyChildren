import { ageOnDate, makeId } from './core/model.js';
import { migrateState } from './core/schema.js';
import { saveState, appendAudit } from './core/store.js';
import { buildBackupEnvelope, verifyBackupEnvelope } from './core/backup.js';
import { summarizeReminders, notificationCapability } from './core/reminders.js';
import { templatesForAge } from './core/templates.js';
import { buildFamilyReport, reportToJson } from './core/report.js';
import { rolePermissions } from './core/roles.js';

const STORAGE_KEY = 'growup_mychildren_v1';
const observer = new MutationObserver(() => queueMicrotask(enhanceV4));
let scheduled = false;

function readState() {
  try { return migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"version":4,"children":[]}')); }
  catch { return migrateState({ version: 4, children: [] }); }
}
function selectedChild(state) { return state.children.find((child) => child.id === state.selectedChildId) || state.children[0] || null; }
function escapeHtml(value='') { return String(value).replace(/[&<>"']/g, (c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function download(name, text, type='application/json;charset=utf-8') { const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url); }
function saveChild(mutator,type) { let state=readState(); const child=selectedChild(state); if(!child)return; const index=state.children.findIndex((item)=>item.id===child.id); const copy=structuredClone(child); mutator(copy); state.children[index]=copy; state=appendAudit(state,type,{childId:copy.id}); saveState(state); location.reload(); }

function familyPolicyPanel(state) {
  const member = state.family.members.find((item)=>item.id===state.family.activeMemberId) || state.family.members[0];
  const permissions = rolePermissions(member?.role);
  return `<section class="card v4-panel" data-v4="family-policy"><div class="v4-heading"><div><span class="v4-kicker">Family policy</span><h2>Mô hình quyền gia đình</h2></div><span class="pill">${escapeHtml(member?.role||'viewer')}</span></div><div class="v4-policy-grid"><div><strong>${escapeHtml(member?.displayName||'Thành viên')}</strong><small>Policy cục bộ · chưa phải tài khoản xác thực</small></div><div><strong>${permissions.length}</strong><small>quyền trong policy hiện tại</small></div><div><strong>${state.family.members.length}</strong><small>thành viên policy</small></div></div><div class="v4-note">Lớp này chuẩn bị cho authentication/authorization thật; local-owner không được xem là bằng chứng đăng nhập.</div></section>`;
}

function goalTemplatePanel(child) {
  const {stage,templates}=templatesForAge(ageOnDate(child.dateOfBirth));
  return `<section class="card v4-panel" data-v4="goal-templates"><div class="v4-heading"><div><span class="v4-kicker">Age-stage templates</span><h2>Gợi ý mục tiêu · ${escapeHtml(stage.title)}</h2></div><span class="pill">Tùy chọn</span></div><div class="v4-template-list">${templates.map((item)=>`<div class="v4-template"><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.domain)}</small></div><button class="secondary" data-v4-goal-title="${escapeHtml(item.title)}" data-v4-goal-domain="${escapeHtml(item.domain)}">Thêm mục tiêu</button></div>`).join('')}</div><div class="v4-note">Đây là gợi ý theo giai đoạn, không phải chuẩn bắt buộc và không khóa trẻ vào một đầu ra nghề nghiệp.</div></section>`;
}

function reminderPanel(child) {
  const summary=summarizeReminders(child.reminders||[]);
  const capability=notificationCapability(window);
  return `<section class="card v4-panel" data-v4="reminder-safety"><div class="v4-heading"><div><span class="v4-kicker">Reminder engine</span><h2>Trạng thái nhắc việc</h2></div><span class="pill">${escapeHtml(capability.permission)}</span></div><div class="v4-reminder-grid"><div><strong>${summary.overdue}</strong><small>quá hạn</small></div><div><strong>${summary.today}</strong><small>hôm nay</small></div><div><strong>${summary.upcoming}</strong><small>sắp tới</small></div><div><strong>${summary.completed}</strong><small>đã xong</small></div></div>${capability.supported?`<button class="secondary" id="v4NotificationPermission" type="button">Kiểm tra/cấp quyền thông báo</button>`:'<div class="v4-note">Trình duyệt này không cung cấp Notification API cho ngữ cảnh hiện tại.</div>'}<div class="v4-note">v0.4 chỉ quản lý trạng thái và quyền trình duyệt; chưa hứa hẹn push nền khi ứng dụng đóng.</div></section>`;
}

function ensureUtilities() {
  const footer=document.querySelector('.sidebar-footer');
  if(!footer||document.querySelector('#v4IntegrityBackup'))return;
  footer.insertAdjacentHTML('beforeend', `<div class="v4-tools"><button id="v4IntegrityBackup" type="button">Backup + checksum</button><button id="v4RestoreBackup" type="button">Khôi phục kiểm tra</button><button id="v4ReportExport" type="button">Báo cáo JSON</button><input id="v4RestoreInput" type="file" accept="application/json,.json" hidden></div>`);
}

function enhanceV4() {
  if(scheduled)return; scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;
    const main=document.querySelector('.main');
    const title=document.querySelector('.topbar h1')?.textContent?.trim();
    if(!main||!title)return;
    const state=readState(); const child=selectedChild(state);
    ensureUtilities();
    if(title==='Tổng quan'&&!document.querySelector('[data-v4="family-policy"]')) main.insertAdjacentHTML('beforeend',familyPolicyPanel(state));
    if(child&&title==='Học tập'&&!document.querySelector('[data-v4="goal-templates"]')) main.insertAdjacentHTML('beforeend',goalTemplatePanel(child));
    if(child&&/Lịch/.test(title)&&!document.querySelector('[data-v4="reminder-safety"]')) main.insertAdjacentHTML('beforeend',reminderPanel(child));
  });
}

document.addEventListener('click', async (event)=>{
  const goalButton=event.target.closest('[data-v4-goal-title]');
  if(goalButton){
    saveChild((child)=>{child.learningGoals=[...(child.learningGoals||[]),{id:makeId('goal'),title:goalButton.dataset.v4GoalTitle,subject:goalButton.dataset.v4GoalDomain,dueDate:'',completed:false,source:'age-stage-template'}]},'goal_template_added');
    return;
  }
  if(event.target.closest('#v4IntegrityBackup')){
    const state=readState(); const envelope=await buildBackupEnvelope(state); download(`growup-integrity-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(envelope,null,2)); return;
  }
  if(event.target.closest('#v4RestoreBackup')){ document.querySelector('#v4RestoreInput')?.click(); return; }
  if(event.target.closest('#v4ReportExport')){
    const report=buildFamilyReport(readState(),{includeHealth:false}); download(`growup-longitudinal-report-${new Date().toISOString().slice(0,10)}.json`,reportToJson(report)); return;
  }
  if(event.target.closest('#v4NotificationPermission')){
    const capability=notificationCapability(window);
    if(!capability.supported){ alert('Notification API không khả dụng trong ngữ cảnh này.'); return; }
    const permission=await Notification.requestPermission();
    alert(`Quyền thông báo hiện tại: ${permission}. GrowUP v0.4 chưa gửi push nền khi ứng dụng đóng.`);
  }
});

document.addEventListener('change', async (event)=>{
  if(event.target.id!=='v4RestoreInput')return;
  const file=event.target.files?.[0]; if(!file)return;
  try{
    const verified=await verifyBackupEnvelope(await file.text());
    if(!verified.valid){ alert('Checksum không khớp. Tệp có thể đã bị thay đổi hoặc hỏng; không khôi phục.'); return; }
    const p=verified.preview;
    const accepted=confirm(`Backup hợp lệ. Schema v${p.schemaVersion}; ${p.children} hồ sơ trẻ; ${p.goals} mục tiêu; ${p.healthRecords} bản ghi sức khỏe; ${p.attachments} minh chứng. Khôi phục sẽ thay dữ liệu hiện tại. Tiếp tục?`);
    if(!accepted)return;
    let state=appendAudit(migrateState(verified.payload),'integrity_backup_restored',{checksum:verified.actualChecksum});
    saveState(state); location.reload();
  }catch(error){ alert(`Không thể khôi phục: ${error.message}`); }
  finally{ event.target.value=''; }
});

observer.observe(document.querySelector('#app'),{childList:true,subtree:true});
enhanceV4();
