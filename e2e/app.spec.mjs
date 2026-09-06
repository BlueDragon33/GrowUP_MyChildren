import { test, expect } from '@playwright/test';

test('child learning portfolio evidence flow persists in schema v5', async ({ page }) => {
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  const dialog = page.locator('#childForm');
  await dialog.locator('input[name="name"]').fill('Bé Test');
  await dialog.locator('input[name="dateOfBirth"]').fill('2018-05-12');
  await dialog.locator('button[type="submit"], button.primary').click();

  await expect(page.locator('.topbar h1')).toHaveText('Tổng quan phát triển');
  await expect(page.locator('[data-v2="overview"]')).toBeVisible();
  await expect(page.locator('[data-v5="timeline"]')).toBeVisible();
  await expect(page.locator('[data-v5="policy-editor"]')).toBeVisible();
  await expect(page.locator('[data-v6="archive"]')).toBeVisible();
  await expect(page.locator('[data-v6="period-explorer"]')).toBeVisible();
  await expect(page.locator('#v5Dataset option[value="healthRecords"]')).toHaveCount(0);

  await page.locator('[data-nav="learning"]').click();
  const learningForm = page.locator('#learningForm');
  await learningForm.locator('input[name="title"]').fill('Đọc 20 phút mỗi ngày');
  await learningForm.locator('select[name="subject"]').selectOption({ label: 'Ngôn ngữ' });
  await learningForm.locator('button.primary').click();
  await expect(page.locator('.item-title', { hasText: 'Đọc 20 phút mỗi ngày' })).toBeVisible();

  await page.locator('[data-nav="portfolio"]').click();
  const portfolioForm = page.locator('#portfolioForm');
  await portfolioForm.locator('input[name="title"]').fill('Bài kể chuyện đầu tiên');
  await portfolioForm.locator('select[name="type"]').selectOption({ label: 'Sản phẩm' });
  await portfolioForm.locator('button.primary').click();
  await expect(page.locator('[data-v5="evidence-links"]')).toBeVisible();

  const evidenceForm = page.locator('#v5EvidenceForm');
  await expect(evidenceForm).toBeVisible();
  await evidenceForm.locator('input[name="note"]').fill('Minh chứng trực tiếp cho mục tiêu đọc');
  await evidenceForm.locator('button.primary').click();

  await page.waitForLoadState('domcontentloaded');
  await page.locator('[data-nav="portfolio"]').click();
  await expect(page.locator('[data-v5="evidence-links"]')).toContainText('Đọc 20 phút mỗi ngày');
  await expect(page.locator('[data-v5="evidence-links"]')).toContainText('Bài kể chuyện đầu tiên');

  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('growup_mychildren_v1')));
  expect(persisted.version).toBe(5);
  expect(persisted.children).toHaveLength(1);
  expect(persisted.children[0].evidenceLinks).toHaveLength(1);
});

test('local family policy editor adds a non-owner role and protects owner display', async ({ page }) => {
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill('Bé Policy');
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2020-01-01');
  await page.locator('#childForm button.primary').click();
  const form = page.locator('#v5MemberForm');
  await form.locator('input[name="displayName"]').fill('Mẹ');
  await form.locator('select[name="role"]').selectOption('parent');
  await form.locator('button.primary').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('[data-v5="policy-editor"]')).toContainText('Mẹ');
  await expect(page.locator('[data-v5="policy-editor"]')).toContainText('Chủ gia đình');
  await expect(page.locator('[data-v5="policy-editor"]')).toContainText('Được bảo vệ');
});

test('child dialog receives accessibility semantics and Escape closes it', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.v6-skip-link')).toHaveAttribute('href', '#mainContent');
  await expect(page.locator('#mainContent')).toHaveAttribute('tabindex', '-1');
  await page.locator('#emptyAddChild').click();
  const dialog = page.locator('[role="dialog"]');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  const labelledBy = await dialog.getAttribute('aria-labelledby');
  expect(labelledBy).toBeTruthy();
  await expect(page.locator(`#${labelledBy}`)).toHaveText('Tạo hồ sơ trẻ');
  await expect(page.locator('#childForm input[name="name"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#childForm')).toHaveCount(0);
});

test('evidence repair prunes orphan links without removing valid source records', async ({ page }) => {
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill('Bé Repair');
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2019-01-01');
  await page.locator('#childForm button.primary').click();

  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    const child = state.children[0];
    child.learningGoals = [{ id:'g1', title:'Mục tiêu giữ lại', subject:'Ngôn ngữ', completed:false }];
    child.portfolio = [{ id:'p1', title:'Minh chứng giữ lại', type:'Sản phẩm', date:'2026-09-01' }];
    child.evidenceLinks = [
      { id:'l-valid', goalId:'g1', evidenceType:'portfolio', evidenceId:'p1', note:'valid' },
      { id:'l-orphan', goalId:'g1', evidenceType:'portfolio', evidenceId:'missing', note:'orphan' }
    ];
    localStorage.setItem('growup_mychildren_v1', JSON.stringify(state));
  });
  await page.reload();
  await page.locator('[data-nav="portfolio"]').click();
  const repair = page.locator('[data-v6="evidence-repair"]');
  await expect(repair).toContainText('1/2 hợp lệ');
  await expect(page.locator('#v6PruneEvidence')).toBeVisible();
  page.once('dialog', async (dialog) => dialog.accept());
  await page.locator('#v6PruneEvidence').click();
  await page.waitForLoadState('domcontentloaded');
  await page.locator('[data-nav="portfolio"]').click();
  await expect(page.locator('[data-v6="evidence-repair"]')).toContainText('1/1 hợp lệ');
  await expect(page.locator('#v6PruneEvidence')).toHaveCount(0);
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('growup_mychildren_v1')));
  expect(state.children[0].evidenceLinks.map((link) => link.id)).toEqual(['l-valid']);
  expect(state.children[0].learningGoals).toHaveLength(1);
  expect(state.children[0].portfolio).toHaveLength(1);
});
