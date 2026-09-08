import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function createChild(page, name = 'Minh An') {
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill(name);
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2020-09-08');
  await page.locator('#childForm input[name="className"]').fill('Lớp 1');
  await page.locator('#childForm button.primary').click();
  await expect(page.locator('[data-premium-dashboard]')).toBeVisible();
}

async function seedDashboard(page) {
  await page.evaluate(() => {
    const key = 'growup_mychildren_v1';
    const state = JSON.parse(localStorage.getItem(key));
    const child = state.children.find((item) => item.id === state.selectedChildId) || state.children[0];
    child.learningGoals = [
      { id: 'goal-a', title: 'Đọc sách 20 phút', subject: 'Tiếng Việt', dueDate: '2026-09-12', completed: true },
      { id: 'goal-b', title: 'Luyện tư duy số', subject: 'Toán', dueDate: '2026-09-13', completed: false }
    ];
    child.skills = [
      { id: 'skill-a', name: 'Giao tiếp', level: 8, date: '2026-09-08' },
      { id: 'skill-b', name: 'Tư duy logic', level: 7, date: '2026-09-08' }
    ];
    child.healthRecords = [{ id: 'health-a', date: '2026-09-08', height: 118, weight: 22, sleep: 10, note: '' }];
    child.nutritionLogs = [{ id: 'nutrition-a', date: '2026-09-08', water: 5, plants: true, protein: true, note: '' }];
    child.physicalActivities = [{ id: 'physical-a', activity: 'Chơi ngoài trời', date: '2026-09-08', minutes: 30 }];
    child.habits = [
      { id: 'habit-a', title: 'Thức dậy đúng giờ', frequency: 'Hằng ngày', logs: ['2026-09-08'] },
      { id: 'habit-b', title: 'Đọc sách', frequency: 'Hằng ngày', logs: [] }
    ];
    child.reminders = [{ id: 'reminder-a', title: 'Họp phụ huynh', date: '2026-09-10', type: 'Gia đình', completed: false }];
    child.portfolio = [{ id: 'portfolio-a', title: 'Hoàn thành dự án đọc sách', type: 'Dấu mốc', date: '2026-09-05', note: '' }];
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await expect(page.locator('[data-premium-dashboard]')).toBeVisible();
}

test('premium overview uses real local child data and keeps navigation functional', async ({ page }) => {
  await createChild(page);
  await seedDashboard(page);

  await expect(page.locator('[data-premium-hero]')).toContainText('Minh An');
  await expect(page.locator('.premium-profile-card')).toContainText('Minh An');
  await expect(page.locator('.premium-roadmap-card .premium-route-step')).toHaveCount(5);
  await expect(page.locator('.premium-learning-card')).toContainText('Đọc sách 20 phút');
  await expect(page.locator('.premium-wellbeing-card')).toContainText('118 cm');
  await expect(page.locator('.premium-wellbeing-card')).toContainText('5 cốc');
  await expect(page.locator('.premium-wellbeing-card')).toContainText('30 phút');
  await expect(page.locator('.premium-skills-card')).toContainText('Giao tiếp');
  await expect(page.locator('.premium-dashboard-bottom')).toContainText('Họp phụ huynh');
  await expect(page.locator('.premium-dashboard-bottom')).toContainText('Hoàn thành dự án đọc sách');
  await expect(page.locator(':scope > section.cards-4', { has: page.locator('.metric') })).toHaveCount(0);

  await page.locator('[data-premium-search] input').fill('dinh dưỡng');
  await page.locator('[data-premium-search]').press('Enter');
  await expect(page.locator('.nav [data-nav="nutrition"]')).toHaveClass(/active/);
  await expect(page.locator('.premium-page-heading h1')).toHaveText('Dinh dưỡng');

  await page.locator('.nav [data-nav="overview"]').click();
  await expect(page.locator('[data-premium-dashboard]')).toBeVisible();
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact))).toEqual([]);
});

test('premium dashboard stays within a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await createChild(page, 'Bé An');
  const dimensions = await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 1);
  await expect(page.locator('.premium-hero')).toBeVisible();
  await expect(page.locator('.premium-dashboard-top')).toBeVisible();
  await expect(page.locator('.premium-search')).toBeVisible();
});
