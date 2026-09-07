function array(value){return Array.isArray(value)?value:[];}

const MODULES=Object.freeze([
  {key:'profile',label:'Hồ sơ trẻ',mode:'safe-export',cloud:'future',count:(state)=>array(state.children).length},
  {key:'learning',label:'Học tập',mode:'safe-export',cloud:'future',count:(state)=>array(state.children).reduce((n,c)=>n+array(c.learningGoals).length,0)},
  {key:'skills',label:'Kỹ năng',mode:'safe-export',cloud:'future',count:(state)=>array(state.children).reduce((n,c)=>n+array(c.skills).length,0)},
  {key:'portfolio',label:'Portfolio metadata',mode:'safe-export',cloud:'future',count:(state)=>array(state.children).reduce((n,c)=>n+array(c.portfolio).length,0)},
  {key:'attachments',label:'Tệp đính kèm metadata',mode:'safe-export',cloud:'future-binary',count:(state)=>array(state.children).reduce((n,c)=>n+array(c.attachments).length,0)},
  {key:'health',label:'Sức khỏe',mode:'encrypted-backup-only',cloud:'future-sensitive',count:(state)=>array(state.children).reduce((n,c)=>n+array(c.healthRecords).length,0)},
  {key:'nutrition',label:'Dinh dưỡng',mode:'encrypted-backup-only',cloud:'future-sensitive',count:(state)=>array(state.children).reduce((n,c)=>n+array(c.nutritionLogs).length,0)},
  {key:'familyPlan',label:'Kế hoạch gia đình',mode:'local-only',cloud:'future',count:(state)=>array(state.settings?.familyPlanItems).length},
  {key:'audit',label:'Audit metadata',mode:'encrypted-backup-only',cloud:'future-sensitive',count:(state)=>array(state.auditLog).length}
]);

export function childDataPortabilityMap(state={}){
  return MODULES.map((item)=>({key:item.key,label:item.label,mode:item.mode,cloud:item.cloud,records:item.count(state)}));
}

export function portabilitySummary(state={}){
  const rows=childDataPortabilityMap(state);
  return rows.reduce((acc,row)=>{acc[row.mode]=(acc[row.mode]||0)+row.records;return acc;},{});
}

export const PORTABILITY_NOTE='Bản đồ này mô tả đường đi dữ liệu hiện tại, không tự tải lên cloud. Dữ liệu sức khỏe/dinh dưỡng chỉ đi qua encrypted backup cho tới khi có quyền chi tiết và backend phù hợp.';
