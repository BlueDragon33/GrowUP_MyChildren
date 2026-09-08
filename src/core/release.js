export const APP_VERSION = '1.8.0';
export const DATA_SCHEMA_VERSION = 5;
export const STABLE_ROLLBACK = Object.freeze({
  version:'1.7.0',
  commit:'d59680e4e1bcd122f6adc14ed9a21ede8db26cd7',
  note:'Bản v1.7 stable đã hoàn tất Lượt 106–110 và post-merge main CI PASS cả verify + Chromium/Axe trước khi v1.8 bắt đầu.'
});

export const RELEASE_NOTES = Object.freeze([
  { version:'1.8.0', title:'Import-history portability, preset audit review, Saved Search receipt undo, Recovery receipt management & evidence freshness policy', rounds:'111–115' },
  { version:'1.7.0', title:'Managed import history/undo, Saved Search receipt integrity, Recovery report verification & compatibility evidence freshness', rounds:'106–110' },
  { version:'1.6.0', title:'Receipt package integrity, workload preset conflict preview, Saved Search receipt management, Recovery reconciliation report & compatibility evidence package', rounds:'101–105' },
  { version:'1.5.0', title:'Verification receipt management, custom workload preset library, Saved Search integrity, Recovery ICS reconciliation & persistent six-flow compatibility evidence', rounds:'96–100' },
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
