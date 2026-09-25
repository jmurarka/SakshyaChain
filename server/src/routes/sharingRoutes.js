import express from 'express';
import { sharingService } from '../services/sharingService.js';
import { authenticateToken } from '../middleware/auth.js';
import { dbService } from '../services/dbService.js';
import { ledgerService } from '../services/ledgerService.js';
import { evaluateDocumentAccess } from '../services/documentAccessService.js';

const router = express.Router();

// POST /api/sharing/create-link - Create controlled expirable share link
router.post('/create-link', authenticateToken, (req, res) => {
  const { docId, recipientEmail, expiresAtHours } = req.body;
  if (!docId || !recipientEmail) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'docId and recipientEmail are required' });
  }

  try {
    const doc = dbService.getDocumentById(docId); const db = dbService.readDB();
    const policyAllowsShare = doc && evaluateDocumentAccess({ user: req.user, doc, db, permission: 'SHARE' }).allowed;
    const explicitShareGrant = doc && (db.documentPermissions || []).some(p => p.userId === req.user.id && p.documentId === doc.id && p.permission === 'SHARE' && (!p.expiresAt || Date.parse(p.expiresAt) > Date.now()));
    const canShare = policyAllowsShare && (doc.accessPolicy !== 'OWNER_APPROVAL' || explicitShareGrant);
    if (!canShare) {
      if (doc) ledgerService.addBlock({ action: 'ACCESS_DENIED', actorId: req.user.id, actorName: req.user.name, caseId: doc.caseId, docId: doc.id, docHash: doc.payloadHash, details: { reason: 'Share permission required' } });
      return res.status(403).json({ error: 'SHARE_PERMISSION_REQUIRED', message: 'The file owner or an explicit share grant is required.' });
    }
    const shareObj = sharingService.createControlledShareLink({
      docId,
      recipientEmail,
      expiresAtHours: parseInt(expiresAtHours || '24', 10),
      createdByUser: req.user
    });

    res.status(201).json({
      message: 'Controlled Share Link created with OTP gate & View-Only enforcement.',
      shareToken: shareObj.shareToken,
      accessOTP: shareObj.accessOTP, // Provided for user UI display
      expiresAt: shareObj.expiresAt,
      policy: shareObj.policy
    });
  } catch (err) {
    res.status(400).json({ error: 'SHARE_LINK_FAILED', message: err.message });
  }
});

// POST /api/sharing/access - Verify share OTP & stream view-only content
router.post('/access', (req, res) => {
  const { shareToken, otp } = req.body;
  if (!shareToken || !otp) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'shareToken and otp code are required' });
  }

  try {
    const payload = sharingService.verifyShareOTPAndGetContent({ shareToken, otp });
    res.setHeader('X-Access-Policy', 'ViewOnly-NoDownload');
    res.json({
      message: 'Controlled Link Access Granted (View-Only Mode)',
      ...payload
    });
  } catch (err) {
    res.status(403).json({ error: 'SHARE_ACCESS_DENIED', message: err.message });
  }
});

export default router;
