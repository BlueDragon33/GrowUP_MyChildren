export const TAXONOMY_VERSION = '2026.1';

export const DEFAULT_DEVELOPMENT_DOMAINS = Object.freeze([
  { id:'learning', label:'Học tập', description:'Mục tiêu học tập và phương pháp tự học' },
  { id:'cognition', label:'Tư duy', description:'Logic, ghi nhớ, giải quyết vấn đề và tư duy phản biện' },
  { id:'language', label:'Ngôn ngữ', description:'Tiếng Việt, ngoại ngữ, đọc, viết và diễn đạt' },
  { id:'social-emotional', label:'Xã hội & cảm xúc', description:'Giao tiếp, hợp tác, tự nhận thức và điều tiết cảm xúc' },
  { id:'creativity', label:'Sáng tạo', description:'Nghệ thuật, thiết kế, tưởng tượng và tạo sản phẩm' },
  { id:'digital-ai', label:'Số & AI', description:'Năng lực số, an toàn số, lập trình và sử dụng AI có trách nhiệm' },
  { id:'physical', label:'Thể chất', description:'Vận động, sức bền, phối hợp và thể thao' },
  { id:'health', label:'Sức khỏe', description:'Chăm sóc sức khỏe, giấc ngủ và thói quen lành mạnh; không chứa hồ sơ y tế thô' },
  { id:'life-skills', label:'Kỹ năng sống', description:'Tự phục vụ, trách nhiệm, tài chính cá nhân và năng lực thích nghi' },
  { id:'interests', label:'Sở thích & khám phá', description:'Khám phá lĩnh vực yêu thích mà không khóa trẻ vào một nghề cố định' }
]);

function text(value, max = 80) { return typeof value === 'string' ? value.trim().slice(0,max) : ''; }
function safeId(value) { return text(value,48).toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,''); }

export function normalizeTaxonomyConfig(input = {}) {
  const labels = input.labels && typeof input.labels === 'object' && !Array.isArray(input.labels) ? input.labels : {};
  const disabled = Array.isArray(input.disabledDomainIds) ? input.disabledDomainIds.map(safeId).filter(Boolean) : [];
  const custom = Array.isArray(input.customDomains) ? input.customDomains.map((domain) => ({
    id: `custom-${safeId(String(domain?.id || domain?.label || ''))}`,
    label: text(domain?.label,60),
    description: text(domain?.description,180)
  })).filter((domain) => domain.id !== 'custom-' && domain.label) : [];
  return {
    taxonomyVersion: text(input.taxonomyVersion,24) || TAXONOMY_VERSION,
    labels: Object.fromEntries(Object.entries(labels).map(([id,label]) => [safeId(id),text(label,60)]).filter(([id,label]) => id && label)),
    disabledDomainIds: [...new Set(disabled)],
    customDomains: [...new Map(custom.map((domain) => [domain.id,domain])).values()],
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : null
  };
}

export function resolvedDevelopmentDomains(input = {}) {
  const config = normalizeTaxonomyConfig(input);
  const disabled = new Set(config.disabledDomainIds);
  const defaults = DEFAULT_DEVELOPMENT_DOMAINS.map((domain) => ({
    ...domain,
    label: config.labels[domain.id] || domain.label,
    enabled: !disabled.has(domain.id),
    source:'default',
    taxonomyVersion:TAXONOMY_VERSION
  }));
  return [...defaults, ...config.customDomains.map((domain) => ({...domain,enabled:!disabled.has(domain.id),source:'custom',taxonomyVersion:config.taxonomyVersion}))];
}

export function taxonomySnapshot(input = {}) {
  const config = normalizeTaxonomyConfig(input);
  return {
    taxonomyVersion: config.taxonomyVersion,
    currentDefinitionVersion: TAXONOMY_VERSION,
    needsReview: config.taxonomyVersion !== TAXONOMY_VERSION,
    domains: resolvedDevelopmentDomains(config)
  };
}
