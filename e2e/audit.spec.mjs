import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

function blockingViolations(results) {
  return results.violations.filter((violation)=>['serious','critical'].includes(violation.impact));
}

async function expectNoBlockingA11yIssues(page, context) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = blockingViolations(results);
  expect(blocking, `${context}: ${JSON.stringify(blocking.map((v)=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map((n)=>n.target)})),null,2)}`).toEqual([]);
}

test('starting screen has no serious or critical automated accessibility violations', async ({ page }) => {
  await page.goto('/');
  await expectNoBlockingA11yIssues(page,'starting screen');
});

test('populated development overview including v8-v12 tools has no serious or critical automated accessibility violations', async ({ page }) => {
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill('Bé Audit');
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2018-01-01');
  await page.locator('#childForm button.primary').click();
  await expect(page.locator('[data-v7="consistency"]')).toBeVisible();
  await expect(page.locator('[data-v7="retention"]')).toBeVisible();
  await expect(page.locator('[data-v7="print-report"]')).toBeVisible();
  for (const panel of ['audit','taxonomy','family-plan','encrypted-backup','release']) await expect(page.locator(`[data-v8="${panel}"]`)).toBeVisible();
  for (const panel of ['domain-history','family-calendar','search','recovery','rc']) await expect(page.locator(`[data-v9="${panel}"]`)).toBeVisible();
  for (const panel of ['coverage','conflicts','recovery-history','runtime']) await expect(page.locator(`[data-v10="${panel}"]`)).toBeVisible();
  for (const panel of ['portability','workload','saved-search','recovery-schedule','compatibility']) await expect(page.locator(`[data-v11="${panel}"]`)).toBeVisible();
  for (const panel of ['export-wizard','workload-calendar','saved-search-admin','recovery-reminder','compatibility-evidence']) await expect(page.locator(`[data-v12="${panel}"]`)).toBeVisible();
  await expectNoBlockingA11yIssues(page,'populated overview with v8-v12 tools');
});
