import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function createChild(page,name='Bé v0.8') {
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill(name);
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2018-01-01');
  await page.locator('#childForm button.primary').click();
  await expect(page.locator('[data-v8="family-plan"]')).toBeVisible();
}

test('family planning stores time commitments without ranking fields', async ({ page }) => {
  await createChild(page,'Bé Lịch');
  const form=page.locator('#v8FamilyPlanForm');
  await form.locator('input[name="date"]').fill('2026-09-10');
  await form.locator('input[name="title"]').fill('Bơi ếch');
  await form.locator('input[name="minutes"]').fill('75');
  await form.locator('button[type="submit"]').click();
  await expect(page.locator('[data-v8="family-plan"]')).toContainText('Bơi ếch');
  await expect(page.locator('[data-v8="family-plan"]')).toContainText('75 phút');
  const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')));
  expect(stored.settings.familyPlanItems).toHaveLength(1);
  expect(stored.settings.familyPlanItems[0].minutes).toBe(75);
  expect(stored.settings.familyPlanItems[0].rank).toBeUndefined();
  expect(stored.settings.familyPlanItems[0].score).toBeUndefined();
});

test('encrypted backup download hides plaintext and confirmed restore recovers the original state', async ({ page }) => {
  await createChild(page,'Bé Mã Hóa');
  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    state.children[0].healthRecords=[{id:'health-test',date:'2026-09-07',height:123.4,weight:24.5,note:'ghi chú sức khỏe bí mật'}];
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  });
  await page.reload();
  await expect(page.locator('#v8EncryptForm')).toBeVisible();
  const pass='MatKhau-TrinhDuyet-2026!';
  await page.locator('#v8EncryptForm input[name="passphrase"]').fill(pass);
  await page.locator('#v8EncryptForm input[name="confirmPassphrase"]').fill(pass);
  page.once('dialog', async (dialog)=>{ expect(dialog.type()).toBe('alert'); await dialog.accept(); });
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#v8EncryptForm button[type="submit"]').click();
  const encryptedDownload=await downloadPromise;
  const encryptedPath=await encryptedDownload.path();
  expect(encryptedPath).toBeTruthy();
  const encryptedText=await readFile(encryptedPath,'utf8');
  expect(encryptedText).toContain('growup-encrypted-backup-v1');
  for(const plaintext of ['Bé Mã Hóa','123.4','ghi chú sức khỏe bí mật']) expect(encryptedText).not.toContain(plaintext);

  await page.evaluate(()=>{
    const state=JSON.parse(localStorage.getItem('growup_mychildren_v1'));
    state.children[0].name='Tên đã thay đổi';
    state.children[0].healthRecords=[];
    localStorage.setItem('growup_mychildren_v1',JSON.stringify(state));
  });
  await page.reload();
  await expect(page.locator('.badge')).toContainText('Tên đã thay đổi');
  const restore=page.locator('#v8DecryptForm');
  await restore.locator('input[type="file"]').setInputFiles(encryptedPath);
  await restore.locator('input[name="passphrase"]').fill(pass);
  page.once('dialog', async (dialog)=>{
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toContain('Khôi phục sẽ thay thế dữ liệu cục bộ hiện tại');
    await dialog.accept();
  });
  await restore.locator('button[type="submit"]').click();
  await expect(page.locator('.badge')).toContainText('Bé Mã Hóa');
  const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')));
  expect(restored.children[0].name).toBe('Bé Mã Hóa');
  expect(restored.children[0].healthRecords[0].height).toBe(123.4);
});
