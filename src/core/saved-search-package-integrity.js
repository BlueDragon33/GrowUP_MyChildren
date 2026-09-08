import { canonicalStringify, sha256Hex } from './export-integrity.js';
import { buildSavedSearchCriteriaPackage } from './saved-search-package.js';

export const SAVED_SEARCH_INTEGRITY_FORMAT='growup-saved-search-criteria-integrity-v1';
const MAX_RECEIPTS=50;

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=80){return typeof value==='string'?value.trim().slice(0,max):'';}
function payloadWithoutManifest(pkg={}){const copy=structuredClone(pkg);delete copy.manifest;return copy;}

export function withSavedSearchPackageManifest(pkg={}){
  const payload=payloadWithoutManifest(pkg),checksum=sha256Hex(canonicalStringify(payload));
  return {...payload,manifest:{format:SAVED_SEARCH_INTEGRITY_FORMAT,algorithm:'SHA-256',scope:'canonical-package-without-manifest',checksum,viewCount:Array.isArray(payload.views)?payload.views.length:0}};
}

export function buildIntegritySavedSearchCriteriaPackage(settings={}){
  return withSavedSearchPackageManifest(buildSavedSearchCriteriaPackage(settings));
}

export function verifySavedSearchCriteriaPackageIntegrity(pkg={}){
  const expected=text(pkg?.manifest?.checksum,128),actual=sha256Hex(canonicalStringify(payloadWithoutManifest(pkg)));
  return {valid:Boolean(expected)&&pkg?.manifest?.format===SAVED_SEARCH_INTEGRITY_FORMAT&&pkg?.manifest?.algorithm==='SHA-256'&&expected===actual,format:pkg?.manifest?.format||null,algorithm:'SHA-256',expected,actual};
}

export function savedSearchPackageVerificationReceipts(settings={}){
  return array(settings.savedSearchPackageVerificationReceipts).slice(-MAX_RECEIPTS).map((item)=>({at:new Date(item.at).toISOString(),format:text(item.format,80)||'unknown',algorithm:text(item.algorithm,40)||'unknown',result:item.result==='valid'?'valid':'invalid'}));
}

export function recordSavedSearchPackageVerificationReceipt(settings={},verification={},at=new Date().toISOString()){
  const receipt={at:new Date(at).toISOString(),format:text(verification.format,80)||'unknown',algorithm:text(verification.algorithm,40)||'unknown',result:verification.valid?'valid':'invalid'};
  return {...settings,savedSearchPackageVerificationReceipts:[...savedSearchPackageVerificationReceipts(settings),receipt].slice(-MAX_RECEIPTS)};
}

export const SAVED_SEARCH_PACKAGE_INTEGRITY_NOTE='Manifest dùng SHA-256 để phát hiện thay đổi của package criteria. Receipt xác minh chỉ giữ timestamp/format/algorithm/valid-invalid; không lưu checksum raw, query result, snippet, Health/Nutrition payload hay toàn bộ package đã nhập.';
