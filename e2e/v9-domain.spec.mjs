import { test, expect } from '@playwright/test';

async function createChild(page){
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill('Domain Test');
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2018-01-01');
  await page.locator('#childForm button.primary').click();
  await expect(page.locator('[data-v9="domain-history"]')).toBeVisible();
}

test('new learning record stores domain id label snapshot and taxonomy version',async({page})=>{
  await createChild(page);
  await page.locator('[data-nav="learning"]').click();
  const form=page.locator('#learningForm');
  await expect(form.locator('select[name="developmentDomainId"]')).toBeVisible();
  await form.locator('input[name="title"]').fill('Taxonomy reading goal');
  await form.locator('select[name="developmentDomainId"]').selectOption('language');
  await form.locator('button').filter({hasText:'Thêm mục tiêu'}).click();
  await expect(page.locator('[data-v9="domain-history"]')).toBeVisible();
  const goal=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).children[0].learningGoals.at(-1));
  expect(goal.developmentDomainId).toBe('language');
  expect(goal.developmentDomainLabelSnapshot).toBeTruthy();
  expect(goal.developmentTaxonomyVersion).toBeTruthy();
});
