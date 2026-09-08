import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { buildIntegrityExportVerificationReceiptPackage } from '../src/core/export-verification-package-integrity.js';
import { buildIntegrityWorkloadPresetPackage } from '../src/core/workload-preset-package-integrity.js';
import { buildCompatibilityEvidencePackage } from '../src/core/compatibility-evidence-package.js';
import { recoveryRemindersToIcs } from '../src/core/recovery-calendar-bridge.js';

async function child(page){
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill('V17 Child');
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2018-01-01');
  await page.locator('#childForm button.primary').click();
  await expect(page.locator('[data-v17="receipt-history"]')).toBeVisible();
}
async function reload(page){await page.reload();await expect(page.locator('[data-v17="receipt-history"]')).toBeVisible();}

test('L106 managed receipt import records history and undo removes only imported delta',async({page})=>{
  await child(page);
  const pkg=buildIntegrityExportVerificationReceiptPackage({safeExportVerificationReceipts:[{at:'2026-09-08T02:00:00.000Z',format:'fmt-v17',algorithm:'SHA-256',checksumResult:'valid'}]});
  await page.locator('#v17ReceiptImportForm input[name="file"]').setInputFiles({name:'receipt.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(pkg))});
  await page.locator('#v17ReceiptImportForm button[type="submit"]').click();
  await expect(page.locator('#v17ApplyReceipt')).toBeEnabled();
  await page.locator('#v17ApplyReceipt').click();
  await expect(page.locator('#v17ReceiptStatus')).toContainText('Lần gần nhất');
  let stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings);
  expect(stored.receiptImportHistory).toHaveLength(1);expect(stored.safeExportVerificationReceipts.some((item)=>item.format==='fmt-v17')).toBe(true);expect(JSON.stringify(stored.receiptImportHistory)).not.toMatch(/"expected"|"actual"|"payload"/);
  page.once('dialog',(dialog)=>dialog.accept());await page.locator('#v17UndoReceipt').click();await expect(page.locator('#v17ReceiptStatus')).toContainText('Chưa có lịch sử');
  stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings);expect(stored.receiptImportHistory).toEqual([]);expect(stored.safeExportVerificationReceipts.some((item)=>item.format==='fmt-v17')).toBe(false);
});

test('L107 preset managed import audits rename and undo restores prior library',async({page})=>{
  await child(page);
  const source={customWorkloadPresets:[{id:'same',name:'Cuối tuần',config:{firstMax:45,secondMax:120,labels:{none:'Không có kế hoạch',light:'Đến 45 phút',moderate:'46–120 phút',extended:'Trên 120 phút'}}}]};
  await page.evaluate((value)=>{const s=JSON.parse(localStorage.getItem('growup_mychildren_v1'));s.settings={...s.settings,...value};localStorage.setItem('growup_mychildren_v1',JSON.stringify(s));},source);await reload(page);
  const pkg=buildIntegrityWorkloadPresetPackage(source);
  await page.locator('#v17PresetImportForm input[name="file"]').setInputFiles({name:'preset.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(pkg))});await page.locator('#v17PresetImportForm select[name="strategy"]').selectOption('rename');await page.locator('#v17PresetImportForm button[type="submit"]').click();await expect(page.locator('#v17ApplyPreset')).toBeEnabled();await page.locator('#v17ApplyPreset').click();await expect(page.locator('#v17PresetStatus')).toContainText('rename');
  let settings=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings);expect(settings.customWorkloadPresets).toHaveLength(2);expect(settings.workloadPresetImportHistory).toHaveLength(1);expect(settings.workloadPresetImportHistory[0].strategy).toBe('rename');
  page.once('dialog',(dialog)=>dialog.accept());await page.locator('#v17UndoPreset').click();await expect(page.locator('#v17PresetStatus')).toContainText('Chưa có lịch sử');settings=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings);expect(settings.customWorkloadPresets).toHaveLength(1);expect(settings.workloadPresetImportHistory).toEqual([]);
});

test('L108 Saved Search receipt package exports SHA-256 and imports duplicate-safe metadata',async({page})=>{
  await child(page);await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('growup_mychildren_v1'));s.settings.savedSearchPackageVerificationReceipts=[{at:'2026-09-08T01:00:00.000Z',format:'saved-v17',algorithm:'SHA-256',result:'valid'}];localStorage.setItem('growup_mychildren_v1',JSON.stringify(s));});await reload(page);
  const download=page.waitForEvent('download');await page.locator('#v17ExportSavedReceipts').click();const file=await download;const text=await readFile(await file.path(),'utf8');const pkg=JSON.parse(text);expect(pkg.manifest.algorithm).toBe('SHA-256');expect(pkg.receipts).toHaveLength(1);expect(text).not.toMatch(/expected|actual|snippet/);
  await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('growup_mychildren_v1'));s.settings.savedSearchPackageVerificationReceipts=[];localStorage.setItem('growup_mychildren_v1',JSON.stringify(s));});await reload(page);
  await page.locator('#v17SavedReceiptImportForm input[name="file"]').setInputFiles({name:'saved-receipts.json',mimeType:'application/json',buffer:Buffer.from(text)});await page.locator('#v17SavedReceiptImportForm button[type="submit"]').click();await expect(page.locator('#v17ApplySavedReceipt')).toBeEnabled();await page.locator('#v17ApplySavedReceipt').click();await expect(page.locator('[data-v17="saved-receipt-integrity"]')).toBeVisible();const receipts=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.savedSearchPackageVerificationReceipts);expect(receipts).toHaveLength(1);expect(Object.keys(receipts[0]).sort()).toEqual(['algorithm','at','format','result']);
});

test('L109 signed recovery report verifies locally without reminder mutation',async({page})=>{
  await child(page);const ics=recoveryRemindersToIcs({children:[{id:'source',reminders:[{id:'r1',title:'Private source title',date:'2026-10-01',type:'recovery',source:'recovery-drill',completed:false,lineage:{originDate:'2026-09-01'}}]}]},'source',['r1']);
  await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('growup_mychildren_v1'));s.children[0].reminders=[{id:'r1',title:'Private local title',date:'2026-10-02',type:'recovery',source:'recovery-drill',completed:true,lineage:{originDate:'2026-09-01'}}];localStorage.setItem('growup_mychildren_v1',JSON.stringify(s));});await reload(page);
  const before=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('growup_mychildren_v1')).children[0].reminders));
  await page.locator('#v17RecoveryPreviewForm input[name="file"]').setInputFiles({name:'recovery.ics',mimeType:'text/calendar',buffer:Buffer.from(ics)});await page.locator('#v17RecoveryPreviewForm button[type="submit"]').click();await page.locator('#v17RecoveryRows input[value="r1"]').check();const download=page.waitForEvent('download');await page.locator('#v17RecoveryExportForm button[type="submit"]').click();const file=await download;const text=await readFile(await file.path(),'utf8');const report=JSON.parse(text);expect(report.manifest.algorithm).toBe('SHA-256');expect(text).not.toMatch(/Private source title|Private local title|BEGIN:VCALENDAR/);
  await page.locator('#v17RecoveryVerifyForm input[name="file"]').setInputFiles({name:'signed-report.json',mimeType:'application/json',buffer:Buffer.from(text)});await page.locator('#v17RecoveryVerifyForm button[type="submit"]').click();await expect(page.locator('#v17RecoveryStatus')).toContainText('HỢP LỆ');const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')));expect(JSON.stringify(state.children[0].reminders)).toBe(before);expect(state.settings.recoveryReconciliationReportVerificationReceipts).toHaveLength(1);expect(Object.keys(state.settings.recoveryReconciliationReportVerificationReceipts[0]).sort()).toEqual(['algorithm','at','format','result','rowCount']);
});

test('L110 evidence import excludes Axe, exposes freshness and undo is local-only; v17 passes Axe',async({page})=>{
  await child(page);const pkg=buildCompatibilityEvidencePackage({compatibilityEvidenceRecords:[{module:'import-only-test.js',flow:'overview',observed:true,active:false,at:'2026-09-08T01:00:00.000Z'},{module:'import-only-test.js',flow:'axe',observed:true,active:false,at:'2026-09-08T01:01:00.000Z'}]});
  await page.locator('#v17EvidenceImportForm input[name="file"]').setInputFiles({name:'evidence.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(pkg))});await page.locator('#v17EvidenceImportForm button[type="submit"]').click();await expect(page.locator('#v17EvidenceStatus')).toContainText('1 Axe phải chạy local');await page.locator('#v17ApplyEvidence').click();await expect(page.locator('#v17EvidenceStatus')).toContainText('1 non-Axe delta');await expect(page.locator('[data-v17="evidence-audit"]')).toContainText('import-only-test.js');
  let settings=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings);expect(settings.compatibilityEvidenceImportHistory).toHaveLength(1);expect(settings.compatibilityEvidenceRecords.some((item)=>item.module==='import-only-test.js'&&item.flow==='overview')).toBe(true);expect(settings.compatibilityEvidenceRecords.some((item)=>item.module==='import-only-test.js'&&item.flow==='axe')).toBe(false);
  page.once('dialog',(dialog)=>dialog.accept());await page.locator('#v17UndoEvidence').click();await expect(page.locator('[data-v17="evidence-audit"]')).not.toContainText('import-only-test.js');settings=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings);expect(settings.compatibilityEvidenceRecords.some((item)=>item.module==='import-only-test.js')).toBe(false);
  const results=await new AxeBuilder({page}).analyze();expect(results.violations.filter((violation)=>['serious','critical'].includes(violation.impact))).toEqual([]);
});
