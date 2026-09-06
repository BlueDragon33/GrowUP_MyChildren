import { ageOnDate, stageForAge, progressPercent } from './core/model.js';
import { migrateState } from './core/schema.js';
import { childSnapshot, recentHealthRecords } from './core/analytics.js';
import { remindersToIcs } from './core/calendar.js';

const STORAGE_KEY = 'growup_mychildren_v1';
const observer = new MutationObserver(() => queueMicrotask(enhance));
let scheduled = false;

function readState() {
  try { return migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"version":2,"children":[]}')); }
  catch { return migrateState({ version: 2, children: [] }); }
}
function childOf(state) { return state.children.find((c) => c.id === state.selectedChildId) || state.children[0] || null; }
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function download(name, text, type) { const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }

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
  return `<section class="card v2-panel" data-v2="overview"><div class="v2-heading"><div><span class="v2-kicker">Development cockpit v2</span><h2>Tổng hợp phát triển dài hạn</h2></div><span class="pill">${escapeHtml(stage.title)}</span></div><div class="v2-metrics"><div><strong>${progressPercent(child.learningGoals)}%</strong><span>Mục tiêu hoàn thành</span></div><div><strong>${snap.weeklyPhysicalMinutes}</strong><span>Phút vận động / 7 ngày</span></div><div><strong>${snap.habit7dRate}%</strong><span>Thói quen / 7 ngày</span></div><div><strong>${snap.portfolioCount}</strong><span>Dấu mốc portfolio</span></div></div><div class="v2-growth-grid">${lineChart(records,'height','Chiều cao (cm)')}${lineChart(records,'weight','Cân nặng (kg)')}</div><div class="v2-note">Hồ sơ v2 đã sẵn sàng cho dữ liệu dài hạn, schema migration và tích hợp cloud trong các lượt tiếp theo.</div></section>`;
}

function calendarPanel(child) {
  return `<section class="card v2-panel" data-v2="calendar"><div class="v2-heading"><div><span class="v2-kicker">Calendar bridge</span><h2>Xuất lịch gia đình</h2></div></div><p>Xuất các nhắc nhở hiện tại thành tệp <code>.ics</code> để nhập vào Google Calendar, Apple Calendar hoặc Outlook. Đây là xuất một chiều; chưa cấp quyền tài khoản Google ở giai đoạn này.</p><button class="primary" id="v2ExportIcs">Xuất lịch .ics</button></section>`;
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
    if (child && title === 'Tổng quan' && !document.querySelector('[data-v2="overview"]')) main.insertAdjacentHTML('beforeend', overviewPanel(child));
    if (child && /Lịch/.test(title) && !document.querySelector('[data-v2="calendar"]')) main.insertAdjacentHTML('beforeend', calendarPanel(child));
  });
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('#v2ExportIcs');
  if (!button) return;
  const state = readState(), child = childOf(state);
  if (!child) return;
  const ics = remindersToIcs(child.reminders || [], `GrowUP - ${child.name}`);
  download(`growup-${child.name || 'child'}-calendar.ics`, ics, 'text/calendar;charset=utf-8');
});

observer.observe(document.querySelector('#app'), { childList: true, subtree: true });
enhance();
