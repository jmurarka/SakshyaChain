import express from 'express';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/auth.js';
import { dbService } from '../services/dbService.js';
import { ledgerService } from '../services/ledgerService.js';
import { evaluateDocumentAccess, isEligibleForDocument, isEligibleForAction } from '../services/documentAccessService.js';

const router = express.Router();
const isAdmin = user => user.systemRole === 'IT_ADMIN';
const isSupervisor = user => ['JUDICIAL_MAGISTRATE', 'COMPLIANCE_AUDITOR'].includes(user.role);
const audit = (action, actor, doc, request, details = {}) => ledgerService.addBlock({ action, actorId: actor.id, actorName: actor.name, caseId: doc.caseId, docId: doc.id, docHash: doc.payloadHash || '', details: { requestId: request.id, ...details } });

router.get('/', authenticateToken, (req, res) => {
  const db = dbService.readDB();
  const requests = db.accessRequests || [];
  const visible = isAdmin(req.user) ? requests : requests.filter(r => r.requesterId === req.user.id || r.ownerId === req.user.id || r.supervisorId === req.user.id);
  const publicUser = id => { const u = db.users.find(item => item.id === id); if (!u) return null; const { privateKey, publicKey, passwordHash, passwordSalt, ...safe } = u; return safe; };
  res.json({ requests: visible.map(r => { const doc = db.documents.find(d => d.id === r.documentId); const { extractedText, encryptionMetadata, signature, ...metadata } = doc || {}; return { ...r, document: doc ? metadata : null, approvals: (db.approvals || []).filter(a => a.requestId === r.id), requester: publicUser(r.requesterId), owner: publicUser(r.ownerId), supervisor: publicUser(r.supervisorId) }; }) });
});

// Return safe metadata for documents the signed-in employee may request.
// The regular document endpoint intentionally hides restricted documents, so
// it cannot supply the request form's choices.
router.get('/requestable-documents', authenticateToken, (req, res) => {
  if (isAdmin(req.user)) return res.json({ documents: [] });
  const db = dbService.readDB();
  const documents = (db.documents || []).filter(doc => {
    if (doc.tamperLockedUntil && Date.parse(doc.tamperLockedUntil) > Date.now()) return false;
    const ownerId = doc.ownerId || doc.authorId;
    if (ownerId === req.user.id || !isEligibleForDocument(req.user, doc, db).eligible) return false;
    return ['VIEW', 'DOWNLOAD', 'EDIT', 'SHARE'].some(permission =>
      isEligibleForAction(req.user, permission) && !evaluateDocumentAccess({ user: req.user, doc, db, permission }).allowed
    );
  }).map(({ extractedText, encryptionMetadata, signature, payloadHash, ...metadata }) => metadata);
  res.json({ documents });
});

router.get('/permissions', authenticateToken, (req, res) => {
  const db = dbService.readDB();
  const records = db.documentPermissions || [];
  const visible = isAdmin(req.user) ? records : records.filter(p => p.userId === req.user.id || db.accessRequests?.some(r => r.documentId === p.documentId && (r.ownerId === req.user.id || r.supervisorId === req.user.id)));
  res.json({ permissions: visible.map(p => ({ ...p, document: (() => { const d = db.documents.find(item => item.id === p.documentId); if (!d) return null; const { extractedText, encryptionMetadata, signature, ...metadata } = d; return metadata; })(), user: (() => { const u = db.users.find(item => item.id === p.userId); if (!u) return null; const { privateKey, publicKey, passwordHash, passwordSalt, ...safe } = u; return safe; })() })) });
});

// IT Admins may manage employee access grants, but not edit evidence or requests.
router.post('/admin/grant', authenticateToken, (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'IT_ADMIN_ONLY' });
  const { userId, documentId, permission, durationHours } = req.body || {};
  const db = dbService.readDB();
  const employee = db.users.find(user => user.id === userId && user.systemRole !== 'IT_ADMIN');
  const doc = db.documents.find(document => document.id === documentId);
  if (!employee || !doc) return res.status(404).json({ error: 'EMPLOYEE_OR_DOCUMENT_NOT_FOUND' });
  if (doc.tamperLockedUntil && Date.parse(doc.tamperLockedUntil) > Date.now()) return res.status(423).json({ error: 'DOCUMENT_TEMPORARILY_LOCKED', message: 'Access cannot be granted while this evidence is locked for tamper review.' });
  if (!isEligibleForDocument(employee, doc, db).eligible || !isEligibleForAction(employee, permission)) return res.status(403).json({ error: 'EMPLOYEE_NOT_ELIGIBLE', message: 'The selected employee is not eligible for this document or permission.' });
  if (!['VIEW', 'DOWNLOAD', 'EDIT', 'SHARE'].includes(permission)) return res.status(400).json({ error: 'INVALID_PERMISSION' });
  const hours = durationHours === undefined || durationHours === '' ? null : Number(durationHours);
  if (hours !== null && (!Number.isInteger(hours) || hours < 1 || hours > 720)) return res.status(400).json({ error: 'INVALID_DURATION' });
  db.documentPermissions ||= [];
  const duplicate = db.documentPermissions.find(item => item.userId === employee.id && item.documentId === doc.id && item.permission === permission && (!item.expiresAt || Date.parse(item.expiresAt) > Date.now()));
  if (duplicate) return res.status(409).json({ error: 'ACCESS_ALREADY_GRANTED' });
  const grant = { id: `AP-${crypto.randomUUID()}`, userId: employee.id, documentId: doc.id, permission, grantedByAdmin: req.user.id, grantedAt: new Date().toISOString(), expiresAt: hours ? new Date(Date.now() + hours * 3600000).toISOString() : null };
  db.documentPermissions.push(grant);
  dbService.writeDB(db);
  ledgerService.addBlock({ action: 'IT_ADMIN_ACCESS_GRANTED', actorId: req.user.id, actorName: req.user.name, caseId: doc.caseId, docId: doc.id, docHash: doc.payloadHash || '', details: { employeeId: employee.id, employeeName: employee.name, permission, expiresAt: grant.expiresAt } });
  res.status(201).json({ grant, message: `${permission} access granted to ${employee.name}.` });
});

router.post('/admin/revoke', authenticateToken, (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'IT_ADMIN_ONLY' });
  const { userId, documentId, permission } = req.body || {};
  const db = dbService.readDB();
  const employee = db.users.find(user => user.id === userId && user.systemRole !== 'IT_ADMIN');
  const doc = db.documents.find(document => document.id === documentId);
  if (!employee || !doc || !['VIEW', 'DOWNLOAD', 'EDIT', 'SHARE'].includes(permission)) return res.status(404).json({ error: 'GRANT_NOT_FOUND' });
  db.documentPermissions ||= [];
  const before = db.documentPermissions.length;
  db.documentPermissions = db.documentPermissions.filter(item => !(item.userId === employee.id && item.documentId === doc.id && item.permission === permission));
  if (db.documentPermissions.length === before) return res.status(404).json({ error: 'GRANT_NOT_FOUND' });
  dbService.writeDB(db);
  ledgerService.addBlock({ action: 'IT_ADMIN_ACCESS_REVOKED', actorId: req.user.id, actorName: req.user.name, caseId: doc.caseId, docId: doc.id, docHash: doc.payloadHash || '', details: { employeeId: employee.id, employeeName: employee.name, permission } });
  res.json({ message: `${permission} access revoked for ${employee.name}.` });
});

router.get('/abnormalities', authenticateToken, (req, res) => {
  const db = dbService.readDB();
  const entries = db.abnormalities || [];
  const visible = isAdmin(req.user) ? entries : isSupervisor(req.user) ? entries.filter(a => a.supervisorId === req.user.id) : [];
  res.json({ abnormalities: visible });
});

router.post('/', authenticateToken, (req, res) => {
  if (isAdmin(req.user)) return res.status(403).json({ error: 'READ_ONLY_ADMIN' });
  const { documentId, reason, permission = 'VIEW', durationHours } = req.body || {};
  const db = dbService.readDB();
  const doc = db.documents.find(d => d.id === documentId);
  if (!doc || typeof reason !== 'string' || !reason.trim()) return res.status(400).json({ error: 'DOCUMENT_AND_REASON_REQUIRED' });
  if (doc.tamperLockedUntil && Date.parse(doc.tamperLockedUntil) > Date.now()) return res.status(423).json({ error: 'DOCUMENT_TEMPORARILY_LOCKED', message: 'This evidence is temporarily locked for tamper investigation.' });
  const requesterEligibility = isEligibleForDocument(req.user, doc, db);
  if (!requesterEligibility.eligible) {
    ledgerService.addBlock({ action: 'ACCESS_DENIED', actorId: req.user.id, actorName: req.user.name, caseId: doc.caseId, docId: doc.id, docHash: doc.payloadHash, details: { reason: 'RBAC/ABAC ineligible access request', requestedPermission: permission } });
    return res.status(403).json({ error: 'RBAC_ABAC_INELIGIBLE', message: 'Your role, clearance, department, or case assignment does not permit requesting this file.' });
  }
  const ownerId = doc.ownerId || doc.authorId;
  if (ownerId === req.user.id) return res.status(400).json({ error: 'OWNER_ALREADY_HAS_ACCESS' });
  if (evaluateDocumentAccess({ user: req.user, doc, db, permission }).allowed) return res.status(409).json({ error: 'ACCESS_ALREADY_AVAILABLE', message: `Your current RBAC/ABAC policy already permits ${permission} access to this file.` });
  const supervisor = db.users.find(u => u.id === req.user.supervisorId && u.id !== req.user.id && u.id !== ownerId && isSupervisor(u)) || db.users.find(u => u.id !== req.user.id && u.id !== ownerId && isSupervisor(u));
  if (!supervisor) return res.status(400).json({ error: 'SUPERVISOR_NOT_CONFIGURED' });
  const validPermissions = ['VIEW', 'DOWNLOAD', 'EDIT', 'SHARE'];
  if (!validPermissions.includes(permission)) return res.status(400).json({ error: 'INVALID_PERMISSION' });
  if (!isEligibleForAction(req.user, permission)) {
    ledgerService.addBlock({ action: 'ACCESS_DENIED', actorId: req.user.id, actorName: req.user.name, caseId: doc.caseId, docId: doc.id, docHash: doc.payloadHash, details: { reason: 'RBAC action ineligible', requestedPermission: permission } });
    return res.status(403).json({ error: 'RBAC_ACTION_DENIED', message: `Your role is not eligible to request ${permission}.` });
  }
  const requestedHours = durationHours === undefined || durationHours === '' ? null : Number(durationHours);
  if (requestedHours !== null && (!Number.isInteger(requestedHours) || requestedHours < 1 || requestedHours > 720)) return res.status(400).json({ error: 'INVALID_DURATION', message: 'Duration must be 1–720 hours.' });
  db.accessRequests ||= [];
  const request = { id: `AR-${crypto.randomUUID()}`, documentId, requesterId: req.user.id, ownerId, supervisorId: supervisor.id, permission, reason: reason.trim(), status: 'PENDING', ownerDecision: 'PENDING', supervisorDecision: 'PENDING', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), validUntil: new Date(Date.now() + 7 * 86400000).toISOString(), expiresAt: requestedHours ? new Date(Date.now() + requestedHours * 3600000).toISOString() : null };
  db.accessRequests.push(request); dbService.writeDB(db);
  audit('ACCESS_REQUESTED', req.user, doc, request, { permission, reason: request.reason });
  res.status(201).json({ request });
});

router.post('/:id/decision', authenticateToken, (req, res) => {
  if (isAdmin(req.user)) return res.status(403).json({ error: 'READ_ONLY_ADMIN' });
  const { decision } = req.body || {};
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 1000) : '';
  if (!['APPROVED', 'REJECTED'].includes(decision)) return res.status(400).json({ error: 'INVALID_DECISION' });
  const db = dbService.readDB(); db.accessRequests ||= [];
  const request = db.accessRequests.find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: 'REQUEST_NOT_FOUND' });
  const type = req.user.id === request.ownerId ? 'owner' : req.user.id === request.supervisorId && isSupervisor(req.user) ? 'supervisor' : null;
  if (!type) return res.status(403).json({ error: 'NOT_AN_ASSIGNED_APPROVER' });
  if (request.status !== 'PENDING') return res.status(409).json({ error: 'REQUEST_ALREADY_FINAL', status: request.status });
  const doc = db.documents.find(d => d.id === request.documentId);
  if (type === 'supervisor' && request.ownerDecision !== 'APPROVED') return res.status(409).json({ error: 'OWNER_APPROVAL_REQUIRED', message: 'Supervisor decision is available after the file owner approves.' });
  if (Date.parse(request.validUntil || request.createdAt) <= Date.now()) { request.status = 'DENIED'; dbService.writeDB(db); audit('ACCESS_DENIED', req.user, doc, request, { reason: 'Request expired' }); return res.status(409).json({ error: 'REQUEST_EXPIRED' }); }
  request[`${type}Decision`] = decision; request[`${type}DecisionBy`] = req.user.id; request[`${type}DecisionAt`] = new Date().toISOString(); request[`${type}DecisionReason`] = reason;
  request.updatedAt = new Date().toISOString();
  const action = `${type.toUpperCase()}_${decision}`;
  db.approvals ||= [];
  db.approvals.push({ requestId: request.id, approverId: req.user.id, approverType: type.toUpperCase(), decision, reason, timestamp: request.updatedAt });
  audit(action, req.user, doc, request, { reason });
  if (decision === 'REJECTED') {
    request.status = 'REJECTED';
    audit('ACCESS_DENIED', req.user, doc, request, { reason: `${type} approval rejected` });
  } else if (request.ownerDecision === 'APPROVED' && request.supervisorDecision === 'APPROVED') {
    const requester = db.users.find(u => u.id === request.requesterId);
    if (request.expiresAt && Date.parse(request.expiresAt) <= Date.now()) { request.status = 'DENIED'; audit('ACCESS_DENIED', req.user, doc, request, { reason: 'Requested access duration expired before final approval' }); }
    else if (doc.tamperLockedUntil && Date.parse(doc.tamperLockedUntil) > Date.now()) { request.status = 'DENIED'; audit('ACCESS_DENIED', req.user, doc, request, { reason: 'Evidence temporarily locked for tamper investigation' }); }
    else if (!requester || !isEligibleForDocument(requester, doc, db).eligible || !isEligibleForAction(requester, request.permission)) { request.status = 'DENIED'; audit('ACCESS_DENIED', req.user, doc, request, { reason: 'RBAC/ABAC eligibility failed at grant time' }); }
    else {
      request.status = 'GRANTED'; db.documentPermissions ||= [];
      db.documentPermissions.push({ userId: requester.id, documentId: doc.id, permission: request.permission, grantedByRequest: request.id, grantedAt: new Date().toISOString(), expiresAt: request.expiresAt });
      audit('ACCESS_GRANTED', req.user, doc, request, { permission: request.permission });
    }
  }
  dbService.writeDB(db);
  res.json({ request, message: request.status === 'REJECTED' ? `ACCESS BLOCKED — ${type.toUpperCase()} DENIED REQUEST` : undefined });
});

router.post('/:id/abnormality', authenticateToken, (req, res) => {
  if (!isSupervisor(req.user)) return res.status(403).json({ error: 'SUPERVISOR_ONLY' });
  const db = dbService.readDB(); const request = (db.accessRequests || []).find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: 'REQUEST_NOT_FOUND' });
  if (request.supervisorId !== req.user.id) return res.status(403).json({ error: 'OUT_OF_SUPERVISORY_SCOPE' });
  const doc = db.documents.find(d => d.id === request.documentId);
  const abnormality = { id: `ABN-${crypto.randomUUID()}`, requestId: request.id, documentId: doc.id, supervisorId: req.user.id, actorId: req.user.id, actorName: req.user.name, remark: String(req.body?.remark || '').slice(0, 1000), timestamp: new Date().toISOString() };
  db.abnormalities ||= []; db.abnormalities.push(abnormality); dbService.writeDB(db);
  audit('ABNORMALITY_LOGGED', req.user, doc, request, { abnormalityId: abnormality.id, remark: abnormality.remark });
  audit('ABNORMAL_ACTIVITY_FLAGGED', req.user, doc, request, { abnormalityId: abnormality.id, remark: abnormality.remark });
  res.status(201).json({ abnormality });
});

export default router;
