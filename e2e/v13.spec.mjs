import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { verifySafeExportIntegrity } from '../src/core/export-integrity.js';

async function createChild(page,name='V13 Child'){
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill(name);
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2018-01-01');
  await page.locator('#childForm button.primary').click();
  await expect(page.locator('[data-v13="export-integrity"]')).toBeVisible();
}

test('safe export download contains a valid SHA-256 manifest and no excluded free text',async({page})=>{
  await createChild(page,'Integrity Child');
  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    state.children[0].learningGoals=[{id:'g1',title:'Read',subject:'Language',note:'secret-note'}];
    state.children[0].healthRecords=[{id:'h1',note:'health-secret'}];
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  });
  await page.reload();
  const form=page.locator('#v12ExportForm');
  await form.locator('input[name="childIds"]').first().check();
  await form.locator('input[name="datasets"][value="learningGoals"]').check();
  await form.locator('[data-export-action="preview"]').click();
  const downloadPromise=page.waitForEvent('download');
  await form.locator('[data-export-action="download"]').click();
  const download=await downloadPromise;
  const text=await readFile(await download.path(),'utf8'),pkg=JSON.parse(text);
  expect(pkg.manifest.algorithm).toBe('SHA-256');
  expect(verifySafeExportIntegrity(pkg).valid).toBe(true);
  expect(text).not.toContain('secret-note');
  expect(text).not.toContain('health-secret');
});

test('workload bands persist locally and re-render the calendar without score or rank',async({page})=>{
  await createChild(page,'Workload Config Child');
  const panel=page.locator('[data-v13="workload-bands"]');
  await panel.locator('input[name="firstMax"]').fill('30');
  await panel.locator('input[name="secondMax"]').fill('90');
  await panel.locator('input[name="label-light"]').fill('Ngắn');
  await panel.locator('input[name="label-moderate"]').fill('Vừa');
  await panel.locator('input[name="label-extended"]').fill('Dài');
  await panel.locator('button[type="submit"]').click();
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    state.settings.familyPlanItems=[{id:'w1',childId:state.children[0].id,date:'2026-09-02',title:'A',minutes:45}];
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  });
  await page.reload();
  await page.locator('#v12WorkloadMonth').fill('2026-09');
  await page.locator('#v12WorkloadMonth').dispatchEvent('change');
  await expect(page.locator('.v12-heat.moderate')).toHaveCount(1);
  await page.locator('.v12-text-equivalent summary').click();
  await expect(page.locator('.v12-text-equivalent')).toContainText('Vừa');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.workloadDisplayBands);
  expect(stored.firstMax).toBe(30);expect(stored.secondMax).toBe(90);
  expect(JSON.stringify(stored)).not.toMatch(/score|rank/i);
});

test('saved-search organizer and recovery lifecycle remain metadata-only and explicit',async({page})=>{
  await createChild(page,'Organizer Child');
  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    state.settings.savedSafeSearchViews=[
      {id:'a',name:'A',query:'math',datasets:['learning'],limit:20},
      {id:'b',name:'B',query:'math',datasets:['learning'],limit:20}
    ];
    state.children[0].reminders=[{id:'r1',title:'Recovery drill',date:'2026-10-01',type:'recovery',source:'recovery-drill',completed:false,lineage:{originSource:'recovery-drill',originDate:'2026-10-01',previousDates:[]}}];
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  });
  await page.reload();
  await expect(page.locator('[data-v13="saved-search-organizer"]')).toContainText('1 nhóm trùng');
  await page.locator('[data-v13-pin-search="a"]').click();
  await page.waitForLoadState('domcontentloaded');
  let stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')));
  expect(stored.settings.savedSafeSearchViews.find((x)=>x.id==='a').pinned).toBe(true);
  expect(JSON.stringify(stored.settings.savedSafeSearchViews)).not.toMatch(/snippet|results/i);
  await page.locator('[data-v13-reschedule-recovery="r1"] input[name="date"]').fill('2026-10-15');
  await page.locator('[data-v13-reschedule-recovery="r1"] button[type="submit"]').click();
  await page.waitForLoadState('domcontentloaded');
  stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')));
  const reminder=stored.children[0].reminders.find((x)=>x.id==='r1');
  expect(reminder.date).toBe('2026-10-15');
  expect(reminder.lineage.originDate).toBe('2026-10-01');
  expect(JSON.stringify(stored.settings.recoveryReminderLifecycleHistory)).not.toContain('passphrase');
});

test('legacy retirement review retains referenced modules and mobile Axe has no serious or critical violations',async({page})=>{
  await createChild(page,'Retirement Review Child');
  const review=page.locator('[data-v13="retirement-review"]');
  await expect(review).toContainText('runtime còn import');
  const decisions=await review.locator('#v13RetirementResult span').allTextContents();
  expect(decisions.length).toBeGreaterThan(0);
  expect(decisions.every((text)=>text.trim().endsWith('retain'))).toBe(true);
  expect(decisions.some((text)=>/\bcandidate\b/.test(text))).toBe(false);
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('#mobileNav')).toBeVisible();
  const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  expect(width.scroll).toBeLessThanOrEqual(width.client);
  const axeResults=await new AxeBuilder({page}).analyze();
  const blocking=axeResults.violations.filter((violation)=>['serious','critical'].includes(violation.impact));
  expect(blocking).toEqual([]);
});
