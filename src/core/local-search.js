const SEARCH_DATASETS = Object.freeze(['learning','skills','portfolio','roadmap','familyPlan']);
const TARGET_PAGE = Object.freeze({learning:'learning',skills:'skills',portfolio:'portfolio',roadmap:'roadmap',familyPlan:'overview'});

function array(value){return Array.isArray(value)?value:[];}
function text(value,max=240){return typeof value==='string'?value.trim().slice(0,max):'';}
function normalized(value){return text(value,500).toLocaleLowerCase('vi-VN').normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function safeDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))?String(value):'';}

function item(dataset,child,source,title,subtitle,date=''){
  return {
    dataset,
    targetPage:TARGET_PAGE[dataset] || 'overview',
    childId:child?.id || '',
    childName:text(child?.name,100),
    sourceId:text(source?.id,100),
    domainId:text(source?.developmentDomainId,80),
    title:text(title,160),
    subtitle:text(subtitle,220),
    date:safeDate(date)
  };
}

export function buildSafeSearchIndex(state = {}) {
  const results=[];
  for(const child of array(state.children)){
    for(const goal of array(child.learningGoals)) results.push(item('learning',child,goal,goal.title,goal.subject,goal.dueDate));
    for(const skill of array(child.skills)) results.push(item('skills',child,skill,skill.name,`Level ${Number(skill.level)||0}`,skill.date));
    for(const entry of array(child.portfolio)) results.push(item('portfolio',child,entry,entry.title,entry.type,entry.date));
    for(const milestone of array(child.roadmap)) results.push(item('roadmap',child,milestone,milestone.goal,`${milestone.area||''}${milestone.age?` · ${milestone.age} tuổi`:''}`));
  }
  const childMap=new Map(array(state.children).map((child)=>[child.id,child]));
  for(const plan of array(state.settings?.familyPlanItems)){
    const child=childMap.get(plan.childId) || {id:plan.childId,name:''};
    results.push(item('familyPlan',child,plan,plan.title,`${Number(plan.minutes)||0} phút`,plan.date));
  }
  return results.filter((entry)=>entry.title);
}

export function advancedSafeSearch(state = {}, options = {}) {
  const q=normalized(options.query||'');
  const datasets=new Set(array(options.datasets).filter((name)=>SEARCH_DATASETS.includes(name)));
  const domains=new Set(array(options.domainIds).map((id)=>text(id,80)).filter(Boolean));
  const childId=text(options.childId,100);
  const fromDate=safeDate(options.fromDate);
  const toDate=safeDate(options.toDate);
  const binding=options.binding==='bound'||options.binding==='unbound'?options.binding:'';
  const limit=Math.min(100,Math.max(1,Number(options.limit)||30));
  return buildSafeSearchIndex(state)
    .filter((entry)=>!datasets.size || datasets.has(entry.dataset))
    .filter((entry)=>!childId || entry.childId===childId)
    .filter((entry)=>!domains.size || domains.has(entry.domainId))
    .filter((entry)=>binding!=='bound' || Boolean(entry.domainId))
    .filter((entry)=>binding!=='unbound' || !entry.domainId)
    .filter((entry)=>!fromDate || (entry.date && entry.date>=fromDate))
    .filter((entry)=>!toDate || (entry.date && entry.date<=toDate))
    .map((entry)=>{
      if(!q)return {...entry,score:1};
      const haystack=normalized(`${entry.title} ${entry.subtitle} ${entry.childName}`);
      const pos=haystack.indexOf(q);
      return {...entry,score:pos===0?2:pos>=0?1:0};
    })
    .filter((entry)=>entry.score>0)
    .sort((a,b)=>b.score-a.score || String(b.date).localeCompare(String(a.date)) || a.title.localeCompare(b.title,'vi'))
    .slice(0,limit)
    .map(({score,...entry})=>entry);
}

export function searchSafeDevelopment(state = {}, query = '', options = {}) {
  const q=normalized(query);
  if(!q)return [];
  return advancedSafeSearch(state,{...options,query});
}

export const SAFE_SEARCH_DATASETS = SEARCH_DATASETS;
export const SAFE_SEARCH_TARGET_PAGES = TARGET_PAGE;
export const SAFE_SEARCH_NOTE = 'Chỉ lập chỉ mục metadata học tập, kỹ năng, portfolio, roadmap và kế hoạch gia đình. Health/Nutrition, ghi chú sức khỏe và ghi chú portfolio không được đưa vào chỉ mục.';
