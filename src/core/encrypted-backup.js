import { buildBackupEnvelope, verifyBackupEnvelope } from './backup.js';

const FORMAT = 'growup-encrypted-backup-v1';
const ITERATIONS = 210000;

function cryptoApi() {
  if (!globalThis.crypto?.subtle || !globalThis.crypto?.getRandomValues) throw new Error('Thiết bị/trình duyệt không hỗ trợ Web Crypto cần thiết.');
  return globalThis.crypto;
}

function bytesToBase64(bytes) {
  let binary='';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(String(value || ''));
  return Uint8Array.from(binary,(char)=>char.charCodeAt(0));
}

async function deriveKey(passphrase,salt,usages,iterations=ITERATIONS) {
  const api=cryptoApi();
  const material=await api.subtle.importKey('raw',new TextEncoder().encode(passphrase),'PBKDF2',false,['deriveKey']);
  return api.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations},material,{name:'AES-GCM',length:256},false,usages);
}

function validatePassphrase(passphrase) {
  const value=String(passphrase || '');
  if (value.length < 10) throw new Error('Mật khẩu backup cần ít nhất 10 ký tự.');
  return value;
}

export async function encryptPortableBackup(payload,passphrase) {
  const secret=validatePassphrase(passphrase);
  const api=cryptoApi();
  const salt=api.getRandomValues(new Uint8Array(16));
  const iv=api.getRandomValues(new Uint8Array(12));
  const key=await deriveKey(secret,salt,['encrypt']);
  const backup=await buildBackupEnvelope(payload);
  const plaintext=new TextEncoder().encode(JSON.stringify(backup));
  const ciphertext=await api.subtle.encrypt({name:'AES-GCM',iv},key,plaintext);
  return {
    format:FORMAT,
    generatedAt:new Date().toISOString(),
    kdf:{name:'PBKDF2',hash:'SHA-256',iterations:ITERATIONS,salt:bytesToBase64(salt)},
    cipher:{name:'AES-GCM',keyLength:256,iv:bytesToBase64(iv)},
    ciphertext:bytesToBase64(new Uint8Array(ciphertext))
  };
}

export async function decryptPortableBackup(input,passphrase) {
  const secret=validatePassphrase(passphrase);
  const envelope=typeof input === 'string' ? JSON.parse(input) : input;
  if (!envelope || envelope.format !== FORMAT) throw new Error('Không phải backup mã hóa GrowUP được hỗ trợ.');
  if (envelope.kdf?.name !== 'PBKDF2' || envelope.kdf?.hash !== 'SHA-256') throw new Error('Thông số KDF của backup không được hỗ trợ.');
  if (envelope.cipher?.name !== 'AES-GCM' || Number(envelope.cipher?.keyLength)!==256) throw new Error('Thông số mã hóa của backup không được hỗ trợ.');
  const iterations=Number(envelope.kdf?.iterations);
  if (!Number.isInteger(iterations) || iterations < 100000 || iterations > 1000000) throw new Error('Số vòng dẫn xuất khóa không hợp lệ.');
  try {
    const salt=base64ToBytes(envelope.kdf.salt);
    const iv=base64ToBytes(envelope.cipher.iv);
    if (salt.length < 16 || iv.length !== 12) throw new Error('metadata');
    const key=await deriveKey(secret,salt,['decrypt'],iterations);
    const plaintext=await cryptoApi().subtle.decrypt({name:'AES-GCM',iv},key,base64ToBytes(envelope.ciphertext));
    const backup=JSON.parse(new TextDecoder().decode(plaintext));
    const verified=await verifyBackupEnvelope(backup);
    if (!verified.valid) throw new Error('integrity');
    return verified;
  } catch {
    throw new Error('Không thể giải mã backup. Mật khẩu sai hoặc tệp đã bị thay đổi/hỏng.');
  }
}

export function encryptedBackupInfo(input = {}) {
  const envelope=typeof input === 'string' ? JSON.parse(input) : input;
  return {
    supported:Boolean(envelope && envelope.format===FORMAT && envelope.cipher?.name==='AES-GCM' && envelope.kdf?.name==='PBKDF2'),
    format:envelope?.format || null,
    generatedAt:envelope?.generatedAt || null,
    iterations:Number(envelope?.kdf?.iterations)||null
  };
}

export const ENCRYPTED_BACKUP_FORMAT = FORMAT;
export const ENCRYPTED_BACKUP_RECOVERY_WARNING = 'GrowUP không lưu mật khẩu backup. Nếu quên mật khẩu thì tệp mã hóa không thể được khôi phục bởi ứng dụng.';
