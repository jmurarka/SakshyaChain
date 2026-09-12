import express from 'express';
import { ledgerService } from '../services/ledgerService.js';
import { storageService } from '../services/storageService.js';
import { dbService } from '../services/dbService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/audit/blocks - Get full append-only blockchain ledger
router.get('/blocks', authenticateToken, (req, res) => {
  const blocks = ledgerService.getBlocks();
  res.json({ blocks, count: blocks.length });
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

  res.json({ auditReport });
});

// POST /api/audit/simulate-tamper - Out-of-band disk file tampering simulator for demonstration
router.post('/simulate-tamper', authenticateToken, (req, res) => {
  const { docId } = req.body;
  const doc = dbService.getDocumentById(docId || 'DOC-8891-001');

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
      message: `Simulated out-of-band byte alteration on disk file ${doc.id} (${doc.title}).`,
      instruction: 'Now click "Run Cryptographic Audit" to see SākshyaChain catch the hash mismatch in real-time!',
      tamperedDocId: doc.id
    });
  } catch (err) {
    res.status(500).json({ error: 'TAMPER_FAILED', message: err.message });
  }
});

export default router;
