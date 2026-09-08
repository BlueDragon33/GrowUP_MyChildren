import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { buildSafeExportPackage } from '../src/core/export-wizard.js';
import { SAVED_SEARCH_PACKAGE_FORMAT } from '../src/core/saved-search-package.js';

async function createChild(page,name='V14 Child'){
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill(name);
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2018-01-01');
  await page.locator('#childForm button.primary').click();
  await expect(page.locator('[data-v14="verification-history"]')).toBeVisible();
}

async function reloadAfter(page,action){await Promise.all([page.waitForNavigation(),action()]);}

test('safe-export verification stores a metadata-only receipt',async({page})=>{
  await createChild(page,'Receipt Child');
  const pkg=buildSafeExportPackage({version:5,children:[{id:'external',name:'External Child',learningGoals:[{id:'g1',title:'Read',subject:'Language',note:'secret-note'}],healthRecords:[{id:'h1',note:'health-secret'}]}]},{childIds:['external'],datasets:['learningGoals','healthRecords']});
  await page.locator('#v13VerifyExportForm input[name="file"]').setInputFiles({name:'safe.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(pkg))});
  await page.locator('#v13VerifyExportForm button[type="submit"]').click();
  await expect(page.locator('#v13IntegrityResult')).toContainText('Checksum hợp lệ');
  await expect(page.locator('[data-v14="verification-history"]')).toContainText('Hợp lệ');
  const receipts=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.safeExportVerificationReceipts);
  expect(receipts).toHaveLength(1);
  expect(Object.keys(receipts[0]).sort()).toEqual(['algorithm','at','checksumResult','format']);
  expect(JSON.stringify(receipts)).not.toContain(pkg.manifest.checksum);
  expect(JSON.stringify(receipts)).not.toContain('External Child');
  expect(JSON.stringify(receipts)).not.toContain('secret-note');
});

test('workload preset apply and reset stay local and reversible',async({page})=>{
  await createChild(page,'Preset Child');
  await page.locator('#v14WorkloadPresetForm select[name="presetId"]').selectOption('compact');
  await reloadAfter(page,()=>page.locator('#v14WorkloadPresetForm button[type="submit"]').click());
  let stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.workloadDisplayBands);
  expect(stored.firstMax).toBe(30);expect(stored.secondMax).toBe(90);
  expect(JSON.stringify(stored)).not.toMatch(/score|rank/i);
  await reloadAfter(page,()=>page.locator('#v14ResetWorkloadPreset').click());
  stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.workloadDisplayBands);
  expect(stored.firstMax).toBe(60);expect(stored.secondMax).toBe(180);
});

test('saved-search package export and previewed import remain criteria-only',async({page})=>{
  await createChild(page,'Search Package Child');
  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    state.settings.savedSafeSearchViews=[{id:'a',name:'Math',query:'math',datasets:['learning','health'],limit:20,result:'result-secret',snippet:'snippet-secret'}];
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  });
  await page.reload();
  const exportDownload=page.waitForEvent('download');
  await page.locator('#v14ExportSearchPackage').click();
  const exported=await exportDownload;
  const exportedText=await readFile(await exported.path(),'utf8');
  const exportedPkg=JSON.parse(exportedText);
  expect(exportedPkg.format).toBe(SAVED_SEARCH_PACKAGE_FORMAT);
  expect(exportedText).not.toContain('result-secret');expect(exportedText).not.toContain('snippet-secret');
  expect(exportedPkg.views[0].datasets).toEqual(['learning']);
  const incoming={format:SAVED_SEARCH_PACKAGE_FORMAT,version:1,views:[{id:'dup',name:'Dup',query:'math',datasets:['learning'],limit:20},{id:'b',name:'Science',query:'science',datasets:['learning','health'],limit:20,results:['payload-secret']}]};
  await page.locator('#v14SavedSearchImportForm input[name="file"]').setInputFiles({name:'criteria.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});
  await page.locator('#v14SavedSearchImportForm button[type="submit"]').click();
  await expect(page.locator('#v14SearchImportPreview')).toContainText('1 có thể thêm');
  await expect(page.locator('#v14ApplySearchImport')).toBeEnabled();
  await reloadAfter(page,()=>page.locator('#v14ApplySearchImport').click());
  const views=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.savedSafeSearchViews);
  expect(views.some((view)=>view.query==='science')).toBe(true);
  expect(views.find((view)=>view.query==='science').datasets).toEqual(['learning']);
  expect(JSON.stringify(views)).not.toContain('payload-secret');
  expect(JSON.stringify(views)).not.toMatch(/results|snippet/i);
});

test('recovery calendar bridge exports only explicitly selected reminder lineage',async({page})=>{
  await createChild(page,'Calendar Child');
  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1')),child=state.children[0];
    child.reminders=[{id:'r1',title:'Recovery One',date:'2026-10-15',type:'recovery',source:'recovery-drill',completed:false,lineage:{originDate:'2026-10-01'}},{id:'r2',title:'Recovery Two',date:'2026-11-15',type:'recovery',source:'recovery-drill',completed:false,lineage:{originDate:'2026-11-01'}}];
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  });
  await page.reload();
  await page.locator('#v14RecoveryCalendarForm input[value="r1"]').check();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#v14RecoveryCalendarForm button[type="submit"]').click();
  const download=await downloadPromise,text=await readFile(await download.path(),'utf8');
  expect(text).toContain('Recovery One');expect(text).not.toContain('Recovery Two');
  expect(text).toContain('X-GROWUP-SOURCE:recovery-drill');expect(text).toContain('X-GROWUP-ORIGIN-DATE:20261001');
  expect(text).not.toContain('Calendar Child');expect(text).not.toContain('passphrase');
});

test('retirement dry-run never removes modules and mobile v14 overview passes Axe',async({page})=>{
  await createChild(page,'Dry Run Child');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#v14DryRunRetirement').click();
  const download=await downloadPromise,pkg=JSON.parse(await readFile(await download.path(),'utf8'));
  expect(pkg.removalsApplied).toBe(false);expect(pkg.safeToRemoveAutomatically).toBe(false);expect(pkg.requiresSeparateRemovalCommit).toBe(true);
  expect(pkg.proposedDiff).toEqual([]);
  await expect(page.locator('#v14DryRunResult')).toContainText('Không file/module nào bị xóa');
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('#mobileNav')).toBeVisible();
  const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  expect(width.scroll).toBeLessThanOrEqual(width.client);
  const results=await new AxeBuilder({page}).analyze();
  const blocking=results.violations.filter((violation)=>['serious','critical'].includes(violation.impact));
  expect(blocking).toEqual([]);
});
