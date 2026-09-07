const LEGACY_MODULES=Object.freeze([
  {module:'enhancements.js',selector:'[data-v3],#v3AttachmentForm,#v3PrivacyToggle'},
  {module:'v4.js',selector:'[data-v4],#v4IntegrityBackup,#v4ReportExport'},
  {module:'v5.js',selector:'[data-v5],#v5Dataset,#v5EvidenceForm'},
  {module:'v6.js',selector:'[data-v6]'},
  {module:'v7.js',selector:'[data-v7]'},
  {module:'v8.js',selector:'[data-v8]'},
  {module:'v9-runtime.js',selector:'[data-v9],#v9SearchForm,#v9RecoveryForm'},
  {module:'v9-compat.js',selector:'[data-v9-compat]'}
]);

export function legacyModuleDefinitions(){
  return LEGACY_MODULES.map((entry)=>({...entry}));
}

export function compatibilityUsageSnapshot(root=document){
  return LEGACY_MODULES.map((entry)=>({module:entry.module,active:Boolean(root?.querySelector?.(entry.selector)),selector:entry.selector}));
}

export function retirementCandidates(snapshot=[]){
  return snapshot.filter((entry)=>entry&&entry.active===false).map((entry)=>entry.module);
}

export const RUNTIME_COMPATIBILITY_NOTE='Một module chỉ được xem là ứng viên retire khi nhiều regression flow không quan sát selector/side effect của nó. Snapshot đơn lẻ không đủ bằng chứng để xóa code.';
