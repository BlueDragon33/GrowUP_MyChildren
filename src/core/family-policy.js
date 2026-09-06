import { FAMILY_ROLES, normalizeFamilyMember } from './roles.js';

function membersOf(family) { return Array.isArray(family?.members) ? family.members : []; }
function ownerCount(members) { return members.filter((member) => member.role === FAMILY_ROLES.OWNER).length; }

export function addPolicyMember(family, input = {}) {
  const members = membersOf(family);
  const requestedRole = input.role;
  const role = [FAMILY_ROLES.PARENT, FAMILY_ROLES.GUARDIAN, FAMILY_ROLES.VIEWER].includes(requestedRole) ? requestedRole : FAMILY_ROLES.VIEWER;
  const member = normalizeFamilyMember({ ...input, role, source:'local-policy' });
  return { ...family, members:[...members, member] };
}

export function removePolicyMember(family, memberId) {
  const members = membersOf(family);
  const target = members.find((member) => member.id === memberId);
  if (!target) return family;
  if (target.role === FAMILY_ROLES.OWNER && ownerCount(members) <= 1) throw new Error('Không thể xóa owner cuối cùng của policy gia đình.');
  const next = members.filter((member) => member.id !== memberId);
  const activeMemberId = family.activeMemberId === memberId ? next[0]?.id || null : family.activeMemberId;
  return { ...family, members:next, activeMemberId };
}

export function changePolicyMemberRole(family, memberId, nextRole) {
  if (!Object.values(FAMILY_ROLES).includes(nextRole)) throw new Error('Vai trò không hợp lệ.');
  const members = membersOf(family);
  const current = members.find((member) => member.id === memberId);
  if (!current) throw new Error('Không tìm thấy thành viên policy.');
  if (current.role === FAMILY_ROLES.OWNER && nextRole !== FAMILY_ROLES.OWNER && ownerCount(members) <= 1) throw new Error('Policy phải còn ít nhất một owner.');
  return { ...family, members:members.map((member) => member.id === memberId ? { ...member, role:nextRole } : member) };
}
