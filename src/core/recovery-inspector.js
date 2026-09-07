import { encryptedBackupInfo, decryptPortableBackup, ENCRYPTED_BACKUP_FORMAT } from './encrypted-backup.js';

export function inspectEncryptedBackup(input = {}) {
  let envelope;
  try { envelope=typeof input==='string'?JSON.parse(input):input; }
  catch { return {validJson:false,supported:false,format:null,issues:['Tệp không phải JSON hợp lệ.']}; }
  const info=encryptedBackupInfo(envelope||{});
  const issues=[];
  if(envelope?.format!==ENCRYPTED_BACKUP_FORMAT) issues.push('Định dạng backup mã hóa không được hỗ trợ.');
  if(envelope?.kdf?.name!=='PBKDF2' || envelope?.kdf?.hash!=='SHA-256') issues.push('KDF không tương thích.');
  const iterations=Number(envelope?.kdf?.iterations);
  if(!Number.isInteger(iterations) || iterations<100000 || iterations>1000000) issues.push('Số vòng PBKDF2 ngoài phạm vi hỗ trợ.');
  if(envelope?.cipher?.name!=='AES-GCM' || Number(envelope?.cipher?.keyLength)!==256) issues.push('Cipher không tương thích.');
  if(typeof envelope?.ciphertext!=='string' || envelope.ciphertext.length<32) issues.push('Ciphertext bị thiếu hoặc không hợp lệ.');
  return {
    validJson:true,
    supported:info.supported && issues.length===0,
    format:info.format,
    generatedAt:info.generatedAt,
    kdf:envelope?.kdf?.name || null,
    hash:envelope?.kdf?.hash || null,
    iterations:Number.isFinite(iterations)?iterations:null,
    cipher:envelope?.cipher?.name || null,
    keyLength:Number(envelope?.cipher?.keyLength)||null,
    issues
  };
}

export async function runRecoveryDrill(input,passphrase) {
  const inspection=inspectEncryptedBackup(input);
  if(!inspection.supported) return {success:false,inspection,preview:null,error:'Backup chưa tương thích nên không thể chạy recovery drill.'};
  try {
    const verified=await decryptPortableBackup(input,passphrase);
    return {
      success:true,
      inspection,
      preview:verified.preview,
      schemaVersion:verified.payload?.version || null,
      error:null
    };
  } catch (error) {
    return {success:false,inspection,preview:null,error:error?.message || 'Không thể kiểm tra khả năng khôi phục.'};
  }
}

export const RECOVERY_DRILL_NOTE='Recovery drill chỉ giải mã và kiểm checksum trong bộ nhớ để xác nhận khả năng khôi phục; không ghi dữ liệu vào localStorage và không hiển thị passphrase/ciphertext.';
