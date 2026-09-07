import { migrateState } from './core/schema.js';
import { saveState, appendAudit } from './core/store.js';
import { makeId, todayKey } from './core/model.js';
import { developmentDomainOptions, bindDevelopmentDomain, domainBindingOf, legacyRecordLabel } from './core/domain-binding.js';
import { familyPlanItemsToIcs } from './core/calendar.js';
import { searchSafeDevelopment, SAFE_SEARCH_DATASETS, SAFE_SEARCH_NOTE } from './core/local-search.js';
import { inspectEncryptedBackup, runRecoveryDrill, RECOVERY_DRILL_NOTE } from './core/recovery-inspector.js';
import { APP_VERSION, DATA_SCHEMA_VERSION, STABLE_ROLLBACK } from './core/release.js';
import { RC_PROFILE, evaluateReleaseCandidate, RC_GATE_NOTE } from './core/rc-gate.js';

const STORAGE_KEY='growup_mychildren_v1';
const RESUME_KEY='growup_v9_resume_nav';
const RESUME_TITLES={learning:'Học tập',skills:'Kỹ năng',portfolio:'Portfolio'};
let scheduled=false;
let resumeApplied=false;
let resumeScheduled=false;
const observer=new MutationObserver(()=>queueMicrotask(enhanceV9));

function readState(){try{return migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"version":5,"children":[]}'));}catch{return migrateState({version:5,children:[]});}}
function selectedChild(state){return state.children.find((child)=>child.id===state.selectedChildId)||state.children[0]||null;}
function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function download(name,text,type='text/plain;charset=utf-8'){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
function childIndex(state,child){return state.children.findIndex((item)=>item.id===child?.id);}
function dateLabel(value){if(!value)return '—';const d=new Date(`${value}T00:00:00`);return Number.isNaN(d.getTime())?escapeHtml(value):d.toLocaleDateString('vi-VN');}
function saveAndResume(state,type,details,page){sessionStorage.setItem(RESUME_KEY,page);saveState(appendAudit(state,type,details));location.reload();}

function applyResumeNavigation(){
  if(resumeApplied||resumeScheduled)return;
  const target=sessionStorage.getItem(RESUME_KEY);
  const expectedTitle=RESUME_TITLES[target];
  if(!target||!expectedTitle)return;
  resumeScheduled=true;
  let attempts=0;
  const tryResume=()=>{
    const currentTitle=document.querySelector('.topbar h1')?.textContent?.trim();
    if(currentTitle===expectedTitle){
      resumeApplied=true;
      resumeScheduled=false;
      sessionStorage.removeItem(RESUME_KEY);
      return;
    }
    const button=document.querySelector(`[data-nav="${target}"]`);
    if(button&&typeof button.onclick==='function')button.click();
    attempts+=1;
    if(attempts<60){requestAnimationFrame(tryResume);return;}
    resumeScheduled=false;
  };
  requestAnimationFrame(tryResume);
}

function domainSelectHtml(state){
  const options=developmentDomainOptions(state.settings?.developmentTaxonomy||{});
  return `<label class="v9-domain-field"><span>Miền phát triển (taxonomy)</span><select name="developmentDomainId"><option value="">Giữ phân loại cũ / chưa gắn</option>${options.map((domain)=>`<option value="${escapeHtml(domain.id)}">${escapeHtml(domain.label)}</option>`).join('')}</select><small>Chỉ áp dụng cho bản ghi mới; lưu snapshot nhãn + version taxonomy.</small></label>`;
}
function enhanceDomainForms(state){
  for(const id of ['learningForm','skillForm','portfolioForm']){
    const form=document.querySelector(`#${id}`);
    if(!form||form.querySelector('[name="developmentDomainId"]'))continue;
    const submit=form.querySelector('button[type="submit"],button:not([type])');
    if(submit)submit.insertAdjacentHTML('beforebegin',domainSelectHtml(state));
  }
}

function domainHistoryPanel(state,child){
  if(!child)return '';
  const config=state.settings?.developmentTaxonomy||{};
  const records=[...child.learningGoals.map((record)=>({type:'learningGoal',title:record.title,record})),...child.skills.map((record)=>({type:'skill',title:record.name,record})),...child.portfolio.map((record)=>({type:'portfolio',title:record.title,record}))];
  const bound=records.filter((entry)=>entry.record.developmentDomainId).slice(-12).reverse();
  return `<section class="card v9-panel" data-v9="domain-history"><div class="v9-heading"><div><span class="v9-kicker">Lượt 66 · Domain binding</span><h2>Liên kết miền phát triển</h2></div><span class="pill">${bound.length}/${records.length} gần đây</span></div>${bound.length?`<div class="v9-list">${bound.map((entry)=>{const binding=domainBindingOf(entry.record,config);return `<div class="v9-row"><div><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(binding.label||legacyRecordLabel(entry.record,entry.type))} · taxonomy ${escapeHtml(binding.taxonomyVersion||'legacy')}</small></div>${binding.taxonomyChanged?'<span class="pill">Nhãn hiện tại đã đổi</span>':'<span class="pill">Đã gắn</span>'}</div>`;}).join('')}</div>`:'<div class="empty">Các bản ghi cũ vẫn giữ nguyên. Bản ghi mới có thể gắn miền từ các form Học tập/Kỹ năng/Portfolio.</div>'}<div class="v9-note">GrowUP lưu label snapshot cùng domain ID để việc đổi taxonomy sau này không làm thay đổi ý nghĩa lịch sử của bản ghi.</div></section>`;
}
function familyCalendarPanel(state){
  const childMap=new Map(state.children.map((child)=>[child.id,child.name]));
  const items=(Array.isArray(state.settings?.familyPlanItems)?state.settings.familyPlanItems:[]).filter((item)=>item?.date&&item?.title&&item.date>=todayKey()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,30);
  return `<section class="card v9-panel" data-v9="family-calendar"><div class="v9-heading"><div><span class="v9-kicker">Lượt 67 · Calendar bridge</span><h2>Xuất kế hoạch gia đình sang .ics</h2></div><span class="pill">Chọn từng mục</span></div>${items.length?`<form id="v9FamilyIcsForm" class="form"><fieldset class="v9-fieldset"><legend>Mục muốn xuất</legend>${items.map((item)=>`<label><input type="checkbox" name="itemIds" value="${escapeHtml(item.id)}"> <span><strong>${escapeHtml(item.title)}</strong> · ${dateLabel(item.date)} · ${Number(item.minutes)||0} phút${childMap.get(item.childId)?` · ${escapeHtml(childMap.get(item.childId))}`:''}</span></label>`).join('')}</fieldset><button class="secondary" type="submit">Tải lịch .ics đã chọn</button></form>`:'<div class="empty">Chưa có kế hoạch gia đình sắp tới.</div>'}<div class="v9-note">Tệp .ics chỉ chứa tiêu đề, ngày và số phút dự kiến của chính các mục được chọn. Tên trẻ và dữ liệu khác không được ghi vào tệp.</div></section>`;
}
const DATASET_LABELS={learning:'Học tập',skills:'Kỹ năng',portfolio:'Portfolio',roadmap:'Roadmap',familyPlan:'Kế hoạch gia đình'};
function searchPanel(state){
  const childOptions=state.children.map((child)=>`<option value="${escapeHtml(child.id)}">${escapeHtml(child.name)}</option>`).join('');
  return `<section class="card v9-panel" data-v9="search"><div class="v9-heading"><div><span class="v9-kicker">Lượt 68 · Local search</span><h2>Tìm kiếm phát triển an toàn</h2></div><span class="pill">Local only</span></div><form id="v9SearchForm" class="form"><label><span>Từ khóa</span><input name="query" type="search" maxlength="100" required placeholder="Mục tiêu, dự án, kỹ năng, kế hoạch..."></label><div class="form-row"><label><span>Hồ sơ</span><select name="childId"><option value="">Tất cả hồ sơ</option>${childOptions}</select></label><label><span>Giới hạn kết quả</span><select name="limit"><option>20</option><option>50</option><option>100</option></select></label></div><fieldset class="v9-fieldset"><legend>Nhóm dữ liệu</legend>${SAFE_SEARCH_DATASETS.map((name)=>`<label><input type="checkbox" name="datasets" value="${name}" checked> ${escapeHtml(DATASET_LABELS[name]||name)}</label>`).join('')}</fieldset><button class="primary" type="submit">Tìm trong thiết bị</button></form><div id="v9SearchResults" class="v9-results"><div class="empty">Nhập từ khóa để tìm.</div></div><div class="v9-note">${escapeHtml(SAFE_SEARCH_NOTE)}</div></section>`;
}
function recoveryPanel(){return `<section class="card v9-panel" data-v9="recovery"><div class="v9-heading"><div><span class="v9-kicker">Lượt 69 · Recovery drill</span><h2>Kiểm tra backup mã hóa</h2></div><span class="pill">Không restore</span></div><form id="v9RecoveryForm" class="form"><label><span>Tệp encrypted backup</span><input type="file" name="file" accept="application/json,.json" required></label><label><span>Passphrase — chỉ cần khi chạy drill</span><input type="password" name="passphrase" minlength="10" autocomplete="current-password"></label><div class="actions"><button class="secondary" type="submit" data-recovery-action="inspect">Kiểm tra tương thích</button><button class="primary" type="submit" data-recovery-action="drill">Chạy recovery drill</button></div></form><div id="v9RecoveryResult" class="v9-results"><div class="empty">Chưa kiểm tra tệp.</div></div><div class="v9-note">${escapeHtml(RECOVERY_DRILL_NOTE)}</div></section>`;}
function rcPanel(){
  const status=evaluateReleaseCandidate({appVersion:APP_VERSION,dataSchemaVersion:DATA_SCHEMA_VERSION,serviceWorkerCache:RC_PROFILE.serviceWorkerCache,nodeMajor:22,playwrightVersion:RC_PROFILE.playwrightVersion,axePlaywrightVersion:RC_PROFILE.axePlaywrightVersion,rollbackCommit:STABLE_ROLLBACK.commit});
  return `<section class="card v9-panel" data-v9="rc"><div class="v9-heading"><div><span class="v9-kicker">Lượt 70 · Release candidate</span><h2>RC operational profile</h2></div><span class="pill">${status.ready?'Source profile khớp':'Có lệch cấu hình'}</span></div><div class="v9-rc-grid"><div><span>App</span><strong>v${escapeHtml(RC_PROFILE.appVersion)}</strong></div><div><span>Schema</span><strong>v${RC_PROFILE.dataSchemaVersion}</strong></div><div><span>SW cache</span><strong>${escapeHtml(RC_PROFILE.serviceWorkerCache)}</strong></div><div><span>Node</span><strong>${RC_PROFILE.nodeMajor}</strong></div><div><span>Playwright</span><strong>${escapeHtml(RC_PROFILE.playwrightVersion)}</strong></div><div><span>Axe</span><strong>${escapeHtml(RC_PROFILE.axePlaywrightVersion)}</strong></div></div><p class="v9-code">Rollback v${escapeHtml(RC_PROFILE.rollback.version)} · ${escapeHtml(RC_PROFILE.rollback.commit)}</p><div class="v9-note">${escapeHtml(RC_GATE_NOTE)} Final readiness vẫn do CI desktop/mobile + Axe quyết định trên head PR cuối.</div></section>`;
}
function overviewTools(state,child){return `<div class="v9-grid">${domainHistoryPanel(state,child)}${familyCalendarPanel(state)}${searchPanel(state)}${recoveryPanel()}${rcPanel()}</div>`;}
function enhanceV9(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;applyResumeNavigation();const state=readState();enhanceDomainForms(state);const main=document.querySelector('.main'),title=document.querySelector('.topbar h1')?.textContent?.trim();if(!main||title!=='Tổng quan phát triển'||document.querySelector('[data-v9="search"]'))return;main.insertAdjacentHTML('beforeend',overviewTools(state,selectedChild(state)));applyResumeNavigation();});
}

function saveDomainRecord(form){
  const state=readState(),child=selectedChild(state),idx=childIndex(state,child);if(!child||idx<0)return;
  const fd=new FormData(form),d=Object.fromEntries(fd),domainId=String(fd.get('developmentDomainId')||'');const config=state.settings?.developmentTaxonomy||{};const copy=structuredClone(child);let record=null,type='',resume='overview';
  if(form.id==='learningForm'){record=bindDevelopmentDomain({id:makeId('goal'),title:String(d.title||'').trim(),subject:d.subject||'',dueDate:d.dueDate||'',completed:false,createdAt:new Date().toISOString()},domainId,config);copy.learningGoals.push(record);type='learning_goal_created';resume='learning';}
  else if(form.id==='skillForm'){const name=String(d.name||'').trim(),old=copy.skills.find((skill)=>String(skill.name).toLowerCase()===name.toLowerCase());if(old){old.level=Number(d.level);old.date=todayKey();record=bindDevelopmentDomain(old,domainId,config);Object.assign(old,record);}else{record=bindDevelopmentDomain({id:makeId('skill'),name,level:Number(d.level),date:todayKey()},domainId,config);copy.skills.push(record);}type='skill_saved';resume='skills';}
  else if(form.id==='portfolioForm'){record=bindDevelopmentDomain({id:makeId('portfolio'),title:String(d.title||'').trim(),type:d.type||'',date:d.date||todayKey(),note:String(d.note||'').trim()},domainId,config);copy.portfolio.push(record);type='portfolio_created';resume='portfolio';}
  if(!record)return;state.children[idx]=copy;saveAndResume(state,type,{childId:child.id,status:record.developmentDomainId?'domain-bound':'legacy-label',taxonomyVersion:record.developmentTaxonomyVersion||null},resume);
}

document.addEventListener('submit',async(event)=>{
  if(['learningForm','skillForm','portfolioForm'].includes(event.target.id)){event.preventDefault();event.stopImmediatePropagation();saveDomainRecord(event.target);return;}
  if(event.target.id==='v9FamilyIcsForm'){event.preventDefault();const ids=new FormData(event.target).getAll('itemIds');if(!ids.length){alert('Hãy chọn ít nhất một mục kế hoạch để xuất lịch.');return;}const state=readState();download(`growup-family-plan-${todayKey()}.ics`,familyPlanItemsToIcs(state.settings?.familyPlanItems||[],{itemIds:ids}),'text/calendar;charset=utf-8');return;}
  if(event.target.id==='v9SearchForm'){event.preventDefault();const fd=new FormData(event.target),state=readState(),results=searchSafeDevelopment(state,String(fd.get('query')||''),{childId:String(fd.get('childId')||''),datasets:fd.getAll('datasets'),limit:Number(fd.get('limit'))||20}),target=document.querySelector('#v9SearchResults');if(!target)return;target.innerHTML=results.length?`<div class="v9-list">${results.map((result)=>`<div class="v9-row"><div><strong>${escapeHtml(result.title)}</strong><small>${escapeHtml(DATASET_LABELS[result.dataset]||result.dataset)}${result.subtitle?` · ${escapeHtml(result.subtitle)}`:''}${result.date?` · ${dateLabel(result.date)}`:''}</small></div>${result.childName?`<span class="pill">${escapeHtml(result.childName)}</span>`:''}</div>`).join('')}</div>`:'<div class="empty">Không tìm thấy kết quả trong các dataset an toàn đã chọn.</div>';return;}
  if(event.target.id==='v9RecoveryForm'){event.preventDefault();const fd=new FormData(event.target),file=fd.get('file'),action=event.submitter?.dataset?.recoveryAction||'inspect',target=document.querySelector('#v9RecoveryResult');if(!(file instanceof File)||!target)return;const text=await file.text();if(action==='inspect'){const result=inspectEncryptedBackup(text);target.innerHTML=`<div class="v9-inspection"><strong>${result.supported?'Tương thích':'Chưa tương thích'}</strong><span>Format: ${escapeHtml(result.format||'—')} · KDF: ${escapeHtml(result.kdf||'—')}/${escapeHtml(result.hash||'—')} · ${result.iterations||'—'} vòng · Cipher: ${escapeHtml(result.cipher||'—')}-${result.keyLength||'—'}</span>${result.issues?.length?`<small>${result.issues.map(escapeHtml).join(' · ')}</small>`:''}</div>`;}else{const passphrase=String(fd.get('passphrase')||'');if(passphrase.length<10){alert('Nhập passphrase backup để chạy recovery drill.');return;}const result=await runRecoveryDrill(text,passphrase);event.target.querySelector('input[name="passphrase"]').value='';target.innerHTML=result.success?`<div class="v9-inspection success"><strong>Recovery drill PASS</strong><span>Schema v${result.schemaVersion||'—'} · ${result.preview?.children||0} hồ sơ trẻ · ${result.preview?.goals||0} mục tiêu · ${result.preview?.healthRecords||0} bản ghi sức khỏe</span><small>Không có dữ liệu nào được restore.</small></div>`:`<div class="v9-inspection error"><strong>Recovery drill FAIL</strong><span>${escapeHtml(result.error||'Không thể kiểm tra.')}</span></div>`;}return;}
},true);

observer.observe(document.querySelector('#app'),{childList:true,subtree:true});
enhanceV9();
