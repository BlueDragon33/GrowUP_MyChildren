import { migrateState } from './core/schema.js';
import { saveState, appendAudit } from './core/store.js';
import { todayKey, makeId } from './core/model.js';
import { auditExplorerEntries, auditTypeOptions, auditEntriesToCsv, auditEntriesToJson } from './core/audit-explorer.js';
import { TAXONOMY_VERSION, normalizeTaxonomyConfig, resolvedDevelopmentDomains } from './core/taxonomy.js';
import { normalizeFamilyPlanItems, summarizeFamilyTime, FAMILY_PLANNING_NOTE } from './core/family-planning.js';
import { encryptPortableBackup, decryptPortableBackup, ENCRYPTED_BACKUP_RECOVERY_WARNING } from './core/encrypted-backup.js';
import { APP_VERSION, STABLE_ROLLBACK, RELEASE_NOTES, markReleaseSeen } from './core/release.js';

const STORAGE_KEY='growup_mychildren_v1';
let scheduled=false;
const observer=new MutationObserver(()=>queueMicrotask(enhanceV8));

function readState(){try{return migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"version":5,"children":[]}'));}catch{return migrateState({version:5,children:[]});}}
function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function download(name,text,type='application/json;charset=utf-8'){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
function persist(state,type,details={}){const next=appendAudit(state,type,details);saveState(next);location.reload();}
function dateLabel(value){if(!value)return '—';const date=new Date(`${value}T00:00:00`);return Number.isNaN(date.getTime())?escapeHtml(value):date.toLocaleDateString('vi-VN');}

function auditPanel(state){
  const entries=auditExplorerEntries(state,{limit:12});
  const types=auditTypeOptions(state);
  const rows=entries.map((entry)=>`<div class="v8-audit-row"><div><strong>${escapeHtml(entry.type)}</strong><small>${escapeHtml(entry.at?new Date(entry.at).toLocaleString('vi-VN'):'—')}</small></div><span>${entry.childId?'Theo hồ sơ trẻ':'Hệ thống'}</span></div>`).join('');
  return `<section class="card v8-panel" data-v8="audit"><div class="v8-heading"><div><span class="v8-kicker">Lượt 61 · Privacy-safe audit</span><h2>Nhật ký thay đổi</h2></div><span class="pill">${entries.length}/${state.auditLog?.length||0}</span></div><label><span>Lọc loại sự kiện</span><select id="v8AuditType"><option value="">Tất cả</option>${types.map((type)=>`<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('')}</select></label><div class="actions v8-actions"><button class="secondary" id="v8AuditJson" type="button">Xuất JSON an toàn</button><button class="secondary" id="v8AuditCsv" type="button">Xuất CSV an toàn</button></div><div id="v8AuditRows" class="v8-audit-list">${rows||'<div class="empty">Chưa có nhật ký.</div>'}</div><div class="v8-note">Chỉ xuất metadata theo allowlist. Ghi chú, số đo sức khỏe, dinh dưỡng và nội dung tự do không được đưa vào audit export.</div></section>`;
}

function taxonomyPanel(state){
  const config=normalizeTaxonomyConfig(state.settings?.developmentTaxonomy||{});
  const domains=resolvedDevelopmentDomains(config).filter((domain)=>domain.source==='default');
  return `<section class="card v8-panel" data-v8="taxonomy"><div class="v8-heading"><div><span class="v8-kicker">Lượt 62 · Taxonomy ${TAXONOMY_VERSION}</span><h2>Miền phát triển có phiên bản</h2></div><span class="pill">Schema dữ liệu vẫn v5</span></div><form id="v8TaxonomyForm" class="form"><div class="v8-domain-list">${domains.map((domain)=>`<div class="v8-domain"><label class="v8-domain-toggle"><input type="checkbox" name="enabled" value="${domain.id}" ${domain.enabled?'checked':''}><span>Bật</span></label><label><span>${escapeHtml(domain.description)}</span><input name="label-${domain.id}" value="${escapeHtml(domain.label)}" maxlength="60"></label></div>`).join('')}</div><div class="form-row"><label><span>Thêm miền tùy chỉnh (không bắt buộc)</span><input name="customLabel" maxlength="60" placeholder="Ví dụ: Âm nhạc chuyên sâu"></label><label><span>Mô tả</span><input name="customDescription" maxlength="180" placeholder="Phạm vi theo dõi"></label></div><button class="secondary" type="submit">Lưu cấu hình taxonomy</button></form><div class="v8-note">Đổi tên/bật/tắt taxonomy chỉ ảnh hưởng cách tổ chức từ hiện tại; không ghi đè hay đổi nhãn các bản ghi lịch sử đã lưu.</div></section>`;
}

function familyPlanningPanel(state){
  const items=normalizeFamilyPlanItems(state.settings?.familyPlanItems||[],state.children.map((child)=>child.id));
  const summaries=summarizeFamilyTime(state.children,items,todayKey(),30);
  const summaryHtml=summaries.map((summary)=>`<div class="v8-family-summary"><strong>${escapeHtml(summary.childName)}</strong><span>${summary.commitments} lịch · ${summary.plannedMinutes} phút · ${summary.daysWithPlans} ngày có kế hoạch</span></div>`).join('');
  const upcoming=items.filter((item)=>item.date>=todayKey()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,12);
  const childOptions=state.children.map((child)=>`<option value="${child.id}">${escapeHtml(child.name)}</option>`).join('');
  return `<section class="card v8-panel" data-v8="family-plan"><div class="v8-heading"><div><span class="v8-kicker">Lượt 63 · Family time</span><h2>Kế hoạch nguồn lực gia đình</h2></div><span class="pill">30 ngày</span></div>${state.children.length?`<form id="v8FamilyPlanForm" class="form"><div class="form-row"><label><span>Hồ sơ trẻ</span><select name="childId">${childOptions}</select></label><label><span>Ngày</span><input type="date" name="date" value="${todayKey()}" required></label></div><label><span>Nội dung lịch</span><input name="title" maxlength="120" required placeholder="Học, thể thao, hoạt động gia đình..."></label><label><span>Thời lượng dự kiến (phút)</span><input name="minutes" type="number" min="0" max="1440" value="60"></label><button class="secondary" type="submit">Thêm kế hoạch</button></form><div class="v8-family-grid">${summaryHtml}</div><div class="v8-plan-list">${upcoming.map((item)=>`<div class="item"><div><div class="item-title">${escapeHtml(item.title)}</div><small>${dateLabel(item.date)} · ${item.minutes} phút</small></div><button class="secondary" data-v8-plan-remove="${escapeHtml(item.id)}" type="button">Xóa</button></div>`).join('')||'<div class="empty">Chưa có kế hoạch gia đình.</div>'}</div>`:'<div class="empty">Cần có ít nhất một hồ sơ trẻ để lập kế hoạch.</div>'}<div class="v8-note">${escapeHtml(FAMILY_PLANNING_NOTE)}</div></section>`;
}

function encryptedBackupPanel(){
  return `<section class="card v8-panel" data-v8="encrypted-backup"><div class="v8-heading"><div><span class="v8-kicker">Lượt 64 · Web Crypto</span><h2>Backup mã hóa bằng mật khẩu</h2></div><span class="pill">AES-GCM 256</span></div><form id="v8EncryptForm" class="form"><label><span>Mật khẩu backup (ít nhất 10 ký tự)</span><input type="password" name="passphrase" minlength="10" autocomplete="new-password" required></label><label><span>Nhập lại mật khẩu</span><input type="password" name="confirmPassphrase" minlength="10" autocomplete="new-password" required></label><button class="primary" type="submit">Tạo backup mã hóa</button></form><hr class="v8-divider"><form id="v8DecryptForm" class="form"><label><span>Tệp backup mã hóa</span><input type="file" name="file" accept="application/json,.json" required></label><label><span>Mật khẩu giải mã</span><input type="password" name="passphrase" minlength="10" autocomplete="current-password" required></label><button class="secondary" type="submit">Kiểm tra & khôi phục backup</button></form><div class="v8-warning">${escapeHtml(ENCRYPTED_BACKUP_RECOVERY_WARNING)}</div></section>`;
}

function releasePanel(state){
  const seen=state.settings?.lastSeenAppVersion===APP_VERSION;
  return `<section class="card v8-panel" data-v8="release"><div class="v8-heading"><div><span class="v8-kicker">Lượt 65 · Release hardening</span><h2>Phiên bản & cập nhật PWA</h2></div><span class="pill">v${APP_VERSION}</span></div><div class="v8-release-grid"><div><span>Phiên bản hiện tại</span><strong>v${APP_VERSION}</strong></div><div><span>Schema dữ liệu</span><strong>v5</strong></div><div><span>Rollback ổn định</span><strong>v${STABLE_ROLLBACK.version}</strong></div></div><p class="v8-code">${escapeHtml(STABLE_ROLLBACK.commit)}</p><div class="actions"><button class="secondary" id="v8CheckUpdate" type="button">Kiểm tra cập nhật PWA</button><button class="secondary" id="v8MarkSeen" type="button" ${seen?'disabled':''}>${seen?'Đã xem v0.8':'Đánh dấu đã xem bản này'}</button></div><div id="v8UpdateStatus" class="v8-note">Rollback là điểm Git ổn định đã qua CI; ứng dụng không âm thầm hạ phiên bản hoặc đổi dữ liệu.</div><details class="v8-changelog"><summary>Changelog gần đây</summary>${RELEASE_NOTES.map((note)=>`<div><strong>v${note.version}</strong> · ${escapeHtml(note.rounds)}<br><span>${escapeHtml(note.title)}</span></div>`).join('')}</details></section>`;
}

function renderV8(state){return `<div class="v8-grid">${auditPanel(state)}${taxonomyPanel(state)}${familyPlanningPanel(state)}${encryptedBackupPanel()}${releasePanel(state)}</div>`;}

function enhanceV8(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;const main=document.querySelector('.main');const title=document.querySelector('.topbar h1')?.textContent?.trim();if(!main||title!=='Tổng quan phát triển'||document.querySelector('[data-v8="audit"]'))return;const state=readState();main.insertAdjacentHTML('beforeend',renderV8(state));});
}

function filteredAudit(state){const type=document.querySelector('#v8AuditType')?.value||'';return auditExplorerEntries(state,{type,limit:200});}

document.addEventListener('change',(event)=>{
  if(event.target.id!=='v8AuditType')return;
  const state=readState();const entries=filteredAudit(state);const target=document.querySelector('#v8AuditRows');if(!target)return;
  target.innerHTML=entries.slice(0,12).map((entry)=>`<div class="v8-audit-row"><div><strong>${escapeHtml(entry.type)}</strong><small>${escapeHtml(entry.at?new Date(entry.at).toLocaleString('vi-VN'):'—')}</small></div><span>${entry.childId?'Theo hồ sơ trẻ':'Hệ thống'}</span></div>`).join('')||'<div class="empty">Không có sự kiện phù hợp.</div>';
});

document.addEventListener('submit',async(event)=>{
  if(event.target.id==='v8TaxonomyForm'){
    event.preventDefault();const fd=new FormData(event.target);let state=readState();const enabled=new Set(fd.getAll('enabled'));const labels={};
    for(const domain of resolvedDevelopmentDomains(state.settings?.developmentTaxonomy||{}).filter((item)=>item.source==='default')){labels[domain.id]=String(fd.get(`label-${domain.id}`)||domain.label).trim().slice(0,60);}
    const previous=normalizeTaxonomyConfig(state.settings?.developmentTaxonomy||{});const customLabel=String(fd.get('customLabel')||'').trim();const customDomains=[...previous.customDomains];
    if(customLabel)customDomains.push({id:`${Date.now()}`,label:customLabel,description:String(fd.get('customDescription')||'').trim()});
    state.settings={...state.settings,developmentTaxonomy:normalizeTaxonomyConfig({taxonomyVersion:TAXONOMY_VERSION,labels,disabledDomainIds:Object.keys(labels).filter((id)=>!enabled.has(id)),customDomains,updatedAt:new Date().toISOString()})};
    persist(state,'development_taxonomy_updated',{taxonomyVersion:TAXONOMY_VERSION,count:resolvedDevelopmentDomains(state.settings.developmentTaxonomy).length});return;
  }
  if(event.target.id==='v8FamilyPlanForm'){
    event.preventDefault();const fd=new FormData(event.target);let state=readState();const items=normalizeFamilyPlanItems(state.settings?.familyPlanItems||[],state.children.map((child)=>child.id));items.push({id:makeId('plan'),childId:String(fd.get('childId')),date:String(fd.get('date')),title:String(fd.get('title')).trim(),minutes:Number(fd.get('minutes'))||0,note:''});
    state.settings={...state.settings,familyPlanItems:normalizeFamilyPlanItems(items,state.children.map((child)=>child.id))};persist(state,'family_plan_item_added',{childId:String(fd.get('childId')),count:state.settings.familyPlanItems.length});return;
  }
  if(event.target.id==='v8EncryptForm'){
    event.preventDefault();const fd=new FormData(event.target);const pass=String(fd.get('passphrase')||''),confirmPass=String(fd.get('confirmPassphrase')||'');if(pass!==confirmPass){alert('Hai lần nhập mật khẩu không khớp.');return;}
    try{const encrypted=await encryptPortableBackup(readState(),pass);download(`growup-encrypted-${todayKey()}.json`,JSON.stringify(encrypted,null,2));event.target.reset();alert('Đã tạo backup mã hóa. Hãy lưu mật khẩu ở nơi an toàn; GrowUP không lưu mật khẩu này.');}catch(error){alert(error.message||'Không thể tạo backup mã hóa.');}return;
  }
  if(event.target.id==='v8DecryptForm'){
    event.preventDefault();const fd=new FormData(event.target);const file=fd.get('file'),pass=String(fd.get('passphrase')||'');if(!(file instanceof File)){alert('Hãy chọn tệp backup mã hóa.');return;}
    try{const verified=await decryptPortableBackup(await file.text(),pass);const preview=verified.preview;const ok=confirm(`Backup hợp lệ: ${preview.children} hồ sơ trẻ, ${preview.goals} mục tiêu, ${preview.healthRecords} bản ghi sức khỏe. Khôi phục sẽ thay thế dữ liệu cục bộ hiện tại. Tiếp tục?`);if(!ok)return;let restored=migrateState(verified.payload);restored=appendAudit(restored,'encrypted_backup_restored',{schemaVersion:restored.version,count:restored.children.length});saveState(restored);event.target.reset();location.reload();}catch(error){alert(error.message||'Không thể giải mã/khôi phục backup.');}return;
  }
});

document.addEventListener('click',async(event)=>{
  const remove=event.target.closest('[data-v8-plan-remove]');if(remove){let state=readState();const id=remove.dataset.v8PlanRemove;const items=normalizeFamilyPlanItems(state.settings?.familyPlanItems||[],state.children.map((child)=>child.id));if(!confirm('Xóa mục kế hoạch gia đình này?'))return;state.settings={...state.settings,familyPlanItems:items.filter((item)=>item.id!==id)};persist(state,'family_plan_item_removed',{count:state.settings.familyPlanItems.length});return;}
  if(event.target.closest('#v8AuditJson')){const state=readState();download(`growup-audit-${todayKey()}.json`,auditEntriesToJson(filteredAudit(state)));return;}
  if(event.target.closest('#v8AuditCsv')){const state=readState();download(`growup-audit-${todayKey()}.csv`,auditEntriesToCsv(filteredAudit(state)),'text/csv;charset=utf-8');return;}
  if(event.target.closest('#v8MarkSeen')){let state=readState();state.settings=markReleaseSeen(state.settings);persist(state,'release_seen',{status:APP_VERSION});return;}
  if(event.target.closest('#v8CheckUpdate')){
    const status=document.querySelector('#v8UpdateStatus');if(!('serviceWorker' in navigator)){if(status)status.textContent='Trình duyệt này không hỗ trợ service worker.';return;}
    try{const registration=await navigator.serviceWorker.getRegistration();if(!registration){if(status)status.textContent='Chưa có service worker được đăng ký.';return;}await registration.update();if(registration.waiting){if(status)status.innerHTML='Có bản PWA mới đã tải. <button class="primary" id="v8ApplyUpdate" type="button">Áp dụng & tải lại</button>';}else if(status)status.textContent='Đã kiểm tra. Chưa có bản PWA mới đang chờ áp dụng.';}catch{if(status)status.textContent='Không thể kiểm tra cập nhật PWA lúc này.';}return;
  }
  if(event.target.closest('#v8ApplyUpdate')){const registration=await navigator.serviceWorker.getRegistration();if(!registration?.waiting)return;let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;location.reload();},{once:true});registration.waiting.postMessage({type:'SKIP_WAITING'});}
});

observer.observe(document.querySelector('#app'),{childList:true,subtree:true});
enhanceV8();
