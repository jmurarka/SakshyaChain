const SUPPORTED_REQUEST_ROLES = new Set(['POLICE_INVESTIGATOR', 'FORENSIC_SPECIALIST', 'PUBLIC_PROSECUTOR']);
const SUPPORTED_PERMISSIONS = new Set(['VIEW', 'DOWNLOAD', 'EDIT', 'SHARE']);

export function isEligibleForDocument(user, doc, db) {
  const parentCase = db.cases.find(c => c.id === doc.caseId);
  const clearance = user.clearanceLevel >= doc.clearanceLevel;
  const caseEligible = !!parentCase && (user.systemRole === 'IT_ADMIN' || (user.assignedCases || []).includes(doc.caseId));
  return { eligible: clearance && caseEligible, clearance, caseEligible, parentCase };
}

export function isEligibleForAction(user, permission) {
  return SUPPORTED_PERMISSIONS.has(permission) && (!['EDIT', 'SHARE'].includes(permission) || SUPPORTED_REQUEST_ROLES.has(user.role));
}

export function getDocumentCapabilities({ user, doc, db }) {
  const owner = (doc.ownerId || doc.authorId) === user.id;
  const activeGrants = (db.documentPermissions || []).filter(permission =>
    permission.userId === user.id && permission.documentId === doc.id && (!permission.expiresAt || Date.parse(permission.expiresAt) > Date.now())
  );
  const grantedPermission = ['EDIT', 'DOWNLOAD', 'VIEW', 'SHARE'].find(permission => activeGrants.some(grant => grant.permission === permission)) || null;
  const canView = evaluateDocumentAccess({ user, doc, db, permission: 'VIEW' }).allowed;
  const canDownload = evaluateDocumentAccess({ user, doc, db, permission: 'DOWNLOAD' }).allowed;
  const canEdit = evaluateDocumentAccess({ user, doc, db, permission: 'EDIT' }).allowed;
  const mode = owner || grantedPermission === 'EDIT'
    ? 'EDIT'
    : grantedPermission === 'DOWNLOAD'
      ? 'DOWNLOAD'
      : grantedPermission || (canDownload ? 'DOWNLOAD' : 'VIEW');

  return { mode, grantedPermission, canView, canDownload, canEdit };
}

export function evaluateDocumentAccess({ user, doc, db, permission = 'VIEW', breakGlass = false }) {
  const rbac = isEligibleForDocument(user, doc, db);
  const actionEligible = isEligibleForAction(user, permission);
  const permissionValid = SUPPORTED_PERMISSIONS.has(permission);
  const owner = (doc.ownerId || doc.authorId) === user.id;
  const now = Date.now();
  const grants = (db.documentPermissions || []).filter(p => p.userId === user.id && p.documentId === doc.id && (!p.expiresAt || Date.parse(p.expiresAt) > now));
  const tamperLocked = Number.isFinite(Date.parse(doc.tamperLockedUntil)) && Date.parse(doc.tamperLockedUntil) > now;
  const grantPermissions = permission === 'VIEW' ? ['VIEW', 'DOWNLOAD', 'EDIT', 'SHARE'] : [permission];
  const explicitGrant = grants.some(p => grantPermissions.includes(p.permission));
  const baselineAccess = rbac.eligible && doc.accessPolicy !== 'OWNER_APPROVAL' && ['VIEW', 'DOWNLOAD'].includes(permission);
  const emergencyAccess = breakGlass && ['VIEW', 'DOWNLOAD'].includes(permission);
  const allowed = user.systemRole !== 'IT_ADMIN' && !tamperLocked && permissionValid && (emergencyAccess || (rbac.clearance && (owner || (actionEligible && rbac.caseEligible && (baselineAccess || explicitGrant)))));
  let reason = 'Access granted by policy.';
  if (!allowed) reason = user.systemRole === 'IT_ADMIN' ? 'IT Admin access is read-only and cannot perform this action.' : tamperLocked ? 'Evidence is temporarily locked for tamper investigation.' : !rbac.clearance ? 'Required clearance level not met.' : !actionEligible && !owner ? `RBAC does not permit ${permission} for this role.` : !rbac.caseEligible && !owner ? 'This case is not assigned to your account.' : permission === 'DOWNLOAD' ? 'Explicit download permission is required.' : permission === 'EDIT' ? 'File owner or explicit edit permission is required.' : permission === 'SHARE' ? 'File owner or explicit share permission is required.' : 'Owner and supervisor approval are required.';
  return { allowed, owner, explicitGrant, baselineAccess, rbacEligible: rbac.eligible, actionEligible, clearance: rbac.clearance, caseEligible: rbac.caseEligible, tamperLocked, reason };
}
