import { verifySavedSearchReceiptImportHistoryPackage, reviewSavedSearchReceiptImportHistoryPackage } from './saved-search-receipt-import-history-package-integrity.js';

export const SAVED_SEARCH_RECEIPT_HISTORY_PACKAGE_VERIFICATION_RECEIPTS_FORMAT='growup-saved-search-receipt-history-package-verification-receipts-v1';
const MAX_RECEIPTS=50;

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
function count(value){return Math.max(0,Math.min(9999,Number(value)||0));}
function normalizeReceipt(item={}){const at=iso(item.at),result=item.result==='valid'||item.result==='invalid'?item.result:'';if(!at||!result)return null;return {at,format:text(item.format,80)||'unknown',algorithm:text(item.algorithm,40)||'unknown',result,importCount:count(item.importCount),receiptCount:count(item.receiptCount)};}
function criteriaOf(criteria={}){return {result:criteria.result==='valid'||criteria.result==='invalid'?criteria.result:'all',format:text(criteria.format,80)};}
function matches(item,criteria){if(criteria.result!=='all'&&item.result!==criteria.result)return false;if(criteria.format&&item.format!==criteria.format)return false;return true;}

export function savedSearchReceiptHistoryPackageVerificationReceipts(settings={}){
  return array(settings.savedSearchReceiptHistoryPackageVerificationReceipts).map(normalizeReceipt).filter(Boolean).slice(-MAX_RECEIPTS);
}

export function verifySavedSearchReceiptHistoryPackageAndRecord(settings={},pkg={},at=new Date().toISOString()){
  const verification=verifySavedSearchReceiptImportHistoryPackage(pkg),review=reviewSavedSearchReceiptImportHistoryPackage(pkg),receipt={at:iso(at)||new Date().toISOString(),format:text(verification.format,80)||'unknown',algorithm:text(verification.algorithm,40)||'SHA-256',result:verification.valid?'valid':'invalid',importCount:verification.valid?count(review.importCount):0,receiptCount:verification.valid?count(review.receiptCount):0},current=savedSearchReceiptHistoryPackageVerificationReceipts(settings);
  return {settings:{...settings,savedSearchReceiptHistoryPackageVerificationReceipts:[...current,receipt].slice(-MAX_RECEIPTS)},verification,review,receipt,changed:true};
}

export function filterSavedSearchReceiptHistoryPackageVerificationReceipts(settings={},criteria={}){
  const normalized=criteriaOf(criteria);return savedSearchReceiptHistoryPackageVerificationReceipts(settings).filter((item)=>matches(item,normalized));
}

export function buildSavedSearchReceiptHistoryPackageVerificationReceiptPackage(settings={},criteria={}){
  const normalized=criteriaOf(criteria);return {format:SAVED_SEARCH_RECEIPT_HISTORY_PACKAGE_VERIFICATION_RECEIPTS_FORMAT,version:1,criteria:normalized,receipts:filterSavedSearchReceiptHistoryPackageVerificationReceipts(settings,normalized)};
}

export function clearSavedSearchReceiptHistoryPackageVerificationReceipts(settings={},criteria={},confirmed=false){
  if(!confirmed)return {settings,changed:false,removed:0,reason:'confirmation-required'};
  const normalized=criteriaOf(criteria),current=savedSearchReceiptHistoryPackageVerificationReceipts(settings),remaining=current.filter((item)=>!matches(item,normalized)),removed=current.length-remaining.length;if(!removed)return {settings,changed:false,removed:0,reason:'nothing-to-clear'};
  return {settings:{...settings,savedSearchReceiptHistoryPackageVerificationReceipts:remaining},changed:true,removed,reason:'cleared'};
}

export const SAVED_SEARCH_RECEIPT_HISTORY_PACKAGE_VERIFICATION_RECEIPTS_NOTE='Lượt 123 ghi tối đa 50 verification receipt cho package history L118, chỉ gồm at/format/algorithm/result/importCount/receiptCount. Verify không restore/import Saved Search history, không chạm criteria/result/snippet và package quản lý receipt không chứa raw checksum hay dữ liệu trẻ.';
