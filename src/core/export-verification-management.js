import { exportVerificationReceipts } from './export-verification-history.js';

export const EXPORT_VERIFICATION_RECEIPT_PACKAGE_FORMAT='growup-safe-export-verification-receipts-v1';

function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''));}

export function filterExportVerificationReceipts(settings={},criteria={}){
  const result=criteria.result==='valid'||criteria.result==='invalid'?criteria.result:'';
  const format=text(criteria.format,80).toLowerCase();
  const fromDate=validDate(criteria.fromDate)?criteria.fromDate:'';
  const toDate=validDate(criteria.toDate)?criteria.toDate:'';
  return exportVerificationReceipts(settings).filter((receipt)=>{
    const day=String(receipt.at||'').slice(0,10);
    return (!result||receipt.checksumResult===result)&&(!format||String(receipt.format||'').toLowerCase().includes(format))&&(!fromDate||day>=fromDate)&&(!toDate||day<=toDate);
  });
}

export function exportVerificationReceiptFormats(settings={}){
  return [...new Set(exportVerificationReceipts(settings).map((item)=>item.format).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}

export function buildExportVerificationReceiptPackage(settings={},criteria={}){
  return {
    format:EXPORT_VERIFICATION_RECEIPT_PACKAGE_FORMAT,
    version:1,
    createdAt:new Date().toISOString(),
    receipts:filterExportVerificationReceipts(settings,criteria)
  };
}

export function clearExportVerificationReceipts(settings={}){
  return {...settings,safeExportVerificationReceipts:[]};
}

export const EXPORT_VERIFICATION_MANAGEMENT_NOTE='Lọc/xuất/xóa chỉ tác động lịch sử receipt metadata. File xuất không chứa checksum raw/expected/actual, tên file nguồn, preview, payload safe export, dữ liệu trẻ, Health/Nutrition hoặc free-text từ gói đã kiểm tra; thao tác xóa phải được UI xác nhận rõ ràng.';
