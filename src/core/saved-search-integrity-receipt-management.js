import { savedSearchPackageVerificationReceipts } from './saved-search-package-integrity.js';

export const SAVED_SEARCH_RECEIPT_PACKAGE_FORMAT='growup-saved-search-integrity-receipts-v1';

function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''));}

export function filterSavedSearchIntegrityReceipts(settings={},criteria={}){
  const result=criteria.result==='valid'||criteria.result==='invalid'?criteria.result:'';
  const format=text(criteria.format,80).toLowerCase();
  const fromDate=validDate(criteria.fromDate)?criteria.fromDate:'';
  const toDate=validDate(criteria.toDate)?criteria.toDate:'';
  return savedSearchPackageVerificationReceipts(settings).filter((receipt)=>{
    const day=String(receipt.at||'').slice(0,10);
    return (!result||receipt.result===result)&&(!format||String(receipt.format||'').toLowerCase().includes(format))&&(!fromDate||day>=fromDate)&&(!toDate||day<=toDate);
  });
}

export function savedSearchIntegrityReceiptFormats(settings={}){
  return [...new Set(savedSearchPackageVerificationReceipts(settings).map((item)=>item.format).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}

export function buildSavedSearchIntegrityReceiptPackage(settings={},criteria={}){
  return {format:SAVED_SEARCH_RECEIPT_PACKAGE_FORMAT,version:1,createdAt:new Date().toISOString(),receipts:filterSavedSearchIntegrityReceipts(settings,criteria)};
}

export function clearSavedSearchIntegrityReceipts(settings={}){
  return {...settings,savedSearchPackageVerificationReceipts:[]};
}

export const SAVED_SEARCH_RECEIPT_MANAGEMENT_NOTE='Quản lý receipt Saved Search chỉ lọc/xuất/xóa metadata at/format/algorithm/valid-invalid đã giới hạn ở store v1.5. File quản lý không chứa checksum expected/actual, query result, snippet, Health/Nutrition payload hay package criteria gốc.';
