export const PROVIDERS = Object.freeze({
  LOCAL: 'local',
  GOOGLE_CALENDAR: 'google-calendar',
  CLOUD: 'cloud'
});

export const INTEGRATION_STATUS = Object.freeze({
  DISCONNECTED: 'disconnected',
  READY: 'ready',
  CONNECTED: 'connected',
  ERROR: 'error'
});

export function normalizeIntegration(input = {}, fallbackProvider = null) {
  const provider = input.provider || fallbackProvider;
  const status = Object.values(INTEGRATION_STATUS).includes(input.status)
    ? input.status
    : (input.connected
        ? INTEGRATION_STATUS.CONNECTED
        : (provider === PROVIDERS.LOCAL ? INTEGRATION_STATUS.READY : INTEGRATION_STATUS.DISCONNECTED));
  return {
    provider,
    status,
    connected: status === INTEGRATION_STATUS.CONNECTED,
    scopes: Array.isArray(input.scopes) ? [...new Set(input.scopes.map(String))] : [],
    lastSyncAt: input.lastSyncAt || null,
    error: input.error || null
  };
}

export function publicIntegrationDescriptor(provider) {
  if (provider === PROVIDERS.GOOGLE_CALENDAR) {
    return { provider, label: 'Google Calendar', requiresAuthorization: true, supports: ['calendar-read', 'calendar-write'] };
  }
  if (provider === PROVIDERS.CLOUD) {
    return { provider, label: 'Cloud sync', requiresAuthorization: true, supports: ['profile-sync', 'backup-sync'] };
  }
  return { provider: PROVIDERS.LOCAL, label: 'Thiết bị cục bộ', requiresAuthorization: false, supports: ['offline-storage', 'ics-export'] };
}

export function integrationReady(integration, requiredScopes = []) {
  const normalized = normalizeIntegration(integration);
  if (normalized.status !== INTEGRATION_STATUS.CONNECTED && normalized.status !== INTEGRATION_STATUS.READY) return false;
  return requiredScopes.every((scope) => normalized.scopes.includes(scope));
}
