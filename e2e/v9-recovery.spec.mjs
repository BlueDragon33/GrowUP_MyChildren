import { test, expect } from '@playwright/test';

async function createChild(page){
  await page.goto('/');
  await page.locator('#emptyAddChild').click();
  await page.locator('#childForm input[name="name"]').fill('Recovery Test');
  await page.locator('#childForm input[name="dateOfBirth"]').fill('2018-01-01');
  await page.locator('#childForm button.primary').click();
}

test('compatibility inspector reports crypto metadata without restoring data',async({page})=>{
  await createChild(page);
  const envelope={
    format:'growup-encrypted-backup-v1',
    generatedAt:'2026-09-07T00:00:00.000Z',
    kdf:{name:'PBKDF2',hash:'SHA-256',iterations:210000,salt:'AAAAAAAAAAAAAAAAAAAAAA=='},
    cipher:{name:'AES-GCM',keyLength:256,iv:'AAAAAAAAAAAAAAAA'},
    ciphertext:'A'.repeat(64)
  };
  const form=page.locator('#v9RecoveryForm');
  await form.locator('input[type="file"]').setInputFiles({name:'inspect.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(envelope))});
  await form.locator('[data-recovery-action="inspect"]').click();
  await expect(page.locator('#v9RecoveryResult')).toContainText('Tương thích');
  await expect(page.locator('#v9RecoveryResult')).toContainText('PBKDF2');
  const name=await page.evaluate(()=>JSON.parse(localStorage.getItem('growup_mychildren_v1')).children[0].name);
  expect(name).toBe('Recovery Test');
});
