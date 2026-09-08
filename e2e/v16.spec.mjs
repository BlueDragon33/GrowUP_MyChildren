import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { buildIntegrityExportVerificationReceiptPackage } from '../src/core/export-verification-package-integrity.js';
import { buildIntegrityWorkloadPresetPackage } from '../src/core/workload-preset-package-integrity.js';
import { recoveryRemindersToIcs } from '../src/core/recovery-calendar-bridge.js';
import { buildCompatibilityEvidencePackage } from '../src/core/compatibility-evidence-package.js';

async function child(page){await page.goto('/');await page.locator('#emptyAddChild').click();await page.locator('#childForm input[name="name"]').fill('V16 Child');await page.locator('#childForm input[name="dateOfBirth"]').fill('2018-01-01');await page.locator('#childForm button.primary').click();await expect(page.locator('[data-v16="receipt-integrity"]')).toBeVisible();}
async function reload(page){await page.reload();await expect(page.locator('[data-v16="receipt-integrity"]')).toBeVisible();}

test('receipt and preset integrity require valid checksum before import',async({page})=>{
  await child(page);
  const receiptPkg=buildIntegrityExportVerificationReceiptPackage({safeExportVerificationReceipts:[{at:'2026-09-08T02:00:00.000Z',format:'fmt-v2',algorithm:'SHA-256',checksumResult:'invalid'}]});
  const bad=structuredClone(receiptPkg);bad.receipts[0].format='changed';
  await page.locator('#v16ReceiptIntegrityImportForm input[name="file"]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});await page.locator('#v16ReceiptIntegrityImportForm button[type="submit"]').click();await expect(page.locator('#v16ApplyReceiptImport')).toBeDisabled();
  await page.locator('#v16ReceiptIntegrityImportForm input[name="file"]').setInputFiles({name:'ok.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(receiptPkg))});await page.locator('#v16ReceiptIntegrityImportForm button[type="submit"]').click();await expect(page.locator('#v16ApplyReceiptImport')).toBeEnabled();
  const presetSettings={customWorkloadPresets:[{id:'same',name:'Cuối tuần',config:{firstMax:45,secondMax:120,labels:{none:'Không có kế hoạch',light:'Đến 45 phút',moderate:'46–120 phút',extended:'Trên 120 phút'}}}]};
  await page.evaluate((x)=>{const s=JSON.parse(localStorage.getItem('growup_mychildren_v1'));s.settings={...s.settings,...x};localStorage.setItem('growup_mychildren_v1',JSON.stringify(s));},presetSettings);await reload(page);
  const presetPkg=buildIntegrityWorkloadPresetPackage(presetSettings);await page.locator('#v16PresetIntegrityImportForm input[name="file"]').setInputFiles({name:'preset.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(presetPkg))});await page.locator('#v16PresetIntegrityImportForm select[name="strategy"]').selectOption('rename');await page.locator('#v16PresetIntegrityImportForm button[type="submit"]').click();await expect(page.locator('#v16PresetIntegrityStatus')).toContainText('1 xung đột');
});

test('Saved Search receipt management exports filtered metadata and clear requires confirmation',async({page})=>{
  await child(page);await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('growup_mychildren_v1'));s.settings.savedSearchPackageVerificationReceipts=[{at:'2026-09-08T01:00:00.000Z',format:'a',algorithm:'SHA-256',result:'valid'},{at:'2026-09-09T01:00:00.000Z',format:'b',algorithm:'SHA-256',result:'invalid'}];localStorage.setItem('growup_mychildren_v1',JSON.stringify(s));});await reload(page);
  await page.locator('#v16SavedReceiptFilterForm select[name="result"]').selectOption('invalid');await page.locator('#v16SavedReceiptFilterForm button[type="submit"]').click();
  const dl=page.waitForEvent('download');await page.locator('#v16ExportSavedReceipts').click();const file=await dl;const text=await readFile(await file.path(),'utf8');expect(JSON.parse(text).receipts).toHaveLength(1);expect(text).not.toMatch(/expected|actual|snippet/);
  page.once('dialog',(d)=>d.accept());await page.locator('#v16ClearSavedReceipts').click();expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).settings.savedSearchPackageVerificationReceipts)).toEqual([]);
});

test('Recovery report exports selected comparison metadata only',async({page})=>{
  await child(page);const exported=recoveryRemindersToIcs({children:[{id:'c',reminders:[{id:'r1',title:'Private title',date:'2026-10-01',type:'recovery',source:'recovery-drill',completed:false,lineage:{originDate:'2026-09-01'}}]}]},'c',['r1']);
  await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('growup_mychildren_v1'));s.children[0].reminders=[{id:'r1',title:'Private title',date:'2026-10-02',type:'recovery',source:'recovery-drill',completed:true,lineage:{originDate:'2026-09-01'}}];localStorage.setItem('growup_mychildren_v1',JSON.stringify(s));});await reload(page);
  await page.locator('#v16RecoveryReportPreviewForm input[name="file"]').setInputFiles({name:'r.ics',mimeType:'text/calendar',buffer:Buffer.from(exported)});await page.locator('#v16RecoveryReportPreviewForm button[type="submit"]').click();await page.locator('#v16RecoveryReportRows input[value="r1"]').check();
  const dl=page.waitForEvent('download');await page.locator('#v16RecoveryReportExportForm button[type="submit"]').click();const file=await dl;const text=await readFile(await file.path(),'utf8');expect(JSON.parse(text).rows).toHaveLength(1);expect(text).not.toContain('Private title');expect(text).not.toContain('BEGIN:VCALENDAR');
});

test('evidence package blocks tamper and v16 mobile overview passes Axe',async({page})=>{
  await child(page);const pkg=buildCompatibilityEvidencePackage({compatibilityEvidenceRecords:[{module:'legacy.js',flow:'skills',observed:true,active:false,at:'2026-09-08T01:00:00.000Z'}]});const bad=structuredClone(pkg);bad.records[0].flow='health';
  await page.locator('#v16EvidenceImportForm input[name="file"]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))});await page.locator('#v16EvidenceImportForm button[type="submit"]').click();await expect(page.locator('#v16ApplyEvidenceImport')).toBeDisabled();
  await page.locator('#v16EvidenceImportForm input[name="file"]').setInputFiles({name:'ok.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(pkg))});await page.locator('#v16EvidenceImportForm button[type="submit"]').click();await expect(page.locator('#v16ApplyEvidenceImport')).toBeEnabled();
  await page.setViewportSize({width:390,height:844});const width=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);expect(width[0]).toBeLessThanOrEqual(width[1]);const results=await new AxeBuilder({page}).analyze();expect(results.violations.filter((v)=>['serious','critical'].includes(v.impact))).toEqual([]);
});
