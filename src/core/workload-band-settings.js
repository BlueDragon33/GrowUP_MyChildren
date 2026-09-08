const FORBIDDEN_LABEL_TERMS=/(^|\s)(score|rank|rating|percentile|điểm|xếp\s*hạng)(\s|$)/iu;
const DEFAULTS=Object.freeze({firstMax:60,secondMax:180,labels:{none:'Không có kế hoạch',light:'Đến 60 phút',moderate:'61–180 phút',extended:'Trên 180 phút'}});

function label(value,fallback){const text=typeof value==='string'?value.trim().slice(0,60):'';return text&&!FORBIDDEN_LABEL_TERMS.test(text)?text:fallback;}

export function defaultWorkloadBandSettings(){return structuredClone(DEFAULTS);}

export function normalizeWorkloadBandSettings(input={}){
  const first=Math.min(720,Math.max(1,Math.round(Number(input.firstMax)||DEFAULTS.firstMax)));
  const second=Math.min(1440,Math.max(first+1,Math.round(Number(input.secondMax)||DEFAULTS.secondMax)));
  return {
    firstMax:first,
    secondMax:second,
    labels:{
      none:label(input.labels?.none,DEFAULTS.labels.none),
      light:label(input.labels?.light,`Đến ${first} phút`),
      moderate:label(input.labels?.moderate,`${first+1}–${second} phút`),
      extended:label(input.labels?.extended,`Trên ${second} phút`)
    }
  };
}

export function workloadBandSettings(settings={}){return normalizeWorkloadBandSettings(settings.workloadDisplayBands||{});}
export function setWorkloadBandSettings(settings={},input={}){return {...settings,workloadDisplayBands:normalizeWorkloadBandSettings(input)};}

export function configuredWorkloadBand(minutes=0,input={}){
  const config=normalizeWorkloadBandSettings(input),n=Math.max(0,Number(minutes)||0);
  if(n===0)return {key:'none',label:config.labels.none};
  if(n<=config.firstMax)return {key:'light',label:config.labels.light};
  if(n<=config.secondMax)return {key:'moderate',label:config.labels.moderate};
  return {key:'extended',label:config.labels.extended};
}

export const WORKLOAD_BAND_SETTINGS_NOTE='Ngưỡng và nhãn chỉ mô tả tổng phút kế hoạch của gia đình. API không tạo score/rank/rating/percentile theo trẻ; nhãn mang nghĩa chấm điểm hoặc xếp hạng bị từ chối và thay bằng nhãn trung tính.';
