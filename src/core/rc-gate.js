export const RC_PROFILE = Object.freeze({
  appVersion:'1.1.0',
  dataSchemaVersion:5,
  serviceWorkerCache:'growup-mychildren-v11',
  nodeMajor:22,
  playwrightVersion:'1.55.0',
  axePlaywrightVersion:'4.10.2',
  rollback:{version:'1.0.0',commit:'605c4948cbcc60164d8a34ba220558d39d8eeeb5'}
});

export function evaluateReleaseCandidate(input = {}) {
  const checks=[
    {key:'appVersion',ok:String(input.appVersion||'')===RC_PROFILE.appVersion,expected:RC_PROFILE.appVersion,actual:input.appVersion||null},
    {key:'dataSchemaVersion',ok:Number(input.dataSchemaVersion)===RC_PROFILE.dataSchemaVersion,expected:RC_PROFILE.dataSchemaVersion,actual:Number(input.dataSchemaVersion)||null},
    {key:'serviceWorkerCache',ok:String(input.serviceWorkerCache||'')===RC_PROFILE.serviceWorkerCache,expected:RC_PROFILE.serviceWorkerCache,actual:input.serviceWorkerCache||null},
    {key:'nodeMajor',ok:Number(input.nodeMajor)===RC_PROFILE.nodeMajor,expected:RC_PROFILE.nodeMajor,actual:Number(input.nodeMajor)||null},
    {key:'playwrightVersion',ok:String(input.playwrightVersion||'')===RC_PROFILE.playwrightVersion,expected:RC_PROFILE.playwrightVersion,actual:input.playwrightVersion||null},
    {key:'axePlaywrightVersion',ok:String(input.axePlaywrightVersion||'')===RC_PROFILE.axePlaywrightVersion,expected:RC_PROFILE.axePlaywrightVersion,actual:input.axePlaywrightVersion||null},
    {key:'rollbackCommit',ok:String(input.rollbackCommit||'')===RC_PROFILE.rollback.commit,expected:RC_PROFILE.rollback.commit,actual:input.rollbackCommit||null}
  ];
  return {ready:checks.every((check)=>check.ok),checks,failed:checks.filter((check)=>!check.ok).map((check)=>check.key)};
}

export const RC_GATE_NOTE='RC gate kiểm tra tính nhất quán cấu hình và regression; nó không tự deploy, không tự rollback và không thay đổi dữ liệu người dùng.';
