import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectEncryptedBackup } from '../src/core/recovery-inspector.js';

test('backup compatibility inspector accepts supported crypto metadata without returning ciphertext',()=>{
  const envelope={
    format:'growup-encrypted-backup-v1',
    generatedAt:'2026-09-07T00:00:00.000Z',
    kdf:{name:'PBKDF2',hash:'SHA-256',iterations:210000,salt:'AAAAAAAAAAAAAAAAAAAAAA=='},
    cipher:{name:'AES-GCM',keyLength:256,iv:'AAAAAAAAAAAAAAAA'},
    ciphertext:'A'.repeat(64)
  };
  const result=inspectEncryptedBackup(envelope);
  assert.equal(result.validJson,true);
  assert.equal(result.supported,true);
  assert.equal(result.kdf,'PBKDF2');
  assert.equal(result.hash,'SHA-256');
  assert.equal(result.cipher,'AES-GCM');
  assert.equal(result.keyLength,256);
  assert.equal('ciphertext' in result,false);
});

test('backup inspector rejects incompatible iteration range',()=>{
  const result=inspectEncryptedBackup({
    format:'growup-encrypted-backup-v1',
    kdf:{name:'PBKDF2',hash:'SHA-256',iterations:1},
    cipher:{name:'AES-GCM',keyLength:256},
    ciphertext:'A'.repeat(64)
  });
  assert.equal(result.supported,false);
  assert.ok(result.issues.some((issue)=>issue.includes('PBKDF2')));
});
