import express from 'express';
import { ledgerService } from '../services/ledgerService.js';
import { dbService } from '../services/dbService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/audit (or /api/ledger) & /blocks - Get full append-only blockchain ledger & edges
router.get(['/', '/blocks'], authenticateToken, (req, res) => {
  if (req.user.systemRole !== 'IT_ADMIN' && !['JUDICIAL_MAGISTRATE', 'COMPLIANCE_AUDITOR'].includes(req.user.role)) return res.status(403).json({ error: 'AUDIT_LEDGER_RESTRICTED' });
  const ledgerData = ledgerService.getBlocks();
  let chain = ledgerData.chain || ledgerData.blocks || [];
  let edges = ledgerData.edges || [];
  if (req.user.systemRole !== 'IT_ADMIN') {
    const db = dbService.readDB();
    const inScopeUsers = new Set([req.user.id, ...db.users.filter(u => u.supervisorId === req.user.id).map(u => u.id)]);
    const inScopeDocuments = new Set(db.documents.filter(d => inScopeUsers.has(d.ownerId || d.authorId)).map(d => d.id));
    (db.accessRequests || []).filter(r => r.supervisorId === req.user.id).forEach(r => inScopeDocuments.add(r.documentId));
    const inScopeCases = new Set(db.cases.filter(c => inScopeUsers.has(db.users.find(u => u.name === c.leadInvestigator)?.id)).map(c => c.id));
    chain = chain.filter(b => inScopeUsers.has(b.actorId) || inScopeDocuments.has(b.docId) || inScopeCases.has(b.caseId));
    const visible = new Set(chain.map(b => String(b.index ?? b.blockHeight)));
    edges = edges.filter(e => visible.has(String(e.source)) && visible.has(String(e.target)));
  }
  res.json({
    chain,
    blocks: chain,
    edges,
    count: chain.length
  });
});

// GET /api/audit/verify - 1-Click Server Cryptographic Audit (Chain + Disk Vault)
router.get('/verify', authenticateToken, (req, res) => {
  if (req.user.systemRole === 'IT_ADMIN') return res.status(403).json({ error: 'READ_ONLY_ADMIN', message: 'Integrity verification writes an audit event and is unavailable in the read-only portal.' });
  if (!['JUDICIAL_MAGISTRATE', 'COMPLIANCE_AUDITOR'].includes(req.user.role)) return res.status(403).json({ error: 'SUPERVISOR_ONLY' });
  const auditReport = ledgerService.verifyChainIntegrity();

  // Log audit check trigger
  ledgerService.addBlock({
    action: 'SYSTEM_AUDIT_EXECUTED',
    actorId: req.user.id,
    actorName: req.user.name,
    caseId: 'SYSTEM',
    docId: 'SYSTEM',
    docHash: 'AUDIT_CHECK',
    details: { auditStatus: auditReport.tamperDetected ? 'TAMPER_ALERT' : 'VERIFIED_OK' }
  });

  res.json({
    isValid: !auditReport.tamperDetected,
    chainIntact: auditReport.chainIntact,
    auditReport
  });
});

// POST /api/audit/simulate-tamper & /tamper-test - Out-of-band disk file tampering simulator for demonstration
router.post(['/simulate-tamper', '/tamper-test'], authenticateToken, (req, res) => {
  if (req.user.systemRole === 'IT_ADMIN') return res.status(403).json({ error: 'READ_ONLY_ADMIN' });
  if (req.user.id !== 'USR-POL-102') return res.status(403).json({ error: 'TAMPER_DEMO_ACTOR_REQUIRED', message: 'Sign in as Inspector Bhir Rao to run the employee tamper demonstration.' });
  const { docId } = req.body || {};
  const targetDocId = docId;
  if (!targetDocId) return res.status(400).json({ error: 'DOCUMENT_REQUIRED', message: 'Select the evidence file used for this tamper demonstration.' });
  const doc = dbService.getDocumentById(targetDocId);

  if (!doc) {
    return res.status(404).json({ error: 'DOC_NOT_FOUND', message: 'Target document for tamper test not found' });
  }

  try {
    const db = dbService.readDB();
    const targetDoc = db.documents.find(item => item.id === doc.id);
    const incidentUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const frozenUser = db.users.find(user => user.id === req.user.id);
    frozenUser.accountFrozen = true;
    frozenUser.frozenAt = new Date().toISOString();
    frozenUser.frozenUntil = incidentUntil;
    frozenUser.freezeReason = `Tampering detected on evidence ${doc.id}`;
    targetDoc.tamperLockedUntil = incidentUntil;
    targetDoc.tamperLockReason = 'Unauthorized change attempt blocked; temporarily locked for IT security review.';
    targetDoc.tamperDetectedAt = new Date().toISOString();
    targetDoc.tamperActorId = req.user.id;
    targetDoc.tamperActorName = req.user.name;
    dbService.writeDB(db);

    // Persist the IT notification before the secondary ledger write so an
    // audit-ledger failure cannot silently swallow the security alert.
    const alert = dbService.addSecurityAlert({
      title: 'Evidence Tampering Detected — Account Frozen',
      severity: 'HIGH',
      category: 'EVIDENCE_TAMPERING',
      actor: `${req.user.name} (${req.user.id})`,
      userId: req.user.id,
      userName: req.user.name,
      docId: doc.id,
      timestamp: new Date().toISOString(),
      details: `${req.user.name} attempted to tamper with “${doc.title}”. The change was blocked before the vault file was altered. The account and evidence are locked until ${new Date(incidentUntil).toLocaleString()}.`,
      accountFrozen: true,
      frozenUntil: incidentUntil,
      evidenceLocked: true,
      evidenceLockedUntil: incidentUntil
    });

    // Attribute the simulated unauthorized change to the signed-in employee.
    let ledgerWarning = null;
    try {
      ledgerService.addBlock({
        action: 'EVIDENCE_TAMPER_DETECTED',
        actorId: req.user.id,
        actorName: req.user.name,
        caseId: doc.caseId,
        docId: doc.id,
        docHash: doc.payloadHash,
        details: { targetDoc: doc.title, method: 'Unauthorized evidence change attempt blocked before vault write', accountFrozen: true, evidenceLockedUntil: incidentUntil }
      });
    } catch (ledgerError) {
      // The account freeze, evidence lock, and IT alert are already persisted.
      // Keep the lockout flow successful even if ledger anchoring is unavailable.
      ledgerWarning = 'The incident was recorded and locked, but ledger anchoring needs review.';
      console.error('Tamper incident ledger anchoring failed:', ledgerError);
    }

    res.json({
      success: true,
      message: `Tampering detected. ${req.user.name}'s account is frozen and ${doc.title} is locked for 15 minutes. IT Admins have been alerted.`,
      tamperedDocId: doc.id,
      alert,
      alertId: alert.id,
      frozenUntil: incidentUntil,
      ledgerWarning
    });
  } catch (err) {
    res.status(500).json({ error: 'TAMPER_FAILED', message: err.message });
  }
});

// GET /api/audit/alerts - Fetch real-time security alerts from persistent database
router.get('/alerts', authenticateToken, (req, res) => {
  let alerts = dbService.getSecurityAlerts();
  if (req.user.systemRole !== 'IT_ADMIN') {
    const db = dbService.readDB();
    const isSupervisor = ['JUDICIAL_MAGISTRATE', 'COMPLIANCE_AUDITOR'].includes(req.user.role);
    const scopeUsers = isSupervisor ? db.users.filter(u => u.supervisorId === req.user.id || u.id === req.user.id) : [req.user];
    const scopeUserIds = new Set(scopeUsers.map(u => u.id));
    const scopeDocIds = new Set(db.documents.filter(d => scopeUserIds.has(d.ownerId || d.authorId)).map(d => d.id));
    const actorMatches = a => scopeUsers.some(u => String(a.actor || '').toLowerCase().includes(u.name.toLowerCase()) || String(a.actor || '').toLowerCase().includes(u.username.toLowerCase()));
    alerts = alerts.filter(a => scopeDocIds.has(a.docId) || actorMatches(a));
  }
  res.json({ alerts, count: alerts.length });
});

// POST /api/audit/alerts/:id/acknowledge - IT Admin acknowledges a viewed tampering incident
router.post('/alerts/:id/acknowledge', authenticateToken, (req, res) => {
  if (req.user.systemRole !== 'IT_ADMIN') return res.status(403).json({ error: 'IT_ADMIN_ONLY' });
  const alert = dbService.getSecurityAlerts().find(item => item.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'ALERT_NOT_FOUND' });
  if (alert.category !== 'EVIDENCE_TAMPERING') return res.status(400).json({ error: 'TAMPERING_INCIDENT_ONLY' });
  if (alert.status === 'RESOLVED') return res.json({ alert, alreadyAcknowledged: true });

  const resolutionNotes = `Viewed and acknowledged by IT Admin ${req.user.name}.`;
  let blockAddress = '';
  let ledgerWarning = null;
  try {
    const ledgerBlock = ledgerService.addBlock({
      action: 'IT_ADMIN_TAMPER_ALERT_ACKNOWLEDGED',
      actorId: req.user.id,
      actorName: req.user.name,
      caseId: alert.docId || 'SECURITY_GOVERNANCE',
      docId: alert.id,
      docHash: alert.docId || 'EVIDENCE_TAMPERING',
      details: { alertTitle: alert.title, resolutionNotes, resolvedAt: new Date().toISOString() }
    });
    blockAddress = ledgerBlock.currentHash;
  } catch (ledgerError) {
    ledgerWarning = 'The alert was acknowledged, but ledger anchoring needs review.';
    console.error('Tamper alert acknowledgement ledger anchoring failed:', ledgerError);
  }

  const updatedAlert = dbService.resolveSecurityAlert(req.params.id, req.user, resolutionNotes, blockAddress);
  res.json({ alert: updatedAlert, ledgerWarning });
});

// POST /api/audit/alerts/:id/resolve - Resolve a security incident & anchor cryptographic proof to Audit DAG
router.post('/alerts/:id/resolve', authenticateToken, (req, res) => {
  if (req.user.systemRole === 'IT_ADMIN') return res.status(403).json({ error: 'READ_ONLY_ADMIN' });
  const { id } = req.params;
  const { resolutionNotes } = req.body || {};

  const isBossRole = req.user.clearanceLevel >= 4 || ['JUDICIAL_MAGISTRATE', 'COMPLIANCE_AUDITOR', 'ADMIN'].includes(req.user.role);
  if (!isBossRole) {
    return res.status(403).json({
      error: 'FORBIDDEN_ALERT_RESOLUTION',
      message: 'Access Denied: Only Level 4 Magistrates and Security Auditors can acknowledge and resolve security incidents.'
    });
  }

  let alert = dbService.getSecurityAlerts().find(a => a.id === id);
  if (!alert) {
    alert = {
      id,
      title: 'Security Incident Acknowledged',
      severity: 'HIGH',
      category: 'SECURITY_GOVERNANCE',
      docId: 'N/A',
      details: 'Security incident acknowledged and resolved by magistrate authority.'
    };
  }

  // Anchor cryptographic resolution event block to Audit DAG Ledger
  const ledgerBlock = ledgerService.addBlock({
    action: 'SECURITY_INCIDENT_RESOLVED',
    actorId: req.user.id,
    actorName: req.user.name,
    caseId: alert.docId && alert.docId !== 'N/A' ? alert.docId : 'SECURITY_GOVERNANCE',
    docId: alert.id,
    docHash: alert.docId || 'SECURITY_INCIDENT',
    details: {
      alertTitle: alert.title,
      severity: alert.severity,
      resolverRole: req.user.roleTitle || req.user.role,
      resolutionNotes: resolutionNotes || 'Magistrate/Auditor reviewed & resolved incident out-of-band.',
      resolvedAt: new Date().toISOString()
    }
  });

  const updatedAlert = dbService.resolveSecurityAlert(id, req.user, resolutionNotes, ledgerBlock.currentHash);

  res.json({
    message: `Security incident ${id} successfully resolved and cryptographically anchored to Audit DAG.`,
    alert: updatedAlert,
    auditBlock: {
      blockIndex: ledgerBlock.index,
      blockHash: ledgerBlock.currentHash,
      previousHash: ledgerBlock.previousHash,
      timestamp: ledgerBlock.timestamp
    }
  });
});

export default router;
