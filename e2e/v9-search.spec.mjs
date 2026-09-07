import { test, expect } from '@playwright/test';

async function createChild(page){
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill('Search Test');
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2018-01-01');
  await page.locator('#childForm button.primary').click();
}

test('local search finds allowed metadata but ignores note-only text',async({page})=>{
  await createChild(page);
  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    const child=state.children[0];
    child.learningGoals=[{id:'g1',title:'Robot reading plan',subject:'Technology',dueDate:'2026-10-01',completed:false}];
    child.portfolio=[{id:'p1',title:'Robot project',type:'Project',date:'2026-09-01',note:'note-marker-a'}];
    child.healthRecords=[{id:'h1',date:'2026-09-01',note:'note-marker-b',height:120,weight:22}];
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  });
  await page.reload();
  const form=page.locator('#v9SearchForm');
  await form.locator('input[name="query"]').fill('robot');
  await form.locator('button[type="submit"]').click();
  await expect(page.locator('#v9SearchResults')).toContainText('Robot');
  await form.locator('input[name="query"]').fill('note-marker-a');
  await form.locator('button[type="submit"]').click();
  await expect(page.locator('#v9SearchResults')).toContainText('Không tìm thấy');
  await form.locator('input[name="query"]').fill('note-marker-b');
  await form.locator('button[type="submit"]').click();
  await expect(page.locator('#v9SearchResults')).toContainText('Không tìm thấy');
});
