export const APP_VERSION = '1.4.0';
export const DATA_SCHEMA_VERSION = 5;
export const STABLE_ROLLBACK = Object.freeze({
  version:'1.3.0',
  commit:'51e4a80609d40915106663e983dbfa1202fee228',
  note:'Bản v1.3 đã qua final PR gate, merge code, docs finalize và CI hậu merge trên main trước khi v1.4 bắt đầu.'
});

export const RELEASE_NOTES = Object.freeze([
  { version:'1.4.0', title:'Export verification receipts, workload presets, saved-search package, recovery calendar bridge & retirement dry-run', rounds:'91–95' },
  { version:'1.3.0', title:'Safe export integrity, configurable workload bands, saved-search organizer, recovery lifecycle & legacy retirement review', rounds:'86–90' },
  { version:'1.2.0', title:'Safe export wizard, workload calendar, saved-search management, recovery reminder integration & compatibility matrix', rounds:'81–85' },
  { version:'1.1.0', title:'Portability map, workload windows, saved safe search, recovery schedule & compatibility evidence', rounds:'76–80' },
  { version:'1.0.0', title:'Coverage, conflict assistant, search deep links, recovery history & runtime consolidation', rounds:'71–75' },
  { version:'0.9.0', title:'Domain binding, family calendar bridge, safe search, recovery drill & RC gate', rounds:'66–70' },
  { version:'0.8.0', title:'Audit, taxonomy, family planning, encrypted backup & release hardening', rounds:'61–65' },
  { version:'0.7.0', title:'Consistency, retention, reporting & Axe privacy/accessibility gate', rounds:'56–60' }
]);

export function compareVersions(a='0.0.0',b='0.0.0') {
  const pa=String(a).split('.').map((part)=>Number(part)||0);
  const pb=String(b).split('.').map((part)=>Number(part)||0);
  for(let i=0;i<Math.max(pa.length,pb.length);i+=1){ const d=(pa[i]||0)-(pb[i]||0); if(d) return d>0?1:-1; }
  return 0;
}

export function releaseStatus(lastSeenVersion='') {
  const seen=String(lastSeenVersion || '0.0.0');
  return {
    currentVersion:APP_VERSION,
    lastSeenVersion:seen,
    hasNewRelease:compareVersions(APP_VERSION,seen)>0,
    dataSchemaVersion:DATA_SCHEMA_VERSION,
    rollback:STABLE_ROLLBACK,
    notes:RELEASE_NOTES
  };
}

export function markReleaseSeen(settings = {}) {
  return { ...settings, lastSeenAppVersion:APP_VERSION, lastSeenAppVersionAt:new Date().toISOString() };
}
