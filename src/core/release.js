export const APP_VERSION = '1.0.0';
export const DATA_SCHEMA_VERSION = 5;
export const STABLE_ROLLBACK = Object.freeze({
  version:'0.9.0',
  commit:'c7cdab1c2b5aedf4952d9f276bef6d444b27713a',
  note:'Bản v0.9 đã qua verify + 14/14 Chromium E2E/Axe và CI hậu merge trước khi v1.0 bắt đầu.'
});

export const RELEASE_NOTES = Object.freeze([
  { version:'1.0.0', title:'Coverage, conflict assistant, search deep links, recovery history & runtime consolidation', rounds:'71–75' },
  { version:'0.9.0', title:'Domain binding, family calendar bridge, safe search, recovery drill & RC gate', rounds:'66–70' },
  { version:'0.8.0', title:'Audit, taxonomy, family planning, encrypted backup & release hardening', rounds:'61–65' },
  { version:'0.7.0', title:'Consistency, retention, reporting & Axe privacy/accessibility gate', rounds:'56–60' },
  { version:'0.6.0', title:'Evidence repair, archive integrity, timeline filters & accessibility', rounds:'51–55' }
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
