import { test, expect } from '@playwright/test';

async function createChild(page,name='V11 Child'){
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill(name);
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2018-01-01');
  await page.locator('#childForm button.primary').click();
  await expect(page.locator('[data-v11="portability"]')).toBeVisible();
}

test('portability and workload panels render neutral summaries',async({page})=>{
  await createChild(page,'Workload Child');
  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    const id=state.children[0].id;
    state.children[0].healthRecords=[{id:'h1',date:'2026-09-07'}];
    state.settings={...(state.settings||{}),familyPlanItems:[{id:'p1',childId:id,date:'2026-09-07',title:'Reading',minutes:45},{id:'p2',childId:id,date:'2026-09-08',title:'Swim',minutes:60}]};
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  });
  await page.reload();
  await expect(page.locator('[data-v11="portability"]')).toContainText('encrypted-backup-only');
  await expect(page.locator('[data-v11="workload"]')).toContainText('7 ngày');
  const forbidden=await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    return ['score','rank','percentile'].filter((key)=>Object.prototype.hasOwnProperty.call(state.settings,key));
  });
  expect(forbidden).toEqual([]);
});

test('saved search stores only criteria and can reload form values',async({page})=>{
  await createChild(page,'Saved Search Child');
  const search=page.locator('#v9SearchForm');
  await search.locator('input[name="query"]').fill('Toán');
  await search.locator('input[name="datasets"][value="learning"]').check();
  await page.locator('#v11SaveSearchForm input[name="name"]').fill('Toán nhanh');
  await page.locator('#v11SaveSearchForm button[type="submit"]').click();
  await expect(page.locator('[data-v11="saved-search"]')).toContainText('Toán nhanh');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.savedSafeSearchViews[0]);
  expect(stored.results).toBeUndefined();
  expect(stored.query).toBe('Toán');
  await page.locator('[data-v11-load-search]').click();
  await expect(page.locator('#v9SearchForm input[name="query"]')).toHaveValue('Toán');
});

test('recovery schedule stores metadata without passphrase',async({page})=>{
  await createChild(page,'Recovery Schedule Child');
  const form=page.locator('#v11RecoveryScheduleForm');
  await form.locator('input[name="enabled"]').check();
  await form.locator('select[name="cadence"]').selectOption('quarterly');
  await form.locator('input[name="nextDate"]').fill('2026-10-01');
  await form.locator('input[name="reminderEnabled"]').check();
  await form.locator('input[name="passphraseAvailable"]').check();
  await form.locator('button[type="submit"]').click();
  await expect(page.locator('[data-v11="recovery-schedule"]')).toContainText('2026-10-01');
  const schedule=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.recoveryDrillSchedule);
  expect(schedule.passphrase).toBeUndefined();
  expect(schedule.checklist.passphraseAvailable).toBe(true);
});

test('compatibility evidence and mobile layout stay non-destructive',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await createChild(page,'Mobile V11');
  const panel=page.locator('[data-v11="compatibility"]');
  await expect(panel).toBeVisible();
  await expect(panel).toContainText('v9-runtime.js');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
