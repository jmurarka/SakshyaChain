import express from 'express';
import { ledgerService } from '../services/ledgerService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/audit OR /api/audit/blocks OR /api/ledger OR /api/ledger/blocks
router.get(['/', '/blocks'], authenticateToken, (req, res) => {
  const { blocks, edges } = ledgerService.getBlocks();
  res.json({
    success: true,
    blocks,
    chain: blocks,
    edges,
    count: blocks.length
  });
});

// GET /api/audit/blocks/:id - Get specific block by ID or hash
router.get(['/blocks/:id', '/:id'], authenticateToken, (req, res) => {
  const block = ledgerService.getBlockById(req.params.id);
  if (!block) {
    return res.status(404).json({ error: 'BLOCK_NOT_FOUND', message: 'Requested block not found in audit chain' });
  }
  res.json(block);
});

// GET /api/audit/verify - Verify full DAG cryptographic chain integrity
router.get('/verify', authenticateToken, (req, res) => {
  const result = ledgerService.verifyChainIntegrity();

  ledgerService.createEvent({
    document_id: 'SYSTEM_AUDIT',
    case_id: 'SYSTEM_AUDIT',
    action: 'VERIFY',
    user_id: req.user ? req.user.id : 'USR-AUD-505',
    user_role: req.user ? req.user.role : 'COMPLIANCE_AUDITOR',
    data_hash: result.status === 'OK' ? 'VERIFIED_OK' : 'TAMPER_DETECTED',
    parent_hashes: [],
    metadata: { audit_result: result.status, broken_blocks_count: result.broken_blocks ? result.broken_blocks.length : 0 }
  });

  res.json({
    isValid: result.status === 'OK',
    auditReport: result,
    totalBlocks: result.blocks_checked,
    ...result
  });
});

// POST /api/audit/event - Create a new append-only block in audit chain
router.post(['/', '/event'], authenticateToken, (req, res) => {
  const { document_id, case_id, version_id, action, user_id, user_role, data_hash, parent_hashes, metadata } = req.body;

  const createdBlock = ledgerService.createEvent({
    document_id: document_id || 'DOC-GENERIC',
    case_id: case_id || 'CASE-GENERIC',
    version_id: version_id || '',
    action: action || 'GENERIC_ACTION',
    user_id: user_id || (req.user ? req.user.id : 'SYSTEM'),
    user_role: user_role || (req.user ? req.user.role : 'SYSTEM_ROLE'),
    data_hash: data_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    parent_hashes: parent_hashes || [],
    metadata: metadata || {}
  });

  res.status(201).json({
    event_id: createdBlock.event_id,
    event_hash: createdBlock.event_hash,
    timestamp: createdBlock.timestamp,
    block: createdBlock
  });
});

// POST /api/audit/anchor - Trigger daily Merkle root anchoring to Hyperledger Fabric
router.post('/anchor', authenticateToken, (req, res) => {
  const anchorResult = ledgerService.anchorDailyMerkleRoot();
  res.json({ success: true, anchor: anchorResult });
});

// POST /api/audit/simulate-tamper - Out-of-band byte alteration simulator for demo
router.post('/simulate-tamper', authenticateToken, (req, res) => {
  const { event_id, docId } = req.body;
  const tamperedBlock = ledgerService.simulateTampering(event_id || docId);

  if (!tamperedBlock) {
    return res.status(404).json({ error: 'TARGET_NOT_FOUND', message: 'Could not find block to tamper' });
  }

  res.json({
    message: `Simulated out-of-band byte corruption on block ${tamperedBlock.event_id} (${tamperedBlock.action}).`,
    instruction: 'Click "Verify Ledger Integrity" to catch the SHA-256 mismatch in real-time!',
    tampered_block_hash: tamperedBlock.event_hash
  });
});

export default router;
