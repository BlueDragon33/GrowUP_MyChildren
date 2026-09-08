import { configuredWorkloadBand, defaultWorkloadBandSettings } from './workload-band-settings.js';

function array(v){return Array.isArray(v)?v:[];}
function validDate(v){return /^\d{4}-\d{2}-\d{2}$/.test(String(v||''));}
function localDateKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}

export function workloadBand(minutes=0){return configuredWorkloadBand(minutes,defaultWorkloadBandSettings());}

export function familyWorkloadCalendar(items=[],monthDate='',bandSettings={}){
  const base=validDate(monthDate)?new Date(`${monthDate}T00:00:00`):new Date();
  const year=base.getFullYear(),month=base.getMonth();
  const first=new Date(year,month,1),last=new Date(year,month+1,0);
  const grouped=new Map();
  for(const item of array(items)){
    if(!validDate(item?.date))continue;
    const d=new Date(`${item.date}T00:00:00`);
    if(d.getFullYear()!==year||d.getMonth()!==month)continue;
    if(!grouped.has(item.date))grouped.set(item.date,{minutes:0,items:0});
    const row=grouped.get(item.date);row.minutes+=Math.max(0,Number(item.minutes)||0);row.items+=1;
  }
  const days=[];
  for(let day=1;day<=last.getDate();day+=1){
    const date=new Date(year,month,day),key=localDateKey(date),row=grouped.get(key)||{minutes:0,items:0},band=configuredWorkloadBand(row.minutes,bandSettings);
    days.push({date:key,day,weekday:date.toLocaleDateString('vi-VN',{weekday:'short'}),minutes:row.minutes,items:row.items,band:band.key,bandLabel:band.label,text:`${date.toLocaleDateString('vi-VN')}: ${row.items} kế hoạch, ${row.minutes} phút, ${band.label}.`});
  }
  return {month:`${year}-${String(month+1).padStart(2,'0')}`,monthLabel:first.toLocaleDateString('vi-VN',{month:'long',year:'numeric'}),days};
}

export const WORKLOAD_CALENDAR_NOTE='Màu/band chỉ biểu diễn tổng số phút đã lên lịch trong ngày. Ngưỡng có thể cấu hình cục bộ nhưng không tạo điểm hiệu suất, chất lượng học tập hay xếp hạng trẻ; phần mô tả văn bản cung cấp thông tin tương đương cho bàn phím và trình đọc màn hình.';
