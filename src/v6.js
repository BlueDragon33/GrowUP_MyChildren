import { migrateState } from './core/schema.js';
import { saveState, appendAudit } from './core/store.js';
import { buildDevelopmentTimeline } from './core/timeline.js';
import { evidenceIntegritySummary, repairEvidenceLinks } from './core/evidence-repair.js';
import { buildPortableArchive, validatePortableArchive } from './core/archive.js';
import { filterTimeline, summarizeTimeline } from './core/timeline-filter.js';
import { todayKey } from './core/model.js';

const STORAGE_KEY = 'growup_mychildren_v1';
const observer = new MutationObserver(() => queueMicrotask(enhanceV6));
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
function mutateChild(mutator,type,details={}) { let state=readState(); const child=selectedChild(state); if(!child)return; const index=state.children.findIndex((item)=>item.id===child.id); const copy=structuredClone(child); mutator(copy); state.children[index]=copy; persistState(state,type,{childId:copy.id,...details}); }

const KIND_LABELS = { 'learning-goal':'Mục tiêu','skill':'Kỹ năng','health':'Sức khỏe','physical':'Thể chất','portfolio':'Portfolio','reminder':'Nhắc nhở','evidence':'Minh chứng' };

function evidenceRepairPanel(child) {
  const summary=evidenceIntegritySummary(child);
  const issues=summary.issues.map((issue)=>`<div class="item"><div class="item-main"><div class="item-title">${escapeHtml(issue.link.id)}</div><small>${issue.reasons.map((reason)=>reason==='goal_missing'?'Thiếu mục tiêu':'Thiếu minh chứng').join(' · ')}</small></div><span class="pill">Cần sửa</span></div>`).join('');
  return `<section class="card v6-panel" data-v6="evidence-repair"><div class="v6-heading"><div><span class="v6-kicker">Evidence integrity</span><h2>Kiểm tra liên kết minh chứng</h2></div><span class="pill">${summary.valid}/${summary.total} hợp lệ</span></div>${summary.orphaned?`<div class="notice">Phát hiện ${summary.orphaned} liên kết mồ côi do mục tiêu hoặc minh chứng nguồn đã bị xóa.</div><div class="list" style="margin-top:10px">${issues}</div><button class="danger" id="v6PruneEvidence" type="button" style="margin-top:12px">Xóa ${summary.orphaned} liên kết mồ côi</button>`:'<div class="v6-ok">Không phát hiện liên kết minh chứng mồ côi.</div>'}<div class="v6-note">Công cụ chỉ xóa quan hệ bị hỏng; không xóa mục tiêu, portfolio hay attachment nguồn.</div></section>`;
}

function archivePanel(state) {
  return `<section class="card v6-panel" data-v6="archive"><div class="v6-heading"><div><span class="v6-kicker">Long-term archive</span><h2>Lưu trữ dài hạn có manifest</h2></div><span class="pill">Schema ${state.version}</span></div><p>Archive v0.6 có manifest phiên bản, SHA-256 và kiểm tra tương thích. Mặc định không chứa dữ liệu sức khỏe/dinh dưỡng.</p><div class="actions"><button class="primary" id="v6ArchiveExport" type="button">Xuất archive an toàn</button><label class="secondary v6-file-label">Kiểm tra archive<input id="v6ArchiveInspect" type="file" accept="application/json" hidden></label></div><div id="v6ArchiveStatus" class="v6-note" aria-live="polite">Chưa kiểm tra archive.</div></section>`;
}

function timelineExplorerHtml(child, mode='month', reference=todayKey()) {
  const all=buildDevelopmentTimeline(child,{limit:1000});
  const filtered=filterTimeline(all,{mode,reference});
  const summary=summarizeTimeline(filtered.events);
  const kinds=Object.entries(summary.byKind).map(([kind,count])=>`${escapeHtml(KIND_LABELS[kind]||kind)} ${count}`).join(' · ');
  const rows=filtered.events.slice(0,30).map((event)=>`<div class="v6-event"><span>${escapeHtml(event.date)}</span><div><strong>${escapeHtml(event.title)}</strong><small>${escapeHtml(KIND_LABELS[event.kind]||event.kind)}</small></div></div>`).join('');
  return `<div class="v6-heading"><div><span class="v6-kicker">Period explorer</span><h2>Phân tích timeline theo giai đoạn</h2></div><span class="pill">${summary.total} sự kiện</span></div><div class="v6-period-controls"><label><span>Khoảng</span><select id="v6PeriodMode"><option value="month" ${mode==='month'?'selected':''}>Tháng</option><option value="quarter" ${mode==='quarter'?'selected':''}>Quý</option><option value="year" ${mode==='year'?'selected':''}>Năm</option></select></label><label><span>Ngày tham chiếu</span><input id="v6PeriodDate" type="date" value="${escapeHtml(reference)}"></label></div><div class="v6-summary"><strong>${escapeHtml(filtered.label)}</strong><small>${kinds||'Chưa có dữ liệu trong khoảng này'}</small></div><div class="v6-events">${rows||'<div class="empty">Không có sự kiện trong khoảng đã chọn.</div>'}</div>`;
}
function timelineExplorerPanel(child) { return `<section class="card v6-panel" data-v6="period-explorer">${timelineExplorerHtml(child)}</section>`; }
function rerenderPeriodExplorer() {
  const panel=document.querySelector('[data-v6="period-explorer"]'); if(!panel)return;
  const state=readState(),child=selectedChild(state); if(!child)return;
  const mode=document.querySelector('#v6PeriodMode')?.value||'month';
  const reference=document.querySelector('#v6PeriodDate')?.value||todayKey();
  panel.innerHTML=timelineExplorerHtml(child,mode,reference);
}

function ensureSkipLinkAndLandmark() {
  if(!document.querySelector('.v6-skip-link')) document.body.insertAdjacentHTML('afterbegin','<a class="v6-skip-link" href="#mainContent">Bỏ qua tới nội dung chính</a>');
  const main=document.querySelector('.main');
  if(main){main.id='mainContent';main.tabIndex=-1;}
  document.querySelectorAll('[data-nav]').forEach((button)=>button.setAttribute('aria-current',button.classList.contains('active')?'page':'false'));
}
function enhanceDialog(formSelector,closeSelector,titlePrefix) {
  const form=document.querySelector(formSelector); if(!form)return;
  const card=form.closest('.card'); if(!card||card.dataset.v6Dialog==='1')return;
  card.dataset.v6Dialog='1'; card.setAttribute('role','dialog'); card.setAttribute('aria-modal','true'); card.tabIndex=-1;
  const heading=card.querySelector('h2'); if(heading){heading.id=heading.id||`${titlePrefix}-title`;card.setAttribute('aria-labelledby',heading.id);}
  queueMicrotask(()=>form.querySelector('input,select,textarea,button')?.focus());
  card.addEventListener('keydown',(event)=>{if(event.key==='Escape'){event.preventDefault();document.querySelector(closeSelector)?.click();}});
}
function enhanceDialogs() { enhanceDialog('#childForm','#closeDialog','v6-child-dialog'); enhanceDialog('#importBackup','#closeBackup','v6-backup-dialog'); }

function enhanceV6() {
  if(scheduled)return; scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false; ensureSkipLinkAndLandmark(); enhanceDialogs();
    const main=document.querySelector('.main'),title=document.querySelector('.topbar h1')?.textContent?.trim();
    if(!main||!title)return;
    const state=readState(),child=selectedChild(state);
    if(title==='Tổng quan phát triển'&&!document.querySelector('[data-v6="archive"]')) main.insertAdjacentHTML('beforeend',archivePanel(state));
    if(child&&title==='Tổng quan phát triển'&&!document.querySelector('[data-v6="period-explorer"]')) main.insertAdjacentHTML('beforeend',timelineExplorerPanel(child));
    if(child&&title==='Portfolio'&&!document.querySelector('[data-v6="evidence-repair"]')) main.insertAdjacentHTML('beforeend',evidenceRepairPanel(child));
  });
}

document.addEventListener('change',(event)=>{
  if(event.target.matches('#v6PeriodMode,#v6PeriodDate')) rerenderPeriodExplorer();
});

document.addEventListener('click',async(event)=>{
  if(event.target.closest('#v6PruneEvidence')){
    const state=readState(),child=selectedChild(state); if(!child)return;
    const summary=evidenceIntegritySummary(child); if(!summary.orphaned)return;
    if(!confirm(`Xóa ${summary.orphaned} liên kết minh chứng mồ côi? Dữ liệu nguồn không bị xóa.`))return;
    const repaired=repairEvidenceLinks(child);
    mutateChild((copy)=>{copy.evidenceLinks=repaired.kept},'evidence_links_pruned',{removed:repaired.removed.length}); return;
  }
  if(event.target.closest('#v6ArchiveExport')){
    const state=readState(); const archive=await buildPortableArchive(state,{includeHealth:false,appVersion:'0.6.0'});
    download(`growup-archive-${todayKey()}.json`,JSON.stringify(archive,null,2)); return;
  }
});

document.addEventListener('change',async(event)=>{
  if(event.target.id!=='v6ArchiveInspect')return;
  const file=event.target.files?.[0]; if(!file)return;
  const status=document.querySelector('#v6ArchiveStatus');
  try{
    const result=await validatePortableArchive(await file.text());
    if(status) status.textContent=result.valid?`Archive hợp lệ · schema ${result.schemaVersion} · ${result.childCount} hồ sơ · health ${result.healthIncluded?'có':'không'}`:`Archive không dùng được · ${result.reason}`;
  }catch(error){if(status)status.textContent=`Archive lỗi: ${error.message}`;}
});

observer.observe(document.querySelector('#app'),{childList:true,subtree:true});
enhanceV6();
