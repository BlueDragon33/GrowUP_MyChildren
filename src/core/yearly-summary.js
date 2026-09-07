import { buildDevelopmentTimeline } from './timeline.js';

function array(value) { return Array.isArray(value) ? value : []; }
function yearOf(value) { const text=String(value||''); const match=text.match(/^(\d{4})/); return match?Number(match[1]):null; }

export function summarizeDevelopmentYear(child = {}, year = new Date().getFullYear()) {
  const events = buildDevelopmentTimeline(child,{limit:5000}).filter((event)=>yearOf(event.date)===Number(year));
  const byKind = events.reduce((map,event)=>{map[event.kind]=(map[event.kind]||0)+1;return map;},{});
  const physicalMinutes = array(child.physicalActivities).filter((item)=>yearOf(item?.date)===Number(year)).reduce((sum,item)=>sum+(Number(item?.minutes)||0),0);
  const habitLogCount = array(child.habits).reduce((sum,habit)=>sum+array(habit?.logs).filter((date)=>yearOf(date)===Number(year)).length,0);
  const portfolioCount = array(child.portfolio).filter((item)=>yearOf(item?.date)===Number(year)).length;
  const skillUpdateCount = array(child.skills).filter((item)=>yearOf(item?.date)===Number(year)).length;
  return { year:Number(year), eventCount:events.length, byKind, physicalMinutes, habitLogCount, portfolioCount, skillUpdateCount };
}

export function compareDevelopmentYears(child = {}, currentYear = new Date().getFullYear()) {
  const current = summarizeDevelopmentYear(child,currentYear);
  const previous = summarizeDevelopmentYear(child,Number(currentYear)-1);
  return {
    current,
    previous,
    differences: {
      recordedEvents: current.eventCount-previous.eventCount,
      physicalMinutes: current.physicalMinutes-previous.physicalMinutes,
      habitLogs: current.habitLogCount-previous.habitLogCount,
      portfolioRecords: current.portfolioCount-previous.portfolioCount,
      skillUpdates: current.skillUpdateCount-previous.skillUpdateCount
    },
    note:'Chênh lệch phản ánh lượng dữ liệu/hoạt động được ghi nhận, không phải điểm số hay xếp hạng phát triển.'
  };
}
