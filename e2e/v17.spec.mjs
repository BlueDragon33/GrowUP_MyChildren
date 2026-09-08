import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { buildIntegrityExportVerificationReceiptPackage } from '../src/core/export-verification-package-integrity.js';
import { buildIntegrityWorkloadPresetPackage } from '../src/core/workload-preset-package-integrity.js';
import { buildIntegritySavedSearchReceiptPackage } from '../src/core/saved-search-integrity-receipt-package.js';
import { recoveryRemindersToIcs } from '../src/core/recovery-calendar-bridge.js';
import { verifyRecoveryReconciliationReportIntegrity } from '../src/core/recovery-reconciliation-report-integrity.js';
import { buildCompatibilityEvidencePackage } from '../src/core/compatibility-evidence-package.js';

const preset={id:'same',name:'Cuối tuần',config:{firstMax:45,secondMax:120,labels:{none:'Không có kế hoạch',light:'Đến 45 phút',moderate:'46–120 phút',extended:'Trên 120 phút'}}};
async function child(page){await page.goto('/');await page.locator('#emptyAddChild').click();await page.locator('#childForm input[name="name"]').fill('V17 Child');await page.locator('#childForm input[name="dateOfBirth"]').fill('2018-01-01');await page.locator('#childForm button.primary').click();await expect(page.locator('[data-v16="receipt-integrity"]')).toBeVisible();await expect(page.locator('[data-v17="receipt-import-history"]')).toBeVisible();}
async function reload(page){await page.reload();await expect(page.locator('[data-v17="receipt-import-history"]')).toBeVisible();}

test('v16 receipt and preset imports populate v17 rollback-safe histories and explicit undo',async({page})=>{
  await child(page);
  const receiptPkg=buildIntegrityExportVerificationReceiptPackage({safeExportVerificationReceipts:[{at:'2026-09-08T02:00:00.000Z',format:'fmt-v17',algorithm:'SHA-256',checksumResult:'valid'}]});
  await page.locator('#v16ReceiptIntegrityImportForm input[name="file"]').setInputFiles({name:'receipt.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(receiptPkg))});await page.locator('#v16ReceiptIntegrityImportForm button[type="submit"]').click();await page.locator('#v16ApplyReceiptImport').click();await expect(page.locator('#v17UndoReceiptImport')).toBeVisible();
  let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')));expect(state.settings.safeExportVerificationImportHistory).toHaveLength(1);expect(JSON.stringify(state.settings.safeExportVerificationImportHistory)).not.toMatch(/expected|actual|payload|childName/);
  page.once('dialog',(d)=>d.accept());await page.locator('#v17UndoReceiptImport').click();state=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')));expect(state.settings.safeExportVerificationReceipts).toHaveLength(0);expect(state.settings.safeExportVerificationImportHistory[0].undoneAt).toBeTruthy();

  await page.evaluate((p)=>{const s=JSON.parse(localStorage.getItem('growup_mychildren_v1'));s.settings.customWorkloadPresets=[p];localStorage.setItem('growup_mychildren_v1',JSON.stringify(s));},preset);await reload(page);
  const presetPkg=buildIntegrityWorkloadPresetPackage({customWorkloadPresets:[preset]});await page.locator('#v16PresetIntegrityImportForm input[name="file"]').setInputFiles({name:'preset.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(presetPkg))});await page.locator('#v16PresetIntegrityImportForm select[name="strategy"]').selectOption('rename');await page.locator('#v16PresetIntegrityImportForm button[type="submit"]').click();await page.locator('#v16ApplyPresetIntegrityImport').click();await expect(page.locator('#v17UndoPresetImport')).toBeVisible();
  state=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')));expect(state.settings.workloadPresetImportHistory[0].decisions[0].action).toBe('renamed');expect(JSON.stringify(state.settings.workloadPresetImportHistory)).not.toMatch(/childId|score|rank|performance|health/i);
  page.once('dialog',(d)=>d.accept());await page.locator('#v17UndoPresetImport').click();state=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')));expect(state.settings.customWorkloadPresets).toHaveLength(1);
});

test('Saved Search receipt integrity locks tampered import and applies metadata-only valid package',async({page})=>{
  await child(page);const pkg=buildIntegritySavedSearchReceiptPackage({savedSearchPackageVerificationReceipts:[{at:'2026-09-08T03:00:00.000Z',format:'saved-v17',algorithm:'SHA-256',result:'valid'}]}),bad=structuredClone(pkg);bad.receipts[0].format='tampered';
  await page.locator('#v17SavedReceiptIntegrityImportForm input[name="file"]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});await page.locator('#v17SavedReceiptIntegrityImportForm button[type="submit"]').click();await expect(page.locator('#v17ApplySavedReceiptImport')).toBeDisabled();
  await page.locator('#v17SavedReceiptIntegrityImportForm input[name="file"]').setInputFiles({name:'ok.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(pkg))});await page.locator('#v17SavedReceiptIntegrityImportForm button[type="submit"]').click();await expect(page.locator('#v17ApplySavedReceiptImport')).toBeEnabled();await page.locator('#v17ApplySavedReceiptImport').click();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.savedSearchPackageVerificationReceipts);expect(stored).toHaveLength(1);expect(Object.keys(stored[0]).sort()).toEqual(['algorithm','at','format','result']);expect(JSON.stringify(stored)).not.toMatch(/criteria|snippet|results|health|nutrition|expected|actual/i);
});

test('v16 Recovery export is SHA-256 report and v17 verifier stores metadata receipt without reminder mutation',async({page})=>{
  await child(page);const fileState={children:[{id:'c',reminders:[{id:'r1',title:'Private title',date:'2026-10-01',type:'recovery',source:'recovery-drill',completed:false,lineage:{originDate:'2026-09-01'}}]}]},ics=recoveryRemindersToIcs(fileState,'c',['r1']);
  await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('growup_mychildren_v1'));s.children[0].reminders=[{id:'r1',title:'Private title',date:'2026-10-02',type:'recovery',source:'recovery-drill',completed:true,lineage:{originDate:'2026-09-01'}}];localStorage.setItem('growup_mychildren_v1',JSON.stringify(s));});await reload(page);
  const before=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('growup_mychildren_v1')).children[0].reminders));await page.locator('#v16RecoveryReportPreviewForm input[name="file"]').setInputFiles({name:'recovery.ics',mimeType:'text/calendar',buffer:Buffer.from(ics)});await page.locator('#v16RecoveryReportPreviewForm button[type="submit"]').click();await page.locator('#v16RecoveryReportRows input[value="r1"]').check();
  const dl=page.waitForEvent('download');await page.locator('#v16RecoveryReportExportForm button[type="submit"]').click();const downloaded=await dl,text=await readFile(await downloaded.path(),'utf8'),report=JSON.parse(text);expect(verifyRecoveryReconciliationReportIntegrity(report).valid).toBe(true);expect(text).not.toContain('Private title');expect(text).not.toContain('BEGIN:VCALENDAR');
  await page.locator('#v17RecoveryReportVerifyForm input[name="file"]').setInputFiles({name:'report.json',mimeType:'application/json',buffer:Buffer.from(text)});await page.locator('#v17RecoveryReportVerifyForm button[type="submit"]').click();
  const after=await page.evaluate(()=>JSON.stringify(JSON.parse(localStorage.getItem('growup_mychildren_v1')).children[0].reminders));expect(after).toBe(before);const receipts=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.recoveryReconciliationReportVerificationReceipts);expect(receipts).toHaveLength(1);expect(Object.keys(receipts[0]).sort()).toEqual(['algorithm','at','format','result','rowCount']);
});

test('compatibility import audit rejects packaged Axe, supports undo, freshness and mobile Axe gate',async({page})=>{
  await child(page);const pkg=buildCompatibilityEvidencePackage({compatibilityEvidenceRecords:[{module:'legacy.js',flow:'skills',observed:true,active:false,at:'2026-09-08T01:00:00.000Z'},{module:'legacy.js',flow:'axe',observed:true,active:false,at:'2026-09-08T01:00:00.000Z'}]});
  await page.locator('#v16EvidenceImportForm input[name="file"]').setInputFiles({name:'evidence.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(pkg))});await page.locator('#v16EvidenceImportForm button[type="submit"]').click();await expect(page.locator('#v16EvidenceStatus')).toContainText('Axe cần chạy lại: 1');await page.locator('#v16ApplyEvidenceImport').click();await expect(page.locator('#v17UndoEvidenceImport')).toBeVisible();
  let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')));expect(state.settings.compatibilityEvidenceRecords.some((r)=>r.flow==='skills')).toBe(true);expect(state.settings.compatibilityEvidenceRecords.some((r)=>r.flow==='axe')).toBe(false);expect(JSON.stringify(state.settings.compatibilityEvidenceImportHistory)).not.toContain('"flow":"axe"');
  page.once('dialog',(d)=>d.accept());await page.locator('#v17UndoEvidenceImport').click();state=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')));expect(state.settings.compatibilityEvidenceRecords.some((r)=>r.flow==='skills')).toBe(false);
  await page.locator('#v17FreshnessForm input[name="days"]').fill('14');await page.locator('#v17FreshnessForm button[type="submit"]').click();await expect(page.locator('[data-v17="evidence-import-audit"]')).toContainText('axe');await expect(page.locator('[data-v17="evidence-import-audit"]')).toContainText('missing');
  await page.setViewportSize({width:390,height:844});const width=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);expect(width[0]).toBeLessThanOrEqual(width[1]);const results=await new AxeBuilder({page}).analyze();expect(results.violations.filter((v)=>['serious','critical'].includes(v.impact))).toEqual([]);
});
