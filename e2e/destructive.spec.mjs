import { test, expect } from '@playwright/test';

test('profile deletion is cancelled when confirmation is dismissed and executes only after accept', async ({ page }) => {
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill('Bé Không Xóa Nhầm');
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2019-01-01');
  await page.locator('#childForm button.primary').click();
  await expect(page.locator('#childSelect option')).toHaveCount(1);

  await page.locator('#backupBtn').click();
  await expect(page.locator('#deleteChild')).toBeVisible();
  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toContain('Xóa hồ sơ');
    await dialog.dismiss();
  });
  await page.locator('#deleteChild').click();
  await expect(page.locator('#childSelect option')).toHaveCount(1);
  await expect(page.locator('#deleteChild')).toBeVisible();

  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('confirm');
    await dialog.accept();
  });
  await page.locator('#deleteChild').click();
  await expect(page.locator('#emptyAddChild')).toBeVisible();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('growup_mychildren_v1')));
  expect(state.children).toHaveLength(0);
});
