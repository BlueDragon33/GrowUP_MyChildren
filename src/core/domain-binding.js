import { TAXONOMY_VERSION, resolvedDevelopmentDomains } from './taxonomy.js';

export const DOMAIN_BINDABLE_TYPES = Object.freeze(['learningGoal','skill','portfolio']);

function text(value,max=100){return typeof value==='string'?value.trim().slice(0,max):'';}

export function developmentDomainOptions(taxonomyConfig = {}) {
  return resolvedDevelopmentDomains(taxonomyConfig).filter((domain)=>domain.enabled).map((domain)=>({
    id:domain.id,
    label:domain.label,
    taxonomyVersion:domain.taxonomyVersion || TAXONOMY_VERSION,
    source:domain.source
  }));
}

export function bindDevelopmentDomain(record = {}, domainId = '', taxonomyConfig = {}) {
  const id=text(domainId,80);
  if(!id) return {...record};
  const domain=developmentDomainOptions(taxonomyConfig).find((item)=>item.id===id);
  if(!domain) return {...record};
  return {
    ...record,
    developmentDomainId:domain.id,
    developmentDomainLabelSnapshot:domain.label,
    developmentTaxonomyVersion:domain.taxonomyVersion || TAXONOMY_VERSION
  };
}

export function domainBindingOf(record = {}, taxonomyConfig = {}) {
  const domainId=text(record.developmentDomainId,80);
  if(!domainId) return {bound:false,domainId:null,label:null,taxonomyVersion:null,legacy:true};
  const current=resolvedDevelopmentDomains(taxonomyConfig).find((domain)=>domain.id===domainId);
  const snapshot=text(record.developmentDomainLabelSnapshot,100);
  return {
    bound:true,
    domainId,
    label:snapshot || current?.label || domainId,
    currentLabel:current?.label || null,
    taxonomyVersion:text(record.developmentTaxonomyVersion,30) || null,
    legacy:false,
    taxonomyChanged:Boolean(current && snapshot && current.label!==snapshot)
  };
}

export function legacyRecordLabel(record = {}, type = '') {
  if(type==='learningGoal') return text(record.subject,100) || 'Mục tiêu học tập cũ';
  if(type==='skill') return text(record.name,100) || 'Kỹ năng cũ';
  if(type==='portfolio') return text(record.type,100) || 'Portfolio cũ';
  return 'Bản ghi cũ';
}
