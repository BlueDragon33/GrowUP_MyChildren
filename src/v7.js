import { migrateState } from './core/schema.js';
import { saveState, appendAudit } from './core/store.js';
import { scanStateConsistency } from './core/consistency.js';
import { normalizeRetentionPolicy, retentionPreview, applyRetentionRemoval } from './core/retention.js';
import { compareDevelopmentYears } from './core/yearly-summary.js';
import { buildPrintableReport, DEFAULT_PRINT_SECTIONS } from './core/print-report.js';
import { buildPortableArchive } from './core/archive.js';
import { todayKey } from './core/model.js';

const STORAGE_KEY = 'growup_mychildren_v1';
const observer = new MutationObserver(() => queueMicrotask(enhanceV7));
let scheduled = false;

function readState() {
  try { return migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"version":5,"children":[]}')); }
  catch { return migrateState({ version:5, children:[] }); }
}
function childOf(state) { return state.children.find((child)=>child.id===state.selectedChildId) || state.children[0] || null; }
function escapeHtml(value='') { return String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function download(name,text,type='application/json;charset=utf-8') { const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url); }
function persist(state,type,details={}) { state=appendAudit(state,type,details); saveState(state); location.reload(); }
function issueLabel(issue) {
  const labels={duplicate_id:'Trùng ID',malformed_date:'Ngày không hợp lệ',duplicate_habit_log:'Ngày thói quen bị lặp',dangling_evidence_reference:'Liên kết minh chứng mồ côi',dangling_selected_child:'Hồ sơ đang chọn không tồn tại',dangling_active_member:'Thành viên đang chọn không tồn tại'};
  return labels[issue.type]||issue.type;
}

function consistencyPanel(state) {
  const report=scanStateConsistency(state);
  const rows=report.issues.slice(0,20).map((entry)=>`<div class="v7-issue ${entry.severity}"><div><strong>${escapeHtml(issueLabel(entry))}</strong><small>${escapeHtml(entry.collection||'hệ thống')}${entry.id?` · ${escapeHtml(entry.id)}`:''}${entry.field?` · ${escapeHtml(entry.field)}`:''}</small></div><span>${entry.severity==='error'?'Lỗi':'Cảnh báo'}</span></div>`).join('');
  return `<section class="card v7-panel" data-v7="consistency"><div class="v7-heading"><div><span class="v7-kicker">Data consistency</span><h2>Kiểm tra tính nhất quán dữ liệu</h2></div><span class="pill">${report.issueCount} vấn đề</span></div><div class="v7-metrics"><div><strong>${report.errors}</strong><span>Lỗi</span></div><div><strong>${report.warnings}</strong><span>Cảnh báo</span></div><div><strong>${state.children.length}</strong><span>Hồ sơ trẻ</span></div></div>${rows?`<div class="v7-issues">${rows}</div>${report.issues.length>20?`<small>Còn ${report.issues.length-20} vấn đề khác; scanner không tự sửa dữ liệu.</small>`:''}`:'<div class="v7-ok">Không phát hiện lỗi nhất quán trong phạm vi scanner hiện tại.</div>'}<div class="v7-note">Scanner chỉ đọc và báo cáo. Không có thao tác sửa/xóa tự động.</div></section>`;
}

function retentionPanel(child,state) {
  const policy=normalizeRetentionPolicy(state.settings?.retentionPolicy||{keepYears:5,datasets:[]});
  const preview=retentionPreview(child,policy);
  const reminderCount=preview.candidates.completedReminders?.length||0;
  const physicalCount=preview.candidates.physicalActivities?.length||0;
  return `<section class="card v7-panel" data-v7="retention"><div class="v7-heading"><div><span class="v7-kicker">Manual retention</span><h2>Chính sách lưu giữ thủ công</h2></div><span class="pill">${preview.total} ứng viên</span></div><form id="v7RetentionForm" class="form"><label><span>Giữ tối thiểu</span><select name="keepYears">${[1,2,3,5,10].map((n)=>`<option value="${n}" ${policy.keepYears===n?'selected':''}>${n} năm</option>`).join('')}</select></label><fieldset class="v7-fieldset"><legend>Nhóm được phép xem xét xóa</legend><label><input type="checkbox" name="datasets" value="completedReminders" ${policy.datasets.includes('completedReminders')?'checked':''}> Nhắc nhở đã hoàn thành cũ (${reminderCount})</label><label><input type="checkbox" name="datasets" value="physicalActivities" ${policy.datasets.includes('physicalActivities')?'checked':''}> Bản ghi vận động cũ (${physicalCount})</label></fieldset><button class="secondary" type="submit">Lưu policy & xem lại preview</button></form><div class="v7-preview"><strong>Mốc cắt: ${escapeHtml(preview.cutoff)}</strong><span>Không có tự động xóa. Chỉ các bản ghi cũ hơn mốc và thuộc nhóm đã tích mới là ứng viên.</span></div>${preview.total?`<button class="danger" id="v7RetentionRemove" type="button">Archive rồi xóa thủ công ${preview.total} bản ghi</button>`:'<div class="v7-ok">Không có bản ghi nào phù hợp điều kiện xóa hiện tại.</div>'}<div class="v7-note">Trước khi xóa, hệ thống tải xuống một portable archive không chứa Health/Nutrition. Thao tác sau đó vẫn cần xác nhận riêng.</div></section>`;
}

function difference(value) { const n=Number(value)||0; return n>0?`+${n}`:String(n); }
function yearlyPanel(child) {
  const year=new Date().getFullYear(); const comparison=compareDevelopmentYears(child,year);
  const metrics=[['Sự kiện đã ghi','recordedEvents'],['Phút vận động','physicalMinutes'],['Lượt thói quen','habitLogs'],['Portfolio','portfolioRecords'],['Cập nhật kỹ năng','skillUpdates']];
  return `<section class="card v7-panel" data-v7="yearly"><div class="v7-heading"><div><span class="v7-kicker">Year over year</span><h2>Tổng hợp ${year} so với ${year-1}</h2></div><span class="pill">Mô tả dữ liệu</span></div><div class="v7-year-grid">${metrics.map(([label,key])=>`<div><span>${escapeHtml(label)}</span><strong>${difference(comparison.differences[key])}</strong><small>chênh lệch số lượng ghi nhận</small></div>`).join('')}</div><div class="v7-note">${escapeHtml(comparison.note)}</div></section>`;
}

const SECTION_LABELS={profile:'Hồ sơ phát triển',learning:'Mục tiêu học tập',skills:'Kỹ năng',habits:'Thói quen',portfolio:'Portfolio',roadmap:'Lộ trình',health:'Sức khỏe'};
function printPanel() {
  const defaultSet=new Set(DEFAULT_PRINT_SECTIONS);
  return `<section class="card v7-panel" data-v7="print-report"><div class="v7-heading"><div><span class="v7-kicker">Printable report</span><h2>Báo cáo phát triển để in</h2></div><span class="pill">Chọn dữ liệu</span></div><form id="v7PrintForm" class="form"><fieldset class="v7-fieldset"><legend>Phần muốn đưa vào báo cáo</legend>${Object.entries(SECTION_LABELS).map(([key,label])=>`<label class="${key==='health'?'v7-health-choice':''}"><input type="checkbox" name="sections" value="${key}" ${defaultSet.has(key)?'checked':''}> ${escapeHtml(label)}${key==='health'?' — chỉ khi chủ động chọn':''}</label>`).join('')}</fieldset><button class="primary" type="submit">Mở báo cáo để in</button></form><div class="v7-note">Sức khỏe mặc định không được chọn. Báo cáo chỉ chứa các phần được tích tại thời điểm tạo.</div></section>`;
}

function enhanceV7() {
  if(scheduled)return; scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;
    const main=document.querySelector('.main'),title=document.querySelector('.topbar h1')?.textContent?.trim(); if(!main||!title)return;
    const state=readState(),child=childOf(state);
    if(title==='Tổng quan phát triển'&&!document.querySelector('[data-v7="consistency"]')) main.insertAdjacentHTML('beforeend',consistencyPanel(state));
    if(child&&title==='Tổng quan phát triển'&&!document.querySelector('[data-v7="yearly"]')) main.insertAdjacentHTML('beforeend',yearlyPanel(child));
    if(child&&title==='Tổng quan phát triển'&&!document.querySelector('[data-v7="retention"]')) main.insertAdjacentHTML('beforeend',retentionPanel(child,state));
    if(child&&title==='Tổng quan phát triển'&&!document.querySelector('[data-v7="print-report"]')) main.insertAdjacentHTML('beforeend',printPanel());
  });
}

document.addEventListener('submit',(event)=>{
  if(event.target.id==='v7RetentionForm'){
    event.preventDefault(); const fd=new FormData(event.target); let state=readState();
    const policy=normalizeRetentionPolicy({keepYears:fd.get('keepYears'),datasets:fd.getAll('datasets'),updatedAt:new Date().toISOString()});
    state.settings={...state.settings,retentionPolicy:policy}; persist(state,'retention_policy_updated',{keepYears:policy.keepYears,datasets:policy.datasets}); return;
  }
  if(event.target.id==='v7PrintForm'){
    event.preventDefault(); const state=readState(),child=childOf(state); if(!child)return;
    const sections=new FormData(event.target).getAll('sections'); if(!sections.length){alert('Hãy chọn ít nhất một phần cho báo cáo.');return;}
    const printWindow=window.open('','_blank','noopener,noreferrer'); if(!printWindow){alert('Trình duyệt đang chặn cửa sổ báo cáo.');return;}
    const html=buildPrintableReport(child,{sections,title:`Báo cáo phát triển - ${child.name}`});
    printWindow.document.open(); printWindow.document.write(html); printWindow.document.close(); setTimeout(()=>{printWindow.focus();printWindow.print();},150); return;
  }
});

document.addEventListener('click',async(event)=>{
  if(!event.target.closest('#v7RetentionRemove'))return;
  let state=readState(); const child=childOf(state); if(!child)return;
  const policy=normalizeRetentionPolicy(state.settings?.retentionPolicy||{}); const preview=retentionPreview(child,policy); if(!preview.total)return;
  const confirmed=confirm(`Archive và xóa thủ công ${preview.total} bản ghi cũ của ${child.name}? Hành động này không xóa dữ liệu sức khỏe và không chạy tự động.`); if(!confirmed)return;
  const archive=await buildPortableArchive(state,{includeHealth:false,appVersion:'0.7.0'}); download(`growup-pre-retention-${todayKey()}.json`,JSON.stringify(archive,null,2));
  const result=applyRetentionRemoval(child,preview); if(!result.changed)return;
  const index=state.children.findIndex((item)=>item.id===child.id); state.children[index]=result.child;
  persist(state,'retention_manual_removal',{childId:child.id,removed:result.removed.length,cutoff:preview.cutoff});
});

observer.observe(document.querySelector('#app'),{childList:true,subtree:true});
enhanceV7();
