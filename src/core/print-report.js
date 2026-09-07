export const PRINT_SECTIONS = Object.freeze(['profile','learning','skills','habits','portfolio','roadmap','health']);
export const DEFAULT_PRINT_SECTIONS = Object.freeze(['profile','learning','skills','habits','portfolio','roadmap']);

function array(value) { return Array.isArray(value) ? value : []; }
function esc(value='') { return String(value).replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function selectedSections(input=DEFAULT_PRINT_SECTIONS) { return [...new Set(array(input).filter((section)=>PRINT_SECTIONS.includes(section)))]; }
function list(items,render) { return items.length?`<ul>${items.map(render).join('')}</ul>`:'<p class="muted">Chưa có dữ liệu.</p>'; }

export function buildPrintableReport(child = {}, { sections = DEFAULT_PRINT_SECTIONS, title = 'Báo cáo phát triển GrowUP' } = {}) {
  const chosen = selectedSections(sections);
  const includeHealth = chosen.includes('health');
  const blocks = [];
  if (chosen.includes('profile')) {
    const profile=child.developmentProfile||{},education=child.education||{};
    blocks.push(`<section><h2>Hồ sơ phát triển</h2><p><strong>Thế mạnh:</strong> ${esc(array(profile.strengths).join(', ')||'—')}</p><p><strong>Sở thích:</strong> ${esc(array(profile.interests).join(', ')||'—')}</p><p><strong>Nhu cầu hỗ trợ:</strong> ${esc(array(profile.supportNeeds).join(', ')||'—')}</p><p><strong>Đầu ra định hướng:</strong> ${esc(array(education.targetOutcomes).join(', ')||'—')}</p></section>`);
  }
  if (chosen.includes('learning')) blocks.push(`<section><h2>Mục tiêu học tập</h2>${list(array(child.learningGoals),(item)=>`<li><strong>${esc(item.title)}</strong> · ${esc(item.subject||'')}</li>`)}</section>`);
  if (chosen.includes('skills')) blocks.push(`<section><h2>Kỹ năng đã ghi nhận</h2>${list(array(child.skills),(item)=>`<li>${esc(item.name)} · mức ${esc(item.level??'—')}/10 · ${esc(item.date||'')}</li>`)}</section>`);
  if (chosen.includes('habits')) blocks.push(`<section><h2>Thói quen</h2>${list(array(child.habits),(item)=>`<li>${esc(item.title)} · ${esc(item.frequency||'')}</li>`)}</section>`);
  if (chosen.includes('portfolio')) blocks.push(`<section><h2>Portfolio</h2>${list(array(child.portfolio),(item)=>`<li><strong>${esc(item.title)}</strong> · ${esc(item.type||'')} · ${esc(item.date||'')}</li>`)}</section>`);
  if (chosen.includes('roadmap')) blocks.push(`<section><h2>Lộ trình</h2>${list(array(child.roadmap),(item)=>`<li>${esc(item.goal)} · khoảng ${esc(item.age??'—')} tuổi · ${esc(item.area||'')}</li>`)}</section>`);
  if (includeHealth) blocks.push(`<section><h2>Sức khỏe — chỉ vì đã được chọn rõ ràng</h2>${list(array(child.healthRecords),(item)=>`<li>${esc(item.date||'')} · chiều cao ${esc(item.height??'—')} cm · cân nặng ${esc(item.weight??'—')} kg · ngủ ${esc(item.sleep??'—')} giờ</li>`)}</section>`);

  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;max-width:900px;margin:0 auto;padding:32px;color:#17252b;line-height:1.5}header{border-bottom:2px solid #24434f;padding-bottom:16px;margin-bottom:20px}h1{font-size:26px;margin:0 0 6px}h2{font-size:18px;margin-top:24px}section{break-inside:avoid;border-bottom:1px solid #ddd;padding-bottom:12px}ul{padding-left:22px}.muted{opacity:.65}.privacy{font-size:12px;border:1px solid #bbb;padding:10px;border-radius:8px;margin-top:20px}@media print{body{padding:0}.no-print{display:none}}</style></head><body><header><h1>${esc(title)}</h1><div><strong>${esc(child.name||'')}</strong>${child.school?` · ${esc(child.school)}`:''}${child.className?` · ${esc(child.className)}`:''}</div><small>Ngày tạo: ${esc(new Date().toLocaleDateString('vi-VN'))}</small></header>${blocks.join('')}<p class="privacy">Các phần trong báo cáo do người dùng chủ động chọn. Dữ liệu sức khỏe mặc định không được chọn.</p></body></html>`;
}
