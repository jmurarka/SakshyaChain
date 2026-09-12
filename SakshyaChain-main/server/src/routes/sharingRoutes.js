import express from 'express';
import { sharingService } from '../services/sharingService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/sharing/create-link - Create controlled expirable share link
router.post('/create-link', authenticateToken, (req, res) => {
  const { docId, recipientEmail, expiresAtHours } = req.body;
  if (!docId || !recipientEmail) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'docId and recipientEmail are required' });
  }

  try {
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
