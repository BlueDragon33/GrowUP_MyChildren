export const APP_VERSION = '0.9.0';
export const DATA_SCHEMA_VERSION = 5;
export const STABLE_ROLLBACK = Object.freeze({
  version:'0.8.0',
  commit:'241653d6fb12f021ebd20704144e47a5a12cc8fd',
  note:'Bản v0.8 đã qua final verify + 9/9 Chromium E2E/Axe trước khi v0.9 bắt đầu.'
});

export const RELEASE_NOTES = Object.freeze([
  { version:'0.9.0', title:'Domain binding, family calendar bridge, safe search, recovery drill & RC gate', rounds:'66–70' },
  { version:'0.8.0', title:'Audit, taxonomy, family planning, encrypted backup & release hardening', rounds:'61–65' },
  { version:'0.7.0', title:'Consistency, retention, reporting & Axe privacy/accessibility gate', rounds:'56–60' },
  { version:'0.6.0', title:'Evidence repair, archive integrity, timeline filters & accessibility', rounds:'51–55' },
  { version:'0.5.0', title:'Timeline, evidence links, family policy, safe export & browser gate', rounds:'46–50' }
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
