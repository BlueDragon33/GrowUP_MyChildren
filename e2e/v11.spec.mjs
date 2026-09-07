import { test, expect } from '@playwright/test';

async function createChild(page,name='V11 Child'){
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill(name);
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2018-01-01');
  await page.locator('#childForm button.primary').click();
  await expect(page.locator('[data-v11="portability"]')).toBeVisible();
}

test('portability workload and compatibility panels remain neutral and local',async({page})=>{
  await createChild(page,'V11 Overview');
  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    state.settings={...(state.settings||{}),familyPlanItems:[
      {id:'w1',childId:state.children[0].id,date:'2026-09-07',title:'Plan A',minutes:60},
      {id:'w2',childId:state.children[0].id,date:'2026-09-08',title:'Plan B',minutes:30}
    ]};
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  });
  await page.reload();
  await expect(page.locator('[data-v11="portability"]')).toContainText('Chỉ backup mã hóa');
  const workload=page.locator('[data-v11="workload"]');
  await expect(workload).toContainText('7 ngày');
  await expect(workload).toContainText('14 ngày');
  await expect(workload).toContainText('30 ngày');
  await expect(workload).toContainText('Không xếp hạng trẻ');
  const compatibility=page.locator('[data-v11="compatibility"]');
  await expect(compatibility).toContainText('0 module đủ bằng chứng để loại');
  await expect(compatibility).toContainText('v4');
});

test('saved safe-search view stores filters but not query or result contents',async({page})=>{
  await createChild(page,'Saved Search Child');
  const form=page.locator('#v9SearchForm');
  await expect(page.locator('[data-v11="saved-searches"]')).toBeVisible();
  await form.locator('input[name="query"]').fill('SECRET QUERY SHOULD NOT PERSIST');
  for(const box of await form.locator('input[name="datasets"]').all())await box.uncheck();
  await form.locator('input[name="datasets"][value="portfolio"]').check();
  await form.locator('input[name="fromDate"]').fill('2026-09-01');
  await form.locator('input[name="toDate"]').fill('2026-09-30');
  await page.locator('#v11SearchViewLabel').fill('Portfolio tháng 9');
  await page.locator('#v11SaveSearchView').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('[data-v11="saved-searches"]')).toContainText('Portfolio tháng 9');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.savedSafeSearchViews[0]);
  expect(stored.datasets).toEqual(['portfolio']);
  expect(stored).not.toHaveProperty('query');
  expect(stored).not.toHaveProperty('results');
  expect(JSON.stringify(stored)).not.toContain('SECRET QUERY SHOULD NOT PERSIST');
  await page.locator('[data-v11-apply-view]').first().click();
  await expect(form.locator('input[name="datasets"][value="portfolio"]')).toBeChecked();
  await expect(form.locator('input[name="datasets"][value="learning"]')).not.toBeChecked();
  await expect(form.locator('input[name="fromDate"]')).toHaveValue('2026-09-01');
  await expect(form.locator('input[name="toDate"]')).toHaveValue('2026-09-30');
});

test('recovery schedule creates local reminder only after explicit action',async({page})=>{
  await createChild(page,'Recovery Schedule Child');
  const form=page.locator('#v11RecoveryScheduleForm');
  await form.locator('input[name="enabled"]').check();
  await form.locator('input[name="nextDate"]').fill('2026-10-01');
  await form.locator('input[name="label"]').fill('Kiểm tra recovery định kỳ');
  await form.locator('input[name="backupLocated"]').check();
  await form.locator('input[name="checksumVerified"]').check();
  await form.locator('button[data-v11-recovery-action="save-reminder"]').click();
  await page.waitForLoadState('domcontentloaded');
  const snapshot=await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    return {schedule:state.settings.recoverySchedule,reminders:state.children[0].reminders};
  });
  expect(snapshot.schedule.nextDate).toBe('2026-10-01');
  expect(JSON.stringify(snapshot.schedule)).not.toContain('passphrase');
  expect(JSON.stringify(snapshot.schedule)).not.toContain('ciphertext');
  expect(snapshot.reminders.filter((item)=>item.source==='recovery-schedule')).toHaveLength(1);
  await page.locator('button[data-nav="calendar"]').click();
  await expect(page.locator('.main')).toContainText('Kiểm tra recovery định kỳ');
});

test('v1.1 consolidated runtime remains usable at 390px without horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await createChild(page,'Mobile V11');
  await expect(page.locator('[data-v11="workload"]')).toBeVisible();
  await expect(page.locator('#mobileNav')).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
