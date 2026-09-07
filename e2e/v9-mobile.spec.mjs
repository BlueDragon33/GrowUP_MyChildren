import { test, expect } from '@playwright/test';

test('mobile overview remains usable without horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill('Mobile Test');
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2018-01-01');
  await page.locator('#childForm button.primary').click();
  await expect(page.locator('#mobileNav')).toBeVisible();
  await expect(page.locator('.nav')).not.toBeVisible();
  await expect(page.locator('[data-v9="rc"]')).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
