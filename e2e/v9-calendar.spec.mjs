import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

function futureDate(days=2) {
  const date=new Date();
  date.setUTCDate(date.getUTCDate()+days);
  return date.toISOString().slice(0,10);
}

async function createChild(page){
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill('Calendar Test');
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2018-01-01');
  await page.locator('#childForm button.primary').click();
}

test('family plan ICS contains only selected item metadata',async({page})=>{
  await createChild(page);
  const planDates=[futureDate(2),futureDate(3)];
  await page.evaluate(([selectedDate,otherDate])=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    const childId=state.children[0].id;
    state.settings={...(state.settings||{}),familyPlanItems:[
      {id:'plan-a',childId,date:selectedDate,title:'Selected activity',minutes:45},
      {id:'plan-b',childId,date:otherDate,title:'Other activity',minutes:30}
    ]};
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  },planDates);
  await page.reload();
  const form=page.locator('#v9FamilyIcsForm');
  await expect(form).toBeVisible();
  await form.locator('input[value="plan-a"]').check();
  const downloadPromise=page.waitForEvent('download');
  await form.locator('button[type="submit"]').click();
  const download=await downloadPromise;
  const path=await download.path();
  const text=await readFile(path,'utf8');
  expect(text).toContain('SUMMARY:Selected activity');
  expect(text).toContain('X-GROWUP-PLANNED-MINUTES:45');
  expect(text).not.toContain('Other activity');
  expect(text).not.toContain('Calendar Test');
});
