export const FAMILY_ROLES = Object.freeze({
  OWNER: 'owner',
  PARENT: 'parent',
  GUARDIAN: 'guardian',
  VIEWER: 'viewer'
});

export const PERMISSIONS = Object.freeze({
  FAMILY_MANAGE: 'family:manage',
  PROFILE_READ: 'profile:read',
  PROFILE_WRITE: 'profile:write',
  HEALTH_READ: 'health:read',
  HEALTH_WRITE: 'health:write',
  BACKUP_EXPORT: 'backup:export',
  BACKUP_RESTORE: 'backup:restore',
  INTEGRATION_MANAGE: 'integration:manage'
});

const ROLE_PERMISSIONS = Object.freeze({
  owner: Object.values(PERMISSIONS),
  parent: [PERMISSIONS.PROFILE_READ, PERMISSIONS.PROFILE_WRITE, PERMISSIONS.HEALTH_READ, PERMISSIONS.HEALTH_WRITE, PERMISSIONS.BACKUP_EXPORT],
  guardian: [PERMISSIONS.PROFILE_READ, PERMISSIONS.PROFILE_WRITE, PERMISSIONS.HEALTH_READ],
  viewer: [PERMISSIONS.PROFILE_READ]
});

export function canRole(role, permission) {
  return (ROLE_PERMISSIONS[role] || []).includes(permission);
}

export function normalizeFamilyMember(member = {}) {
  const role = Object.values(FAMILY_ROLES).includes(member.role) ? member.role : FAMILY_ROLES.VIEWER;
  return {
    id: String(member.id || '').trim() || `member_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    displayName: String(member.displayName || '').trim() || 'Thành viên gia đình',
    role,
    source: member.source || 'local-policy',
    createdAt: member.createdAt || new Date().toISOString()
  };
}

export function defaultOwnerMember() {
  return {
    id: 'local-owner',
    displayName: 'Chủ gia đình',
    role: FAMILY_ROLES.OWNER,
    source: 'local-policy',
    createdAt: new Date(0).toISOString()
  };
}

export function rolePermissions(role) {
  return [...(ROLE_PERMISSIONS[role] || [])];
}
