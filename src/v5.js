import { migrateState } from './core/schema.js';
import { saveState, appendAudit } from './core/store.js';
import { buildDevelopmentTimeline } from './core/timeline.js';
import { createEvidenceLink, validateEvidenceLink } from './core/evidence.js';
import { addPolicyMember, removePolicyMember } from './core/family-policy.js';
import { SAFE_DATASETS, exportDatasetCsv, exportSelectedJson } from './core/export.js';

const STORAGE_KEY = 'growup_mychildren_v1';
const observer = new MutationObserver(() => queueMicrotask(enhanceV5));
let scheduled = false;

function readState() {
  try { return migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"version":5,"children":[]}')); }
  catch { return migrateState({ version:5, children:[] }); }
}
function selectedChild(state) { return state.children.find((child)=>child.id===state.selectedChildId) || state.children[0] || null; }
function escapeHtml(value='') { return String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function safeName(value='growup') { return String(value).normalize('NFKD').replace(/[^\w.-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').toLowerCase() || 'growup'; }
function download(name,text,type='application/json;charset=utf-8') { const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url); }
function persistState(state,type,details={}) { state=appendAudit(state,type,details); saveState(state); location.reload(); }
function mutateChild(mutator,type) { let state=readState(); const child=selectedChild(state); if(!child)return; const index=state.children.findIndex((item)=>item.id===child.id); const copy=structuredClone(child); mutator(copy); state.children[index]=copy; persistState(state,type,{childId:copy.id}); }

const KIND_LABELS = { 'learning-goal':'Mục tiêu','skill':'Kỹ năng','health':'Sức khỏe','physical':'Thể chất','portfolio':'Portfolio','reminder':'Nhắc nhở','evidence':'Minh chứng' };

function timelinePanel(child) {
  const events=buildDevelopmentTimeline(child,{limit:18});
  const list=events.map((event)=>`<div class="v5-event ${event.sensitive?'sensitive':''}"><div class="v5-date">${escapeHtml(event.date)}</div><div><strong>${escapeHtml(event.title)}</strong><small>${escapeHtml(KIND_LABELS[event.kind]||event.kind)} · nguồn ${escapeHtml(event.source)}</small></div></div>`).join('');
  return `<section class="card v5-panel" data-v5="timeline"><div class="v5-heading"><div><span class="v5-kicker">Unified timeline</span><h2>Dòng thời gian phát triển</h2></div><span class="pill">${events.length} sự kiện gần nhất</span></div><div class="v5-timeline">${list||'<div class="empty">Chưa có sự kiện có ngày để tổng hợp.</div>'}</div><div class="v5-note">Timeline được dựng trực tiếp từ dữ liệu nguồn và không tạo bản ghi sao chép. Sự kiện sức khỏe không hiển thị số đo trong timeline.</div></section>`;
}

function policyEditorPanel(state) {
  const list=(state.family.members||[]).map((member)=>`<div class="item"><div class="item-main"><div class="item-title">${escapeHtml(member.displayName)}</div><small>${escapeHtml(member.role)} · ${escapeHtml(member.source||'local-policy')}</small></div>${member.role==='owner'?'<span class="pill">Được bảo vệ</span>':`<button class="secondary" data-v5-remove-member="${escapeHtml(member.id)}">Xóa policy</button>`}</div>`).join('');
  return `<section class="card v5-panel" data-v5="policy-editor"><div class="v5-heading"><div><span class="v5-kicker">Local policy editor</span><h2>Thành viên & vai trò dự kiến</h2></div><span class="pill">Chưa xác thực danh tính</span></div><div class="grid two-col"><form id="v5MemberForm" class="form"><label><span>Tên hiển thị</span><input name="displayName" required maxlength="80" placeholder="Bố, Mẹ, Người giám hộ..."></label><label><span>Vai trò policy</span><select name="role"><option value="parent">Parent</option><option value="guardian">Guardian</option><option value="viewer">Viewer</option></select></label><button class="primary">Thêm policy thành viên</button><small>Không thể tạo owner mới từ form cục bộ này và không thể xóa owner cuối cùng.</small></form><div class="list">${list}</div></div></section>`;
}

function evidencePanel(child) {
  const goals=child.learningGoals||[];
  const evidence=[...(child.attachments||[]).map((item)=>({type:'attachment',id:item.id,title:item.title||item.fileName||'Attachment'})),...(child.portfolio||[]).map((item)=>({type:'portfolio',id:item.id,title:item.title||'Portfolio'}))];
  const rows=(child.evidenceLinks||[]).map((link)=>{const resolved=validateEvidenceLink(child,link);return `<div class="item"><div class="item-main"><div class="item-title">${resolved.goal?escapeHtml(resolved.goal.title):'Mục tiêu không còn tồn tại'} → ${resolved.evidence?escapeHtml(resolved.evidence.title||resolved.evidence.fileName||'Minh chứng'):'Minh chứng không còn tồn tại'}</div><small>${escapeHtml(link.evidenceType)}${link.note?` · ${escapeHtml(link.note)}`:''}${resolved.valid?'':' · liên kết cần kiểm tra'}</small></div><button class="secondary" data-v5-remove-link="${escapeHtml(link.id)}">Xóa liên kết</button></div>`}).join('');
  const form=goals.length&&evidence.length?`<form id="v5EvidenceForm" class="form"><label><span>Mục tiêu</span><select name="goalId">${goals.map((goal)=>`<option value="${escapeHtml(goal.id)}">${escapeHtml(goal.title)}</option>`).join('')}</select></label><label><span>Minh chứng</span><select name="evidenceKey">${evidence.map((item)=>`<option value="${escapeHtml(item.type)}:${escapeHtml(item.id)}">${escapeHtml(item.title)} · ${escapeHtml(item.type)}</option>`).join('')}</select></label><label><span>Ghi chú liên kết</span><input name="note" maxlength="200"></label><button class="primary">Liên kết mục tiêu ↔ minh chứng</button></form>`:'<div class="empty">Cần ít nhất một mục tiêu học tập và một portfolio/attachment để tạo liên kết minh chứng.</div>';
  return `<section class="card v5-panel" data-v5="evidence-links"><div class="v5-heading"><div><span class="v5-kicker">Traceable evidence</span><h2>Mục tiêu ↔ minh chứng</h2></div><span class="pill">${child.evidenceLinks?.length||0} liên kết</span></div><div class="grid two-col">${form}<div class="list">${rows||'<div class="empty">Chưa có liên kết minh chứng.</div>'}</div></div></section>`;
}

function ensureExportTools() {
  const footer=document.querySelector('.sidebar-footer');
  if(!footer||document.querySelector('#v5Dataset'))return;
  footer.insertAdjacentHTML('beforeend', `<div class="v5-export"><label><span>Xuất dữ liệu chọn lọc</span><select id="v5Dataset">${SAFE_DATASETS.map((dataset)=>`<option value="${dataset}">${dataset}</option>`).join('')}</select></label><button id="v5ExportCsv" type="button">CSV hồ sơ đang xem</button><button id="v5ExportJson" type="button">JSON cả gia đình · nhóm đã chọn</button><small>Sức khỏe không nằm trong danh sách xuất nhanh v0.5.</small></div>`);
}

function enhanceV5() {
  if(scheduled)return; scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;
    const main=document.querySelector('.main'); const title=document.querySelector('.topbar h1')?.textContent?.trim();
    if(!main||!title)return;
    const state=readState(); const child=selectedChild(state);
    ensureExportTools();
    if(child&&title==='Tổng quan phát triển'&&!document.querySelector('[data-v5="timeline"]')) main.insertAdjacentHTML('beforeend',timelinePanel(child));
    if(title==='Tổng quan phát triển'&&!document.querySelector('[data-v5="policy-editor"]')) main.insertAdjacentHTML('beforeend',policyEditorPanel(state));
    if(child&&title==='Portfolio'&&!document.querySelector('[data-v5="evidence-links"]')) main.insertAdjacentHTML('beforeend',evidencePanel(child));
  });
}

document.addEventListener('submit',(event)=>{
  if(event.target.id==='v5MemberForm'){
    event.preventDefault(); const data=Object.fromEntries(new FormData(event.target)); let state=readState(); state.family=addPolicyMember(state.family,data); persistState(state,'family_policy_member_added');
  }
  if(event.target.id==='v5EvidenceForm'){
    event.preventDefault(); const data=Object.fromEntries(new FormData(event.target)); const [evidenceType,...idParts]=String(data.evidenceKey||'').split(':'); const evidenceId=idParts.join(':');
    try{const link=createEvidenceLink({goalId:data.goalId,evidenceType,evidenceId,note:data.note}); mutateChild((child)=>{child.evidenceLinks=[...(child.evidenceLinks||[]),link]},'evidence_link_added');}catch(error){alert(error.message);}
  }
});

document.addEventListener('click',(event)=>{
  const memberButton=event.target.closest('[data-v5-remove-member]');
  if(memberButton){let state=readState();try{state.family=removePolicyMember(state.family,memberButton.dataset.v5RemoveMember);persistState(state,'family_policy_member_removed');}catch(error){alert(error.message);}return;}
  const linkButton=event.target.closest('[data-v5-remove-link]');
  if(linkButton){mutateChild((child)=>{child.evidenceLinks=(child.evidenceLinks||[]).filter((link)=>link.id!==linkButton.dataset.v5RemoveLink)},'evidence_link_removed');return;}
  if(event.target.closest('#v5ExportCsv')){const state=readState(),child=selectedChild(state),dataset=document.querySelector('#v5Dataset')?.value;if(!child||!dataset)return;download(`${safeName(child.name)}-${dataset}.csv`,exportDatasetCsv(child,dataset),'text/csv;charset=utf-8');return;}
  if(event.target.closest('#v5ExportJson')){const state=readState(),dataset=document.querySelector('#v5Dataset')?.value;if(!dataset)return;download(`growup-${dataset}.json`,JSON.stringify(exportSelectedJson(state,[dataset]),null,2));}
});

observer.observe(document.querySelector('#app'),{childList:true,subtree:true});
enhanceV5();
