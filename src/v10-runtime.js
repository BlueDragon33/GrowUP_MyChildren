import { migrateState } from './core/schema.js';
import { saveState, appendAudit } from './core/store.js';
import { developmentDomainCoverage, DOMAIN_COVERAGE_NOTE } from './core/domain-coverage.js';
import { familyPlanConflicts, rescheduleCandidates, FAMILY_CONFLICT_NOTE } from './core/family-conflicts.js';
import { searchSafeDevelopment, searchDeepLink, SAFE_SEARCH_DATASETS, SAFE_SEARCH_NOTE } from './core/local-search.js';
import { developmentDomainOptions } from './core/domain-binding.js';
import { inspectEncryptedBackup } from './core/recovery-inspector.js';
import { appendRecoveryHistory, recoveryHistory, RECOVERY_HISTORY_NOTE } from './core/recovery-history.js';

const STORAGE_KEY='growup_mychildren_v1';
const SEARCH_NAV_KEY='growup_v10_search_nav';
const PAGE_TITLES={overview:'Tổng quan phát triển',learning:'Học tập',skills:'Kỹ năng',portfolio:'Portfolio',roadmap:'Lộ trình tương lai'};
let scheduled=false;
let searchResumeRunning=false;
let recoveryWatchSignature='';
const observer=new MutationObserver(()=>queueMicrotask(enhanceV10));

function readState(){try{return migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"version":5,"children":[]}'));}catch{return migrateState({version:5,children:[]});}}
function esc(value=''){return String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmtDate(value){if(!value)return '—';const d=new Date(`${value}T00:00:00`);return Number.isNaN(d.getTime())?esc(value):d.toLocaleDateString('vi-VN');}
function saveWithAudit(state,type,details={}){saveState(appendAudit(state,type,details));}

function coveragePanel(state){
  const coverage=developmentDomainCoverage(state);
  return `<section class="card v10-panel" data-v10="coverage"><div class="v10-heading"><div><span class="v10-kicker">Lượt 71 · Coverage</span><h2>Độ phủ taxonomy</h2></div><span class="pill">${coverage.bound}/${coverage.total} bản ghi đã gắn</span></div><div class="v10-coverage-grid">${coverage.byDataset.map((item)=>`<div><strong>${esc(item.label)}</strong><span>${item.bound} đã gắn · ${item.unbound} chưa gắn</span></div>`).join('')}</div>${coverage.byDomain.length?`<div class="v10-tags">${coverage.byDomain.map((item)=>`<span class="pill">${esc(item.label)} · ${item.count}</span>`).join('')}</div>`:'<div class="empty">Chưa có bản ghi taxonomy để thống kê.</div>'}<div class="v10-note">${esc(DOMAIN_COVERAGE_NOTE)}</div></section>`;
}

function conflictPanel(state){
  const items=Array.isArray(state.settings?.familyPlanItems)?state.settings.familyPlanItems:[];
  const conflicts=familyPlanConflicts(items,{maxMinutesPerDay:180});
  return `<section class="card v10-panel" data-v10="conflicts"><div class="v10-heading"><div><span class="v10-kicker">Lượt 72 · Conflict assistant</span><h2>Xung đột kế hoạch gia đình</h2></div><span class="pill">${conflicts.length} ngày cần xem</span></div>${conflicts.length?`<div class="v10-list">${conflicts.slice(0,8).map((conflict)=>{const candidates=rescheduleCandidates(items,conflict.date,{spanDays:3,maxMinutesPerDay:180}).slice(0,3);return `<div class="v10-conflict"><strong>${fmtDate(conflict.date)} · ${conflict.totalItems} mục · ${conflict.totalMinutes} phút</strong><small>${esc(conflict.reasons.join(' · '))}</small><div class="v10-candidates">${candidates.map((candidate)=>`<span>${fmtDate(candidate.date)}: còn khoảng ${candidate.remainingMinutes} phút</span>`).join('')}</div></div>`;}).join('')}</div>`:'<div class="empty">Không phát hiện ngày có nhiều kế hoạch hoặc vượt ngưỡng 180 phút.</div>'}<div class="v10-note">${esc(FAMILY_CONFLICT_NOTE)}</div></section>`;
}

function historyPanel(state){
  const history=recoveryHistory(state.settings||{},12);
  return `<section class="card v10-panel" data-v10="recovery-history"><div class="v10-heading"><div><span class="v10-kicker">Lượt 74 · Recovery history</span><h2>Lịch sử kiểm tra khả năng khôi phục</h2></div><span class="pill">${history.length} lần gần nhất</span></div>${history.length?`<div class="v10-list">${history.map((item)=>`<div class="v10-history-row"><div><strong>${esc(item.status)}</strong><small>${item.at?new Date(item.at).toLocaleString('vi-VN'):'—'}</small></div><span>${esc(item.format||'—')} · schema ${item.schemaVersion||'—'}</span></div>`).join('')}</div>`:'<div class="empty">Chưa có recovery drill nào được ghi nhận.</div>'}<div class="v10-note">${esc(RECOVERY_HISTORY_NOTE)}</div></section>`;
}

function runtimePanel(){return `<section class="card v10-panel" data-v10="runtime"><div class="v10-heading"><div><span class="v10-kicker">Lượt 75 · Runtime hygiene</span><h2>Runtime hợp nhất</h2></div><span class="pill">v1.0 entrypoint</span></div><div class="v10-runtime-list"><span>1 module entrypoint: <code>src/runtime-entry.js</code></span><span>1 CSS entrypoint: <code>src/runtime.css</code></span><span>Các lớp v4–v10 vẫn là module tương thích nội bộ, không còn được nạp trực tiếp từ HTML.</span></div><div class="v10-note">Mục tiêu là giảm duplication ở lớp bootstrap trước; việc xóa module lịch sử chỉ thực hiện khi dependency gate chứng minh không còn import/runtime side effect.</div></section>`;}

function addOverviewPanels(){
  const main=document.querySelector('.main'),title=document.querySelector('.topbar h1')?.textContent?.trim();
  if(!main||title!=='Tổng quan phát triển'||document.querySelector('[data-v10="coverage"]'))return;
  const state=readState();
  main.insertAdjacentHTML('beforeend',`<div class="v10-grid">${coveragePanel(state)}${conflictPanel(state)}${historyPanel(state)}${runtimePanel()}</div>`);
}

function enhanceSearchForm(){
  const form=document.querySelector('#v9SearchForm');
  if(!form||form.dataset.v10Enhanced)return;
  form.dataset.v10Enhanced='true';
  const state=readState();
  const domains=developmentDomainOptions(state.settings?.developmentTaxonomy||{});
  const button=form.querySelector('button[type="submit"]');
  button?.insertAdjacentHTML('beforebegin',`<div class="form-row v10-search-filters"><label><span>Miền phát triển</span><select name="domainId"><option value="">Tất cả miền</option>${domains.map((domain)=>`<option value="${esc(domain.id)}">${esc(domain.label)}</option>`).join('')}</select></label><label><span>Từ ngày</span><input type="date" name="fromDate"></label></div><label><span>Đến ngày</span><input type="date" name="toDate"></label>`);
}

function renderSearchResults(form){
  const fd=new FormData(form),state=readState();
  const results=searchSafeDevelopment(state,String(fd.get('query')||''),{
    childId:String(fd.get('childId')||''),datasets:fd.getAll('datasets').filter((name)=>SAFE_SEARCH_DATASETS.includes(name)),limit:Number(fd.get('limit'))||20,
    domainId:String(fd.get('domainId')||''),fromDate:String(fd.get('fromDate')||''),toDate:String(fd.get('toDate')||'')
  });
  const target=document.querySelector('#v9SearchResults');
  if(!target)return;
  target.innerHTML=results.length?`<div class="v10-list">${results.map((result)=>`<div class="v10-search-row"><div><strong>${esc(result.title)}</strong><small>${esc(result.dataset)}${result.subtitle?` · ${esc(result.subtitle)}`:''}${result.date?` · ${fmtDate(result.date)}`:''}</small></div><button class="secondary" type="button" data-v10-search-link="${esc(result.dataset)}" data-child-id="${esc(result.childId)}" data-source-id="${esc(result.sourceId)}" data-page-key="${esc(result.pageKey)}" data-title="${esc(result.title)}">Mở nguồn</button></div>`).join('')}</div>`:'<div class="empty">Không tìm thấy kết quả trong phạm vi tìm kiếm an toàn.</div>';
}

function applySearchResume(){
  if(searchResumeRunning)return;
  let target;
  try{target=JSON.parse(sessionStorage.getItem(SEARCH_NAV_KEY)||'null');}catch{target=null;}
  if(!target?.pageKey)return;
  searchResumeRunning=true;
  const expected=PAGE_TITLES[target.pageKey]||PAGE_TITLES.overview;
  let attempts=0;
  const step=()=>{
    const title=document.querySelector('.topbar h1')?.textContent?.trim();
    if(title!==expected){const button=document.querySelector(`[data-nav="${target.pageKey}"]`);if(button&&typeof button.onclick==='function')button.click();}
    else{
      const candidates=[...document.querySelectorAll('.item-title')];
      const node=candidates.find((item)=>item.textContent?.trim()===target.title);
      if(node){const holder=node.closest('.item')||node;holder.classList.add('v10-search-target');holder.setAttribute('tabindex','-1');holder.scrollIntoView({block:'center',behavior:'instant'});holder.focus({preventScroll:true});}
      sessionStorage.removeItem(SEARCH_NAV_KEY);searchResumeRunning=false;return;
    }
    attempts+=1;if(attempts<80){requestAnimationFrame(step);return;}searchResumeRunning=false;
  };
  requestAnimationFrame(step);
}

async function recordRecoveryResult(){
  const result=document.querySelector('#v9RecoveryResult');
  const form=document.querySelector('#v9RecoveryForm');
  if(!result||!form)return;
  const text=result.textContent||'';
  if(!text.includes('Recovery drill PASS')&&!text.includes('Recovery drill FAIL'))return;
  const file=form.querySelector('input[type="file"]')?.files?.[0];
  const signature=`${file?.name||''}|${text}`;
  if(signature===recoveryWatchSignature)return;
  recoveryWatchSignature=signature;
  let format=null;
  if(file){try{format=inspectEncryptedBackup(await file.text()).format||null;}catch{format=null;}}
  const schemaMatch=text.match(/Schema v(\d+)/i);
  const state=readState();
  state.settings=appendRecoveryHistory(state.settings||{},{success:text.includes('Recovery drill PASS'),status:text.includes('Recovery drill PASS')?'PASS':'FAIL',format,schemaVersion:schemaMatch?Number(schemaMatch[1]):null});
  saveWithAudit(state,'recovery_drill_recorded',{status:text.includes('Recovery drill PASS')?'PASS':'FAIL',format:format||'unknown'});
}

function enhanceV10(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;addOverviewPanels();enhanceSearchForm();applySearchResume();recordRecoveryResult();});
}

document.addEventListener('submit',(event)=>{
  if(event.target.id!=='v9SearchForm')return;
  queueMicrotask(()=>renderSearchResults(event.target));
},true);

document.addEventListener('click',(event)=>{
  const button=event.target.closest('[data-v10-search-link]');
  if(!button)return;
  const state=readState();
  if(button.dataset.childId&&state.children.some((child)=>child.id===button.dataset.childId)) state.selectedChildId=button.dataset.childId;
  saveState(state);
  const link=searchDeepLink({dataset:button.dataset.v10SearchLink,childId:button.dataset.childId,sourceId:button.dataset.sourceId});
  sessionStorage.setItem(SEARCH_NAV_KEY,JSON.stringify({...link,pageKey:button.dataset.pageKey||link?.pageKey||'overview',title:button.dataset.title||''}));
  location.reload();
});

observer.observe(document.querySelector('#app'),{childList:true,subtree:true});
enhanceV10();
