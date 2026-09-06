import { ageOnDate, stageForAge, progressPercent } from './core/model.js';
import { migrateState } from './core/schema.js';
import { saveState, appendAudit } from './core/store.js';
import { childSnapshot, recentHealthRecords } from './core/analytics.js';
import { remindersToIcs } from './core/calendar.js';
import { createAttachmentMeta } from './core/attachments.js';
import { publicIntegrationDescriptor, PROVIDERS } from './core/integrations.js';
import { isSensitivePage, screenPrivacyLabel } from './core/privacy.js';

const STORAGE_KEY = 'growup_mychildren_v1';
const PRIVACY_KEY = 'growup_screen_privacy';
const observer = new MutationObserver(() => queueMicrotask(enhance));
let scheduled = false;

function readState() {
  try { return migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"version":3,"children":[]}')); }
  catch { return migrateState({ version: 3, children: [] }); }
}
function childOf(state) { return state.children.find((c) => c.id === state.selectedChildId) || state.children[0] || null; }
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function csvList(value='') { return String(value).split(',').map((item)=>item.trim()).filter(Boolean); }
function download(name, text, type) { const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }
function privacyActive() { return sessionStorage.getItem(PRIVACY_KEY) === '1'; }

function saveChildChange(mutator, type) {
  let state = readState();
  const child = childOf(state);
  if (!child) return;
  const index = state.children.findIndex((item) => item.id === child.id);
  const nextChild = structuredClone(child);
  mutator(nextChild);
  state.children[index] = nextChild;
  state = appendAudit(state, type, { childId: nextChild.id });
  saveState(state);
  location.reload();
}

function lineChart(records, field, label) {
  const usable = records.filter((r) => Number.isFinite(Number(r[field])));
  const values = usable.map((r) => Number(r[field]));
  if (values.length < 2) return `<div class="v2-empty">Cần ít nhất 2 lần đo để vẽ xu hướng ${label.toLowerCase()}.</div>`;
  const min = Math.min(...values), max = Math.max(...values), range = Math.max(1, max - min);
  const points = usable.map((r, i) => {
    const v = Number(r[field]);
    const x = 8 + (i * 84 / Math.max(1, usable.length - 1));
    const y = 88 - ((v - min) / range) * 70;
    return `${x},${y}`;
  }).join(' ');
  return `<div class="v2-chart"><div class="v2-chart-title">${label}: ${values.at(-1)} <small>(${usable.at(-1).date})</small></div><svg viewBox="0 0 100 100" role="img" aria-label="Xu hướng ${escapeHtml(label)}"><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="2.5" vector-effect="non-scaling-stroke"/>${usable.map((r,i)=>{const v=Number(r[field]);const x=8+(i*84/Math.max(1,usable.length-1));const y=88-((v-min)/range)*70;return `<circle cx="${x}" cy="${y}" r="2.2" fill="currentColor"><title>${r.date}: ${v}</title></circle>`}).join('')}</svg><small>Biểu đồ chỉ mô tả dữ liệu đã ghi, không tự diễn giải y khoa.</small></div>`;
}

function overviewPanel(child) {
  const snap = childSnapshot(child), age = ageOnDate(child.dateOfBirth), stage = stageForAge(age), records = recentHealthRecords(child, 8);
  return `<section class="card v2-panel" data-v2="overview"><div class="v2-heading"><div><span class="v2-kicker">Development cockpit v3</span><h2>Tổng hợp phát triển dài hạn</h2></div><span class="pill">${escapeHtml(stage.title)}</span></div><div class="v2-metrics"><div><strong>${progressPercent(child.learningGoals)}%</strong><span>Mục tiêu hoàn thành</span></div><div><strong>${snap.weeklyPhysicalMinutes}</strong><span>Phút vận động / 7 ngày</span></div><div><strong>${snap.habit7dRate}%</strong><span>Thói quen / 7 ngày</span></div><div><strong>${snap.portfolioCount}</strong><span>Dấu mốc portfolio</span></div></div><div class="v2-growth-grid privacy-health">${lineChart(records,'height','Chiều cao (cm)')}${lineChart(records,'weight','Cân nặng (kg)')}</div><div class="v2-note">Hồ sơ v3 có schema migration, hồ sơ phát triển, minh chứng và adapter tích hợp; dữ liệu sức khỏe vẫn chỉ được mô tả, không tự chẩn đoán.</div></section>`;
}

function calendarPanel(child, state) {
  const local = publicIntegrationDescriptor(PROVIDERS.LOCAL);
  const google = publicIntegrationDescriptor(PROVIDERS.GOOGLE_CALENDAR);
  const cloud = publicIntegrationDescriptor(PROVIDERS.CLOUD);
  return `<section class="card v2-panel" data-v2="calendar"><div class="v2-heading"><div><span class="v2-kicker">Calendar & integration bridge</span><h2>Kết nối lịch và dữ liệu</h2></div><span class="pill">${escapeHtml(state.integrations.calendar.status)}</span></div><p>Xuất nhắc nhở thành <code>.ics</code> để nhập vào Google Calendar, Apple Calendar hoặc Outlook. OAuth Google và cloud sync chỉ được kích hoạt sau khi có backend/authorization; source code không chứa secret.</p><div class="v3-adapters"><div><strong>${escapeHtml(local.label)}</strong><small>${local.supports.join(' · ')}</small></div><div><strong>${escapeHtml(google.label)}</strong><small>Yêu cầu cấp quyền tài khoản</small></div><div><strong>${escapeHtml(cloud.label)}</strong><small>Yêu cầu backend + mã hóa</small></div></div><button class="primary" id="v2ExportIcs">Xuất lịch .ics</button></section>`;
}

function profilePanel(child) {
  const p = child.developmentProfile || {};
  const e = child.education || {};
  return `<section class="card v2-panel" data-v3="profile"><div class="v2-heading"><div><span class="v2-kicker">Development profile</span><h2>Hồ sơ thế mạnh và định hướng</h2></div><span class="pill">Không xếp hạng trẻ</span></div><form id="v3ProfileForm" class="form"><label><span>Thế mạnh (cách nhau bằng dấu phẩy)</span><input name="strengths" value="${escapeHtml((p.strengths||[]).join(', '))}" placeholder="Ví dụ: tư duy hình ảnh, bơi, kể chuyện"></label><label><span>Sở thích</span><input name="interests" value="${escapeHtml((p.interests||[]).join(', '))}" placeholder="Ví dụ: robot, động vật, âm nhạc"></label><label><span>Nhu cầu cần hỗ trợ</span><input name="supportNeeds" value="${escapeHtml((p.supportNeeds||[]).join(', '))}" placeholder="Ví dụ: duy trì tập trung, phát âm"></label><label><span>Đầu ra dài hạn mong muốn</span><input name="targetOutcomes" value="${escapeHtml((e.targetOutcomes||[]).join(', '))}" placeholder="Ví dụ: tự học tốt, ngoại ngữ, portfolio dự án"></label><label><span>Ghi chú của gia đình</span><textarea name="notes">${escapeHtml(p.notes||'')}</textarea></label><button class="primary">Lưu hồ sơ phát triển</button></form><div class="v2-note">Đây là hồ sơ định hướng có thể thay đổi theo thời gian, không phải nhãn cố định hay dự đoán nghề nghiệp.</div></section>`;
}

function attachmentPanel(child) {
  const list = (child.attachments || []).slice().reverse().map((item)=>`<div class="item"><div class="item-main"><div class="item-title">${escapeHtml(item.title)}</div><small>${escapeHtml(item.kind)}${item.fileName?` · ${escapeHtml(item.fileName)}`:''}${item.url?` · <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Mở liên kết</a>`:''}</small></div><button class="secondary" data-v3-delete-attachment="${escapeHtml(item.id)}">Xóa</button></div>`).join('');
  return `<section class="card v2-panel" data-v3="attachments"><div class="v2-heading"><div><span class="v2-kicker">Evidence metadata</span><h2>Minh chứng & tài liệu</h2></div><span class="pill">${child.attachments?.length||0} mục</span></div><div class="grid two-col"><form id="v3AttachmentForm" class="form"><label><span>Tiêu đề</span><input name="title" required placeholder="Bài dự án, chứng chỉ, ảnh hoạt động..."></label><label><span>Loại</span><select name="kind"><option value="project">Dự án</option><option value="certificate">Chứng chỉ</option><option value="image">Ảnh</option><option value="video">Video</option><option value="document">Tài liệu</option><option value="link">Liên kết</option><option value="other">Khác</option></select></label><label><span>Liên kết https (nếu có)</span><input name="url" type="url" placeholder="https://..."></label><label><span>Tên tệp tham chiếu (nếu có)</span><input name="fileName" placeholder="certificate.pdf"></label><label><span>Ghi chú</span><textarea name="note"></textarea></label><button class="primary">Thêm metadata minh chứng</button><small>v0.3 chỉ lưu metadata/liên kết; chưa tải byte tệp lên cloud.</small></form><div class="list">${list||'<div class="empty">Chưa có minh chứng metadata.</div>'}</div></div></section>`;
}

function ensurePrivacyButton() {
  const topbar = document.querySelector('.topbar');
  if (!topbar || document.querySelector('#v3PrivacyToggle')) return;
  const active = privacyActive();
  topbar.insertAdjacentHTML('beforeend', `<button id="v3PrivacyToggle" class="secondary v3-privacy-toggle" type="button" aria-pressed="${active}">${screenPrivacyLabel(active)}</button>`);
}

function applyPrivacy(title) {
  const active = privacyActive();
  document.body.classList.toggle('screen-privacy', active);
  document.querySelector('#v3PrivacyToggle')?.setAttribute('aria-pressed', String(active));
  if (document.querySelector('#v3PrivacyToggle')) document.querySelector('#v3PrivacyToggle').textContent = screenPrivacyLabel(active);
  document.querySelectorAll('.privacy-obscured').forEach((node)=>node.classList.remove('privacy-obscured'));
  if (!active) return;
  if (isSensitivePage(title)) document.querySelectorAll('.main > :not(.topbar)').forEach((node)=>node.classList.add('privacy-obscured'));
  if (title === 'Tổng quan') {
    document.querySelector('.cards-4 .card:nth-child(4)')?.classList.add('privacy-obscured');
    document.querySelector('.privacy-health')?.classList.add('privacy-obscured');
  }
}

function enhance() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    const main = document.querySelector('.main');
    const title = document.querySelector('.topbar h1')?.textContent?.trim();
    if (!main || !title) return;
    const state = readState(), child = childOf(state);
    document.documentElement.dataset.schemaVersion = String(state.version);
    ensurePrivacyButton();
    if (child && title === 'Tổng quan' && !document.querySelector('[data-v2="overview"]')) main.insertAdjacentHTML('beforeend', overviewPanel(child));
    if (child && /Lịch/.test(title) && !document.querySelector('[data-v2="calendar"]')) main.insertAdjacentHTML('beforeend', calendarPanel(child,state));
    if (child && title === 'Đánh giá' && !document.querySelector('[data-v3="profile"]')) main.insertAdjacentHTML('beforeend', profilePanel(child));
    if (child && title === 'Portfolio' && !document.querySelector('[data-v3="attachments"]')) main.insertAdjacentHTML('beforeend', attachmentPanel(child));
    applyPrivacy(title);
  });
}

document.addEventListener('click', (event) => {
  if (event.target.closest('#v3PrivacyToggle')) {
    sessionStorage.setItem(PRIVACY_KEY, privacyActive() ? '0' : '1');
    const title = document.querySelector('.topbar h1')?.textContent?.trim() || '';
    applyPrivacy(title);
    return;
  }
  if (event.target.closest('#v2ExportIcs')) {
    const state = readState(), child = childOf(state);
    if (!child) return;
    const ics = remindersToIcs(child.reminders || [], `GrowUP - ${child.name}`);
    download(`growup-${child.name || 'child'}-calendar.ics`, ics, 'text/calendar;charset=utf-8');
    return;
  }
  const deleteButton = event.target.closest('[data-v3-delete-attachment]');
  if (deleteButton) saveChildChange((child)=>{child.attachments=(child.attachments||[]).filter((item)=>item.id!==deleteButton.dataset.v3DeleteAttachment)}, 'attachment_deleted');
});

document.addEventListener('submit', (event) => {
  if (event.target.id === 'v3ProfileForm') {
    event.preventDefault();
    const data = new FormData(event.target);
    saveChildChange((child)=>{
      child.developmentProfile = { ...(child.developmentProfile||{}), strengths:csvList(data.get('strengths')), interests:csvList(data.get('interests')), supportNeeds:csvList(data.get('supportNeeds')), notes:String(data.get('notes')||'').trim() };
      child.education = { ...(child.education||{}), targetOutcomes:csvList(data.get('targetOutcomes')) };
    }, 'development_profile_updated');
  }
  if (event.target.id === 'v3AttachmentForm') {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    try {
      const item = createAttachmentMeta(data);
      saveChildChange((child)=>{child.attachments=[...(child.attachments||[]),item]}, 'attachment_added');
    } catch (error) {
      alert(error.message);
    }
  }
});

observer.observe(document.querySelector('#app'), { childList: true, subtree: true });
enhance();
