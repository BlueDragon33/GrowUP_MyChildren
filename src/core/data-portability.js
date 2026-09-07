const PORTABILITY_MODES=Object.freeze(['local-only','safe-exportable','encrypted-backup-only','future-cloud-capable']);

const MODULES=Object.freeze([
  {id:'learning',label:'Học tập',path:'children[].learningGoals',mode:'safe-exportable',detail:'Có trong safe CSV/JSON export.'},
  {id:'skills',label:'Kỹ năng',path:'children[].skills',mode:'safe-exportable',detail:'Có trong safe CSV/JSON export.'},
  {id:'portfolio',label:'Portfolio metadata',path:'children[].portfolio',mode:'safe-exportable',detail:'Chỉ metadata được chọn; ghi chú nhạy cảm không nằm trong safe search.'},
  {id:'attachments',label:'Minh chứng metadata',path:'children[].attachments',mode:'safe-exportable',detail:'Chỉ reference/metadata; chưa lưu binary file.'},
  {id:'roadmap',label:'Roadmap',path:'children[].roadmap',mode:'safe-exportable',detail:'Có trong safe JSON export.'},
  {id:'reminders',label:'Nhắc nhở',path:'children[].reminders',mode:'safe-exportable',detail:'Có thể xuất metadata và .ics khi người dùng chủ động chọn.'},
  {id:'physical',label:'Vận động',path:'children[].physicalActivities',mode:'local-only',detail:'Hiện chỉ lưu cục bộ; chưa nằm trong safe export.'},
  {id:'habits',label:'Thói quen',path:'children[].habits',mode:'local-only',detail:'Hiện chỉ lưu cục bộ; chưa nằm trong safe export.'},
  {id:'family-policy',label:'Family policy',path:'family',mode:'local-only',detail:'Mô hình quyền cục bộ, chưa phải authenticated identity.'},
  {id:'family-plan',label:'Kế hoạch gia đình',path:'settings.familyPlanItems',mode:'local-only',detail:'Chỉ selective .ics khi người dùng chọn; không có bulk safe export mặc định.'},
  {id:'health',label:'Sức khỏe',path:'children[].healthRecords',mode:'encrypted-backup-only',detail:'Không có trong safe export; chỉ đi cùng full encrypted backup khi người dùng chủ động tạo.'},
  {id:'nutrition',label:'Dinh dưỡng',path:'children[].nutritionLogs',mode:'encrypted-backup-only',detail:'Không có trong safe export; chỉ đi cùng full encrypted backup khi người dùng chủ động tạo.'},
  {id:'calendar-cloud',label:'Calendar provider',path:'integration descriptor',mode:'future-cloud-capable',detail:'Adapter đã có boundary; Google Calendar cần auth/quyền thật trước khi hoạt động.'},
  {id:'attachment-binary',label:'Binary evidence storage',path:'future provider',mode:'future-cloud-capable',detail:'Chưa triển khai upload/sync file binary.'}
]);

export function dataPortabilityMap(){
  return MODULES.map((item)=>({...item}));
}

export function dataPortabilitySummary(){
  const summary=Object.fromEntries(PORTABILITY_MODES.map((mode)=>[mode,0]));
  for(const item of MODULES) summary[item.mode]+=1;
  return summary;
}

export function portabilityModeLabel(mode=''){
  return ({'local-only':'Chỉ cục bộ','safe-exportable':'Safe export','encrypted-backup-only':'Chỉ backup mã hóa','future-cloud-capable':'Cloud trong tương lai'})[mode]||mode;
}

export const DATA_PORTABILITY_NOTE='Bản đồ này mô tả đường đi dữ liệu hiện tại, không phải quyền tự động gửi dữ liệu. Không có mục future-cloud-capable nào được đồng bộ ra ngoài nếu chưa có auth, consent và provider thật.';
