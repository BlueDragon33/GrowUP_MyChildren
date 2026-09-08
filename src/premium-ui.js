import { ageOnDate, stageForAge, progressPercent, todayKey } from './core/model.js';

const STORAGE_KEY = 'growup_mychildren_v1';
const NAV_ICONS = {
  overview: '⌂', learning: '▤', skills: '✦', health: '♡', physical: '♧', nutrition: '◉',
  habits: '✓', assessment: '⌁', portfolio: '▥', roadmap: '↗', calendar: '◷', ai: '✧'
};

let scheduled = false;
const esc = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

function readState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"children":[]}'); }
  catch { return { children: [] }; }
}

function selectedChild(state) {
  return state.children?.find((child) => child.id === state.selectedChildId) || state.children?.[0] || null;
}

function activePage() {
  return document.querySelector('.nav [data-nav].active')?.dataset.nav || document.querySelector('#mobileNav')?.value || 'overview';
}

function initials(name = '') {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  return esc((words.slice(-2).map((word) => word[0]).join('') || 'UP').toUpperCase());
}

function formatDate(value) {
  if (!value) return 'Chưa đặt ngày';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? esc(value) : date.toLocaleDateString('vi-VN');
}

function circleMetric(label, value, note, tone = 'blue') {
  return `<div class="premium-ring premium-ring-${tone}"><div class="premium-ring-core"><strong>${esc(value)}</strong><span>${esc(label)}</span></div><small>${esc(note)}</small></div>`;
}

function skillRows(child) {
  const items = (child.skills || []).slice(-4).reverse();
  if (!items.length) return '<div class="premium-empty">Chưa có đánh giá kỹ năng. Mở mục Kỹ năng để ghi nhận khi cần.</div>';
  return items.map((skill) => {
    const level = clamp(skill.level, 0, 10);
    return `<div class="premium-skill-row"><div class="premium-skill-label"><span>${esc(skill.name)}</span><strong>${level}/10</strong></div><div class="premium-bar"><span style="width:${level * 10}%"></span></div></div>`;
  }).join('');
}

function learningRows(child) {
  const goals = (child.learningGoals || []).slice(0, 5);
  if (!goals.length) return '<div class="premium-empty">Chưa có mục tiêu học tập. Có thể thêm từ mục Học tập.</div>';
  return goals.map((goal, index) => `<div class="premium-learning-row"><span class="premium-subject-dot tone-${(index % 5) + 1}">${esc((goal.subject || 'M').slice(0, 1))}</span><div><strong>${esc(goal.title)}</strong><small>${esc(goal.subject || 'Học tập')}${goal.dueDate ? ` · ${formatDate(goal.dueDate)}` : ''}</small></div><span class="premium-state ${goal.completed ? 'done' : ''}">${goal.completed ? 'Đã xong' : 'Đang làm'}</span></div>`).join('');
}

function habitRows(child) {
  const today = todayKey();
  const habits = (child.habits || []).slice(0, 6);
  if (!habits.length) return '<div class="premium-empty">Chưa có thói quen hằng ngày.</div>';
  return habits.map((habit) => {
    const done = habit.logs?.includes(today);
    return `<div class="premium-check-row"><span class="premium-check ${done ? 'checked' : ''}" aria-hidden="true">${done ? '✓' : ''}</span><div><strong>${esc(habit.title)}</strong><small>${esc(habit.frequency || 'Hằng ngày')}</small></div></div>`;
  }).join('');
}

function reminderRows(child) {
  const reminders = (child.reminders || []).filter((item) => !item.completed).sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(0, 4);
  if (!reminders.length) return '<div class="premium-empty">Hiện chưa có nhắc việc sắp tới.</div>';
  return reminders.map((item) => `<div class="premium-reminder-row"><span class="premium-reminder-icon">◷</span><div><strong>${esc(item.title)}</strong><small>${formatDate(item.date)}</small></div><span class="premium-tag">${esc(item.type || 'Nhắc việc')}</span></div>`).join('');
}

function portfolioRows(child) {
  const items = (child.portfolio || []).slice(-4).reverse();
  if (!items.length) return '<div class="premium-empty">Chưa có dấu mốc trong hồ sơ năng lực.</div>';
  const icons = ['★', '✦', '♛', '❋'];
  return items.map((item, index) => `<div class="premium-achievement"><span>${icons[index % icons.length]}</span><strong>${esc(item.title)}</strong><small>${esc(item.type || 'Dấu mốc')} · ${formatDate(item.date)}</small></div>`).join('');
}

function timeline(age) {
  const stages = [
    [3, 5, '3–5', 'Khám phá thế giới'], [6, 8, '6–8', 'Xây nền tảng'], [9, 11, '9–11', 'Phát triển toàn diện'],
    [12, 15, '12–15', 'Định hình bản thân'], [16, 18, '16–18', 'Sẵn sàng trưởng thành']
  ];
  return stages.map(([min, max, years, label], index) => {
    const current = age >= min && age <= max;
    return `${index ? '<span class="premium-route-line"></span>' : ''}<div class="premium-route-step ${current ? 'current' : ''}"><span class="premium-route-dot">${current ? '●' : ''}</span><strong>${years}</strong><small>${label}</small></div>`;
  }).join('');
}

function hero(child) {
  const name = child ? esc(child.name) : 'con';
  return `<section class="premium-hero" data-premium-hero>
    <div class="premium-hero-copy"><span class="premium-eyebrow">GrowUP · Đồng hành dài hạn</span><h1>Chào ba/mẹ! <span aria-hidden="true">👋</span></h1><p>Cùng GrowUP MyChildren vun đắp hành trình lớn khôn của <strong>${name}</strong> mỗi ngày.</p></div>
    <div class="premium-hero-art" aria-hidden="true"><span class="premium-sun"></span><span class="premium-cloud cloud-a"></span><span class="premium-cloud cloud-b"></span><span class="premium-hill hill-a"></span><span class="premium-hill hill-b"></span><span class="premium-path"></span><span class="premium-child"><i></i></span><span class="premium-hero-quote">“Mỗi ngày tiến một chút,<br>tương lai thêm rộng mở.”</span></div>
    <div class="premium-dream"><span>🌱</span><div><strong>Ước mơ hôm nay</strong><small>Vững vàng ngày mai</small></div></div>
  </section>`;
}

function dashboard(child) {
  if (!child) return '';
  const age = ageOnDate(child.dateOfBirth);
  const stage = stageForAge(age);
  const goals = child.learningGoals || [];
  const goalProgress = progressPercent(goals);
  const today = todayKey();
  const doneHabits = (child.habits || []).filter((habit) => habit.logs?.includes(today)).length;
  const latestHealth = child.healthRecords?.at(-1);
  const todayNutrition = (child.nutritionLogs || []).find((entry) => entry.date === today);
  const recentActivity = (child.physicalActivities || []).filter((entry) => entry.date === today).reduce((sum, entry) => sum + (Number(entry.minutes) || 0), 0);
  const skillAverage = child.skills?.length ? (child.skills.reduce((sum, item) => sum + clamp(item.level, 0, 10), 0) / child.skills.length).toFixed(1) : '—';

  return `<section class="premium-dashboard" data-premium-dashboard>
    <div class="premium-dashboard-top">
      <article class="premium-card premium-profile-card">
        <div class="premium-avatar-wrap"><div class="premium-avatar">${initials(child.name)}</div><span>★</span></div>
        <div class="premium-profile-copy"><span class="premium-kicker">Hồ sơ đang theo dõi</span><h2>${esc(child.name)}</h2><p>${age} tuổi${child.className ? ` · ${esc(child.className)}` : ''}</p><span class="premium-positive">● Đang đồng hành</span><blockquote>“Tôn trọng nhịp phát triển riêng và nhìn sự tiến bộ theo thời gian.”</blockquote></div>
        <button class="premium-icon-btn" type="button" data-premium-nav="assessment" aria-label="Mở hồ sơ đánh giá">↗</button>
      </article>
      <article class="premium-card premium-roadmap-card">
        <div class="premium-card-head"><div><span class="premium-kicker">Lộ trình dài hạn</span><h2>Phát triển 3–18 tuổi</h2><p>${esc(stage.title)} · ${esc(stage.focus?.slice(0, 2).join(' · ') || 'Điều chỉnh linh hoạt theo từng giai đoạn')}</p></div><button type="button" class="premium-link" data-premium-nav="roadmap">Xem lộ trình →</button></div>
        <div class="premium-route">${timeline(age)}</div>
        <div class="premium-route-note"><span>Hiện tại: <strong>${age} tuổi</strong></span><small>Roadmap là định hướng linh hoạt, không phải cam kết nghề nghiệp hay bảng xếp hạng.</small></div>
      </article>
    </div>

    <div class="premium-dashboard-mid">
      <article class="premium-card premium-learning-card"><div class="premium-card-head"><div><span class="premium-kicker">Tuần này</span><h2>Kế hoạch học tập</h2></div><button type="button" class="premium-link" data-premium-nav="learning">Chi tiết</button></div><div class="premium-progress-summary"><strong>${goalProgress}%</strong><div class="premium-bar"><span style="width:${goalProgress}%"></span></div><small>${goals.filter((goal) => goal.completed).length}/${goals.length} mục tiêu hoàn thành</small></div><div class="premium-learning-list">${learningRows(child)}</div></article>

      <article class="premium-card premium-wellbeing-card"><div class="premium-card-head"><div><span class="premium-kicker">Cập nhật gần nhất</span><h2>Sức khỏe & sinh hoạt</h2></div><button type="button" class="premium-link" data-premium-nav="health">Chi tiết</button></div><div class="premium-rings">${circleMetric('Chiều cao', latestHealth?.height ? `${latestHealth.height} cm` : '—', latestHealth ? formatDate(latestHealth.date) : 'Chưa có bản ghi', 'green')}${circleMetric('Nước hôm nay', `${todayNutrition?.water ?? 0} cốc`, 'Nhật ký dinh dưỡng', 'blue')}${circleMetric('Vận động', `${recentActivity} phút`, 'Ghi nhận trong ngày', 'orange')}</div><div class="premium-fact-row"><span>☾ Giấc ngủ gần nhất</span><strong>${latestHealth?.sleep ? `${latestHealth.sleep} giờ` : 'Chưa ghi'}</strong></div></article>

      <article class="premium-card premium-skills-card"><div class="premium-card-head"><div><span class="premium-kicker">Năng lực đã ghi nhận</span><h2>Phát triển kỹ năng</h2></div><button type="button" class="premium-link" data-premium-nav="skills">Chi tiết</button></div><div class="premium-skill-average"><span>Mức trung bình từ dữ liệu đã nhập</span><strong>${skillAverage}${skillAverage !== '—' ? '/10' : ''}</strong></div><div class="premium-skill-list">${skillRows(child)}</div></article>
    </div>

    <div class="premium-dashboard-bottom">
      <article class="premium-card"><div class="premium-card-head"><div><span class="premium-kicker">Hôm nay</span><h2>Thói quen hằng ngày</h2></div><button type="button" class="premium-link" data-premium-nav="habits">${doneHabits}/${child.habits?.length || 0}</button></div><div class="premium-check-list">${habitRows(child)}</div></article>
      <article class="premium-card"><div class="premium-card-head"><div><span class="premium-kicker">Kế hoạch gần</span><h2>Nhắc việc sắp tới</h2></div><button type="button" class="premium-link" data-premium-nav="calendar">Xem tất cả</button></div><div class="premium-reminder-list">${reminderRows(child)}</div></article>
      <article class="premium-card"><div class="premium-card-head"><div><span class="premium-kicker">${child.portfolio?.length || 0} dấu mốc</span><h2>Hồ sơ năng lực & thành tích</h2></div><button type="button" class="premium-link" data-premium-nav="portfolio">Xem hồ sơ</button></div><div class="premium-achievement-grid">${portfolioRows(child)}</div></article>
    </div>
  </section>`;
}

function decorateSidebar(shell, child) {
  const sidebar = shell.querySelector('.sidebar');
  if (!sidebar) return;
  sidebar.classList.add('premium-sidebar');
  const brandStrong = sidebar.querySelector('.brand strong');
  const brandSmall = sidebar.querySelector('.brand small');
  if (brandStrong) brandStrong.textContent = 'GrowUP MyChildren';
  if (brandSmall) brandSmall.textContent = 'Lộ trình học tập & phát triển của con';
  sidebar.querySelectorAll('.nav [data-nav]').forEach((button) => {
    if (button.querySelector('.premium-nav-icon')) return;
    const icon = document.createElement('span');
    icon.className = 'premium-nav-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = NAV_ICONS[button.dataset.nav] || '•';
    button.prepend(icon);
  });
  if (!sidebar.querySelector('[data-premium-sidebar-note]')) {
    const note = document.createElement('div');
    note.className = 'premium-sidebar-note';
    note.dataset.premiumSidebarNote = '';
    note.innerHTML = `<span>♡</span><strong>Đồng hành hôm nay,<br>kiến tạo tương lai.</strong><small>${child ? `Hồ sơ ${esc(child.name)} được lưu cục bộ trên thiết bị.` : 'Dữ liệu ưu tiên lưu cục bộ trên thiết bị.'}</small>`;
    sidebar.querySelector('.sidebar-footer')?.before(note);
  }
}

function decorateTopbar(main, child, page) {
  const topbar = main.querySelector(':scope > .topbar');
  if (!topbar) return;
  topbar.classList.add('premium-topbar');
  const heading = topbar.querySelector(':scope > div:first-child');
  heading?.classList.add('premium-page-heading');
  if (topbar.querySelector('[data-premium-tools]')) return;
  const tools = document.createElement('div');
  tools.className = 'premium-tools';
  tools.dataset.premiumTools = '';
  tools.innerHTML = `<form class="premium-search" data-premium-search><span aria-hidden="true">⌕</span><input name="q" aria-label="Tìm nhanh trong ứng dụng" placeholder="Tìm nhanh: học tập, kỹ năng, dinh dưỡng..." autocomplete="off"><kbd>⌘ K</kbd></form><div class="premium-status"><span class="premium-status-icon">☁</span><div><strong>Đã đồng bộ cục bộ</strong><small>Hoạt động offline an toàn</small></div></div><div class="premium-status privacy"><span class="premium-status-icon">◇</span><div><strong>Dữ liệu riêng tư</strong><small>Ưu tiên lưu trên thiết bị</small></div></div><button type="button" class="premium-bell" data-premium-nav="calendar" aria-label="Mở lịch và nhắc việc">♢<span>${Math.min(9, (child?.reminders || []).filter((item) => !item.completed).length)}</span></button><div class="premium-user"><span class="premium-user-avatar">${initials(child?.name || 'UP')}</span><div><strong>${child ? `Hồ sơ ${esc(child.name)}` : 'GrowUP MyChildren'}</strong><small>${child ? `${ageOnDate(child.dateOfBirth)} tuổi · hành trình riêng` : 'Bắt đầu hồ sơ đầu tiên'}</small></div></div>`;
  topbar.append(tools);
  if (page === 'overview') topbar.classList.add('premium-overview-topbar');
}

function hideLegacyOverview(main) {
  const coreCards = main.querySelector(':scope > section.cards-4');
  const coreTwo = main.querySelector(':scope > section.grid.two-col');
  const coreFocus = [...main.querySelectorAll(':scope > section.card')].find((section) => section.querySelector('h2')?.textContent.includes('Trọng tâm giai đoạn'));
  [coreCards, coreTwo, coreFocus].filter(Boolean).forEach((node) => node.classList.add('premium-source-overview'));
}

function decorate() {
  const shell = document.querySelector('#app > .shell');
  if (!shell) return;
  const state = readState();
  const child = selectedChild(state);
  const page = activePage();
  shell.className = `shell premium-shell page-${page}`;
  decorateSidebar(shell, child);
  const main = shell.querySelector('.main');
  if (!main) return;
  main.classList.add('premium-main');
  decorateTopbar(main, child, page);
  if (page !== 'overview' || !child) return;
  hideLegacyOverview(main);
  const topbar = main.querySelector(':scope > .topbar');
  if (!main.querySelector('[data-premium-hero]')) topbar?.insertAdjacentHTML('afterend', hero(child));
  const heroNode = main.querySelector('[data-premium-hero]');
  if (!main.querySelector('[data-premium-dashboard]')) heroNode?.insertAdjacentHTML('afterend', dashboard(child));
}

function scheduleDecorate() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => { scheduled = false; decorate(); });
}

const observer = new MutationObserver(scheduleDecorate);
const app = document.querySelector('#app');
if (app) observer.observe(app, { childList: true, subtree: true });

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-premium-nav]');
  if (!target) return;
  const key = target.dataset.premiumNav;
  document.querySelector(`.nav [data-nav="${CSS.escape(key)}"]`)?.click();
});

document.addEventListener('submit', (event) => {
  if (!event.target.matches('[data-premium-search]')) return;
  event.preventDefault();
  const query = String(new FormData(event.target).get('q') || '').trim().toLowerCase();
  const map = [
    [/học|toán|tiếng|ngoại ngữ|learning/, 'learning'], [/kỹ năng|logic|giao tiếp|skill/, 'skills'], [/sức khỏe|khám|health/, 'health'],
    [/thể chất|vận động|bơi|physical/, 'physical'], [/dinh dưỡng|ăn|nước|nutrition/, 'nutrition'], [/thói quen|habit/, 'habits'],
    [/đánh giá|assessment/, 'assessment'], [/hồ sơ|portfolio|thành tích/, 'portfolio'], [/lộ trình|roadmap/, 'roadmap'], [/lịch|nhắc|calendar/, 'calendar'], [/ai|cố vấn/, 'ai']
  ];
  const destination = map.find(([pattern]) => pattern.test(query))?.[1] || 'overview';
  document.querySelector(`.nav [data-nav="${destination}"]`)?.click();
});

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    document.querySelector('[data-premium-search] input')?.focus();
  }
});

scheduleDecorate();
