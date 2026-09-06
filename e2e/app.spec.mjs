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
