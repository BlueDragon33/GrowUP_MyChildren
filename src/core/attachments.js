const KINDS = new Set(['link', 'document', 'image', 'video', 'certificate', 'project', 'other']);

export function normalizeUrl(value = '') {
  const text = String(value).trim();
  if (!text) return '';
  try {
    const url = new URL(text);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

export function createAttachmentMeta(input = {}) {
  const title = String(input.title || '').trim();
  if (!title) throw new Error('Minh chứng cần có tiêu đề.');
  const kind = KINDS.has(input.kind) ? input.kind : 'other';
  const url = normalizeUrl(input.url);
  if (input.url && !url) throw new Error('Liên kết minh chứng phải dùng http hoặc https.');
  return {
    id: input.id || `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    title,
    kind,
    url,
    fileName: String(input.fileName || '').trim(),
    mimeType: String(input.mimeType || '').trim(),
    sizeBytes: Math.max(0, Number(input.sizeBytes) || 0),
    note: String(input.note || '').trim(),
    createdAt: input.createdAt || new Date().toISOString()
  };
}

export function attachmentStats(items = []) {
  return items.reduce((stats, item) => {
    stats.total += 1;
    stats.byKind[item.kind || 'other'] = (stats.byKind[item.kind || 'other'] || 0) + 1;
    return stats;
  }, { total: 0, byKind: {} });
}
