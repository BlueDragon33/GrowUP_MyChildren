import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { withSavedSearchPackageManifest } from '../src/core/saved-search-package-integrity.js';
import { SAVED_SEARCH_PACKAGE_FORMAT } from '../src/core/saved-search-package.js';
import { recoveryRemindersToIcs } from '../src/core/recovery-calendar-bridge.js';

async function createChild(page,name='V15 Child'){
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill(name);
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2018-01-01');
  await page.locator('#childForm button.primary').click();
  await expect(page.locator('[data-v15="receipt-management"]')).toBeVisible();
}

async function downloadTextAfter(page,action){const pending=page.waitForEvent('download');await action();const download=await pending;return readFile(await download.path(),'utf8');}

test('L96 receipt management filters, exports metadata only and confirmed-clear removes local history',async({page})=>{
  await createChild(page,'Receipt Manager Child');
  await page.evaluate(()=>{const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));state.settings.safeExportVerificationReceipts=[{at:'2026-09-01T00:00:00.000Z',format:'fmt-a',algorithm:'SHA-256',checksumResult:'valid',expected:'raw-secret'},{at:'2026-09-03T00:00:00.000Z',format:'fmt-b',algorithm:'SHA-256',checksumResult:'invalid',actual:'raw-secret-2'}];localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));});
  await page.reload();
  await page.locator('#v15ReceiptFilterForm select[name="result"]').selectOption('invalid');
  await page.locator('#v15ReceiptFilterForm button[type="submit"]').click();
  await expect(page.locator('[data-v15="receipt-management"] .v15-list')).toContainText('fmt-b');
  await expect(page.locator('[data-v15="receipt-management"] .v15-list')).not.toContainText('fmt-a');
  const text=await downloadTextAfter(page,()=>page.locator('#v15ExportReceipts').click());
  const pkg=JSON.parse(text);expect(pkg.receipts).toHaveLength(1);expect(Object.keys(pkg.receipts[0]).sort()).toEqual(['algorithm','at','checksumResult','format']);expect(text).not.toContain('raw-secret');
  page.once('dialog',(dialog)=>dialog.accept());await page.locator('#v15ClearReceipts').click();
  await expect(page.locator('[data-v15="receipt-management"]')).toContainText('0 mục');
  const receipts=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.safeExportVerificationReceipts);expect(receipts).toEqual([]);
});

test('L97 custom preset library rejects unsafe semantics and exports/imports previewed neutral presets',async({page})=>{
  await createChild(page,'Preset Library Child');
  await page.locator('#v15PresetCreateForm input[name="name"]').fill('Điểm cao');
  await page.locator('#v15PresetCreateForm button[type="submit"]').click();
  await expect(page.locator('#v15PresetImportStatus')).toContainText('bị từ chối');
  await page.locator('#v15PresetCreateForm input[name="name"]').fill('Cuối tuần');
  await page.locator('#v15PresetCreateForm button[type="submit"]').click();
  await expect(page.locator('[data-v15="preset-library"] .v15-list')).toContainText('Cuối tuần');
  const exported=await downloadTextAfter(page,()=>page.locator('#v15ExportPresetLibrary').click());
  expect(exported).not.toMatch(/childId|healthRecords|nutritionLogs|score|rank|rating|percentile/i);
  const incoming={format:'growup-workload-preset-library-v1',version:1,presets:[{id:'school',name:'Ngày học',config:{firstMax:30,secondMax:90,labels:{none:'Không có kế hoạch',light:'Đến 30 phút',moderate:'31–90 phút',extended:'Trên 90 phút'}}},{id:'bad',name:'Rating',config:{firstMax:20,secondMax:60,labels:{none:'Không',light:'Nhẹ',moderate:'Vừa',extended:'Dài'}}}]};
  await page.locator('#v15PresetImportForm input[name="file"]').setInputFiles({name:'presets.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});
  await page.locator('#v15PresetImportForm button[type="submit"]').click();
  await expect(page.locator('#v15PresetImportStatus')).toContainText('1 có thể thêm');await expect(page.locator('#v15PresetImportStatus')).toContainText('1 bị từ chối');await expect(page.locator('#v15ApplyPresetImport')).toBeEnabled();
  await page.locator('#v15ApplyPresetImport').click();await expect(page.locator('[data-v15="preset-library"] .v15-list')).toContainText('Ngày học');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.customWorkloadPresets);expect(JSON.stringify(stored)).not.toMatch(/Rating|childId|score|rank/i);
});

test('L98 Saved Search integrity locks tampered import, records metadata-only receipt and safely applies valid package',async({page})=>{
  await createChild(page,'Search Integrity Child');
  await page.evaluate(()=>{const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));state.settings.savedSafeSearchViews=[{id:'a',name:'Math',query:'math',datasets:['learning'],limit:20}];localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));});await page.reload();
  const exportedText=await downloadTextAfter(page,()=>page.locator('#v15ExportSearchIntegrity').click()),exported=JSON.parse(exportedText);expect(exported.manifest.algorithm).toBe('SHA-256');expect(exportedText).not.toMatch(/healthRecords|nutritionLogs|results|snippet/i);
  const tampered=structuredClone(exported);tampered.views[0].query='tampered';
  await page.locator('#v15SearchIntegrityImportForm input[name="file"]').setInputFiles({name:'tampered.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(tampered))});await page.locator('#v15SearchIntegrityImportForm button[type="submit"]').click();
  await expect(page.locator('[data-v15="saved-search-integrity"]')).toContainText('Import bị khóa');await expect(page.locator('#v15ApplySearchIntegrityImport')).toBeDisabled();
  const receipts=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.savedSearchPackageVerificationReceipts);expect(receipts.at(-1).result).toBe('invalid');expect(JSON.stringify(receipts)).not.toContain(exported.manifest.checksum);
  const incoming=withSavedSearchPackageManifest({format:SAVED_SEARCH_PACKAGE_FORMAT,version:1,createdAt:'2026-09-08T00:00:00.000Z',views:[{id:'science',name:'Science',query:'science',datasets:['learning','health'],limit:20,results:['payload-secret'],snippet:'snippet-secret'}]});
  await page.locator('#v15SearchIntegrityImportForm input[name="file"]').setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});await page.locator('#v15SearchIntegrityImportForm button[type="submit"]').click();await expect(page.locator('#v15ApplySearchIntegrityImport')).toBeEnabled();
  await Promise.all([page.waitForNavigation(),page.locator('#v15ApplySearchIntegrityImport').click()]);
  const views=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.savedSafeSearchViews);const science=views.find((item)=>item.query==='science');expect(science.datasets).toEqual(['learning']);expect(JSON.stringify(views)).not.toMatch(/payload-secret|snippet-secret|results|snippet/i);
});

test('L99 Recovery ICS reconciliation previews differences and never changes reminders',async({page})=>{
  await createChild(page,'ICS Compare Child');
  const state={version:5,children:[{id:'c1',name:'Private Child',reminders:[{id:'r1',title:'Recovery One',date:'2026-10-15',type:'recovery',source:'recovery-drill',completed:false,lineage:{originDate:'2026-10-01'}}]}]};
  const ics=recoveryRemindersToIcs(state,'c1',['r1']).replace('DTSTART;VALUE=DATE:20261015','DTSTART;VALUE=DATE:20261020');
  await page.evaluate(()=>{const current=JSON.parse(localStorage.getItem('growup_mychildren_v1'));current.children[0].reminders=[{id:'r1',title:'Recovery One',date:'2026-10-15',type:'recovery',source:'recovery-drill',completed:false,lineage:{originDate:'2026-10-01'}}];localStorage.setItem('growup_mychildren_v1',JSON.stringify(current));});await page.reload();
  await page.locator('#v15RecoveryReconcileForm input[name="file"]').setInputFiles({name:'recovery.ics',mimeType:'text/calendar',buffer:Buffer.from(ics)});await page.locator('#v15RecoveryReconcileForm button[type="submit"]').click();
  await expect(page.locator('#v15RecoveryReconcileStatus')).toContainText('khác 1');await expect(page.locator('#v15RecoveryReconcileStatus')).toContainText('Không áp dụng thay đổi');
  const date=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).children[0].reminders[0].date);expect(date).toBe('2026-10-15');
});

test('L100 accumulates real six-flow evidence, records axe only after passing audit and keeps retirement dry-run non-destructive',async({page})=>{
  await createChild(page,'Evidence Child');
  for(const nav of ['learning','skills','portfolio']){await page.locator(`[data-nav="${nav}"]`).click();await expect(page.locator(`.nav [data-nav="${nav}"].active`)).toBeVisible();await page.waitForTimeout(30);}
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(50);await page.locator('#mobileNav').selectOption('overview');await expect(page.locator('[data-v15="compatibility-store"]')).toBeVisible();
  const axeResults=await new AxeBuilder({page}).analyze();const blocking=axeResults.violations.filter((violation)=>['serious','critical'].includes(violation.impact));expect(blocking).toEqual([]);
  await page.evaluate(async()=>{const store=await import('/src/core/compatibility-evidence-store.js'),compat=await import('/src/core/runtime-compatibility.js');const state=JSON.parse(localStorage.getItem('growup_mychildren_v1')),snapshot=compat.compatibilityUsageSnapshot(document);state.settings=store.recordCompatibilityFlowSnapshot(state.settings||{},'axe',snapshot);localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));});
  await page.reload();await expect(page.locator('[data-v15="compatibility-store"]')).toContainText('6/6 flow');
  const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.compatibilityEvidenceRecords);expect(records.length).toBeLessThanOrEqual(120);expect(records.some((item)=>item.flow==='axe')).toBe(true);expect(Object.keys(records[0]).sort()).toEqual(['active','at','flow','module','observed']);
  const dryRunText=await downloadTextAfter(page,()=>page.locator('#v15StoredEvidenceDryRun').click()),pkg=JSON.parse(dryRunText);expect(pkg.removalsApplied).toBe(false);expect(pkg.safeToRemoveAutomatically).toBe(false);await expect(page.locator('#v15StoredEvidenceStatus')).toContainText('removalsApplied=false');
});
