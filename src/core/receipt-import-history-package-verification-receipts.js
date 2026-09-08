import { verifyReceiptImportHistoryPackage, reviewReceiptImportHistoryPackage } from './receipt-import-history-package-integrity.js';

export const RECEIPT_IMPORT_HISTORY_PACKAGE_VERIFICATION_RECEIPTS_FORMAT='growup-receipt-import-history-package-verification-receipts-v1';
const MAX_RECEIPTS=50;

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function iso(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:d.toISOString();}
function count(value){return Math.max(0,Math.min(9999,Number(value)||0));}
function normalizeReceipt(item={}){const at=iso(item.at),result=item.result==='valid'||item.result==='invalid'?item.result:'';if(!at||!result)return null;return {at,format:text(item.format,80)||'unknown',algorithm:text(item.algorithm,40)||'unknown',result,importCount:count(item.importCount),receiptCount:count(item.receiptCount)};}
function criteriaOf(criteria={}){return {result:criteria.result==='valid'||criteria.result==='invalid'?criteria.result:'all',format:text(criteria.format,80)};}
function matches(item,criteria){if(criteria.result!=='all'&&item.result!==criteria.result)return false;if(criteria.format&&item.format!==criteria.format)return false;return true;}

export function receiptImportHistoryPackageVerificationReceipts(settings={}){
  return array(settings.receiptImportHistoryPackageVerificationReceipts).map(normalizeReceipt).filter(Boolean).slice(-MAX_RECEIPTS);
}

export function verifyReceiptImportHistoryPackageAndRecord(settings={},pkg={},at=new Date().toISOString()){
  const verification=verifyReceiptImportHistoryPackage(pkg),review=reviewReceiptImportHistoryPackage(pkg),receipt={at:iso(at)||new Date().toISOString(),format:text(verification.format,80)||'unknown',algorithm:text(verification.algorithm,40)||'SHA-256',result:verification.valid?'valid':'invalid',importCount:verification.valid?count(review.importCount):0,receiptCount:verification.valid?count(review.receiptCount):0};
  const current=receiptImportHistoryPackageVerificationReceipts(settings),next={...settings,receiptImportHistoryPackageVerificationReceipts:[...current,receipt].slice(-MAX_RECEIPTS)};
  return {settings:next,verification,review,receipt,changed:true};
}

export function filterReceiptImportHistoryPackageVerificationReceipts(settings={},criteria={}){
  const normalized=criteriaOf(criteria);return receiptImportHistoryPackageVerificationReceipts(settings).filter((item)=>matches(item,normalized));
}

export function buildReceiptImportHistoryPackageVerificationReceiptPackage(settings={},criteria={}){
  const normalized=criteriaOf(criteria),receipts=filterReceiptImportHistoryPackageVerificationReceipts(settings,normalized);
  return {format:RECEIPT_IMPORT_HISTORY_PACKAGE_VERIFICATION_RECEIPTS_FORMAT,version:1,criteria:normalized,receipts};
}

export function clearReceiptImportHistoryPackageVerificationReceipts(settings={},criteria={},confirmed=false){
  if(!confirmed)return {settings,changed:false,removed:0,reason:'confirmation-required'};
  const normalized=criteriaOf(criteria),current=receiptImportHistoryPackageVerificationReceipts(settings),remaining=current.filter((item)=>!matches(item,normalized)),removed=current.length-remaining.length;
  if(!removed)return {settings,changed:false,removed:0,reason:'nothing-to-clear'};
  return {settings:{...settings,receiptImportHistoryPackageVerificationReceipts:remaining},changed:true,removed,reason:'cleared'};
}

export const RECEIPT_IMPORT_HISTORY_PACKAGE_VERIFICATION_RECEIPTS_NOTE='Receipt xác minh history package chỉ giữ at/format/algorithm/valid-invalid/importCount/receiptCount và tối đa 50 mục. Không lưu source package, manifest nguồn, expected/actual checksum, raw receipt payload hay dữ liệu trẻ. Verify không khôi phục/import history package vào state.';
