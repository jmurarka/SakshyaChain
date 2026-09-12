import express from 'express';
import { ledgerService } from '../services/ledgerService.js';
import { storageService } from '../services/storageService.js';
import { dbService } from '../services/dbService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/audit (or /api/ledger) & /blocks - Get full append-only blockchain ledger & edges
router.get(['/', '/blocks'], authenticateToken, (req, res) => {
  const ledgerData = ledgerService.getBlocks();
  const chain = ledgerData.chain || ledgerData.blocks || [];
  const edges = ledgerData.edges || [];
  res.json({
    chain,
    blocks: chain,
    edges,
    count: chain.length
  });
});

// GET /api/audit/verify - 1-Click Server Cryptographic Audit (Chain + Disk Vault)
router.get('/verify', authenticateToken, (req, res) => {
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
  const { docId } = req.body || {};
  const targetDocId = docId || 'DOC-8891-002';
  const doc = dbService.getDocumentById(targetDocId);

  if (!doc) {
    return res.status(404).json({ error: 'DOC_NOT_FOUND', message: 'Target document for tamper test not found' });
  }

  try {
    storageService.simulateTamperOnDisk(doc.id);

    // Record Tamper Event on Ledger
    ledgerService.addBlock({
      action: 'UNAUTHORIZED_STORAGE_MUTATION_SIMULATED',
      actorId: 'ATTACKER_SIMULATOR',
      actorName: 'Disk Byte Tamper Injector',
      caseId: doc.caseId,
      docId: doc.id,
      docHash: 'CORRUPTED_HASH',
      details: { targetDoc: doc.title, method: 'Direct Storage Byte Inversion' }
    });

    res.json({
      success: true,
      message: `Simulated out-of-band byte alteration on disk file ${doc.id} (${doc.title}).`,
      instruction: 'Now click "Run Cryptographic Audit" to see SākshyaChain catch the hash mismatch in real-time!',
      tamperedDocId: doc.id
    });
  } catch (err) {
    res.status(500).json({ error: 'TAMPER_FAILED', message: err.message });
  }
});

// GET /api/audit/alerts - Fetch real-time security alerts from persistent database
router.get('/alerts', authenticateToken, (req, res) => {
  const alerts = dbService.getSecurityAlerts();
  res.json({ alerts, count: alerts.length });
});

// POST /api/audit/alerts/:id/resolve - Resolve a security incident & anchor cryptographic proof to Audit DAG
router.post('/alerts/:id/resolve', authenticateToken, (req, res) => {
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
