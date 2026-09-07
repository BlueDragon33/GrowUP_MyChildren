import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { compatibilityEvidenceMatrix, COMPATIBILITY_REQUIRED_FLOWS } from '../src/core/compatibility-evidence.js';
import { legacyModuleDefinitions } from '../src/core/runtime-compatibility.js';

async function createChild(page,name='V12 Child'){
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill(name);
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2018-01-01');
  await page.locator('#childForm button.primary').click();
  await expect(page.locator('[data-v12="export-wizard"]')).toBeVisible();
}

test('safe export wizard previews and downloads only allowlisted data',async({page})=>{
  await createChild(page,'Export Child');
  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    state.children[0].portfolio=[{id:'p1',title:'Safe project',type:'Project',date:'2026-09-08',note:'portfolio-secret-text'}];
    state.children[0].healthRecords=[{id:'h1',date:'2026-09-08',note:'health-secret-text'}];
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  });
  await page.reload();
  const form=page.locator('#v12ExportForm');
  await form.locator('input[name="childIds"]').first().check();
  await form.locator('input[name="datasets"][value="portfolio"]').check();
  await form.locator('[data-export-action="preview"]').click();
  await expect(page.locator('#v12ExportPreview')).toContainText('1 hồ sơ');
  await expect(page.locator('#v12ExportPreview')).toContainText('Portfolio: 1');
  const downloadPromise=page.waitForEvent('download');
  await form.locator('[data-export-action="download"]').click();
  const download=await downloadPromise;
  const text=await readFile(await download.path(),'utf8');
  expect(text).toContain('Safe project');
  expect(text).not.toContain('portfolio-secret-text');
  expect(text).not.toContain('health-secret-text');
  expect(text).not.toContain('"note"');
});

test('workload heatmap has neutral bands and keyboard-accessible text equivalent',async({page})=>{
  await createChild(page,'Calendar Child');
  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    const childId=state.children[0].id;
    state.settings={...(state.settings||{}),familyPlanItems:[
      {id:'w1',childId,date:'2026-09-02',title:'A',minutes:45},
      {id:'w2',childId,date:'2026-09-03',title:'B',minutes:120},
      {id:'w3',childId,date:'2026-09-04',title:'C',minutes:220}
    ]};
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  });
  await page.reload();
  await page.locator('#v12WorkloadMonth').fill('2026-09');
  await page.locator('#v12WorkloadMonth').dispatchEvent('change');
  await expect(page.locator('.v12-heat.light')).toHaveCount(1);
  await expect(page.locator('.v12-heat.moderate')).toHaveCount(1);
  await expect(page.locator('.v12-heat.extended')).toHaveCount(1);
  const details=page.locator('.v12-text-equivalent');
  await details.locator('summary').click();
  await expect(details).toContainText('220 phút');
  await details.locator('li').nth(3).focus();
  await expect(details.locator('li').nth(3)).toBeFocused();
});

test('saved-search manager renames reorders and resets stored criteria',async({page})=>{
  await createChild(page,'Search Admin Child');
  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    state.settings={...(state.settings||{}),savedSafeSearchViews:[
      {id:'one',name:'One',query:'math',datasets:['learning'],limit:20},
      {id:'two',name:'Two',query:'robot',datasets:['portfolio'],limit:20}
    ]};
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  });
  await page.reload();
  const panel=page.locator('[data-v12="saved-search-admin"]');
  await panel.locator('[data-v12-rename-search="one"] input[name="name"]').fill('Math goals');
  await panel.locator('[data-v12-rename-search="one"] button[type="submit"]').click();
  await expect(page.locator('[data-v12-rename-search="one"] input[name="name"]')).toHaveValue('Math goals');
  const renamed=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.savedSafeSearchViews.find((x)=>x.id==='one'));
  expect(renamed.name).toBe('Math goals');
  await page.locator('[data-v12-move-search="two"][data-direction="up"]').click();
  let order=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.savedSafeSearchViews.map((x)=>x.id));
  expect(order).toEqual(['two','one']);
  page.once('dialog',(dialog)=>dialog.accept());
  await page.locator('#v12ResetSearchViews').click();
  const count=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.savedSafeSearchViews.length);
  expect(count).toBe(0);
});

test('recovery reminder integration creates one reminder and deduplicates same source/date',async({page})=>{
  await createChild(page,'Recovery Reminder Child');
  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    state.settings={...(state.settings||{}),recoveryDrillSchedule:{enabled:true,cadence:'quarterly',nextDate:'2026-10-01',reminderEnabled:true,checklist:{}}};
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  });
  await page.reload();
  await page.locator('#v12RecoveryReminderForm button[type="submit"]').click();
  await expect(page.locator('[data-v12="recovery-reminder"]')).toBeVisible();
  let reminders=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).children[0].reminders.filter((r)=>r.source==='recovery-drill'));
  expect(reminders).toHaveLength(1);
  await page.locator('#v12RecoveryReminderForm button[type="submit"]').click();
  await expect(page.locator('#v12RecoveryReminderStatus')).toContainText('không tạo bản trùng');
  reminders=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).children[0].reminders.filter((r)=>r.source==='recovery-drill'));
  expect(reminders).toHaveLength(1);
});

test('compatibility matrix collects overview learning skills portfolio mobile and axe evidence before retirement',async({page})=>{
  await createChild(page,'Compatibility Child');
  const defs=legacyModuleDefinitions();
  const records=[];
  async function capture(flow){
    const active=await page.evaluate((definitions)=>definitions.map((entry)=>({module:entry.module,active:Boolean(document.querySelector(entry.selector))})),defs);
    for(const item of active)records.push({module:item.module,flow,observed:true,active:item.active});
  }
  await capture('overview');
  for(const [flow,nav] of [['learning','learning'],['skills','skills'],['portfolio','portfolio']]){
    await page.locator(`[data-nav="${nav}"]`).click();
    await capture(flow);
  }
  await page.setViewportSize({width:390,height:844});
  const mobileNav=page.locator('#mobileNav');
  await expect(mobileNav).toBeVisible();
  await mobileNav.selectOption('overview');
  await expect(page.locator('.topbar h1')).toHaveText('Tổng quan phát triển');
  await capture('mobile');
  const axeResults=await new AxeBuilder({page}).analyze();
  const blocking=axeResults.violations.filter((v)=>['serious','critical'].includes(v.impact));
  expect(blocking).toEqual([]);
  const axeActive=await page.evaluate((definitions)=>definitions.map((entry)=>({module:entry.module,active:Boolean(document.querySelector(entry.selector))})),defs);
  for(const item of axeActive)records.push({module:item.module,flow:'axe',observed:true,active:item.active});
  const matrix=compatibilityEvidenceMatrix(records);
  expect(COMPATIBILITY_REQUIRED_FLOWS).toEqual(['overview','learning','skills','portfolio','mobile','axe']);
  expect(matrix.length).toBe(defs.length);
  for(const row of matrix)expect(row.complete).toBe(true);
  expect(matrix.some((row)=>row.activeAnywhere)).toBe(true);
  expect(matrix.filter((row)=>row.retirementEligible&&row.activeAnywhere)).toEqual([]);
});
