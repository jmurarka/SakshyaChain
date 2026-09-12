import express from 'express';
import { breakGlassService } from '../services/breakGlassService.js';
import { ledgerService } from '../services/ledgerService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/emergency/request - Request Break-Glass Emergency Access
router.post('/request', authenticateToken, (req, res) => {
  const { caseId, reason } = req.body;
  if (!caseId || !reason) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'caseId and reason are required' });
  }

  try {
    const requestObj = breakGlassService.requestEmergencyAccess({
      userId: req.user.id,
      caseId,
      reason
    });

    // Record BREAK_GLASS event on Audit DAG
    ledgerService.createEvent({
      document_id: 'CASE_' + caseId,
      case_id: caseId,
      action: 'BREAK_GLASS',
      user_id: req.user.id,
      user_role: req.user.role,
      data_hash: requestObj.id,
      metadata: { reason, status: 'PENDING_APPROVAL' }
    });

    res.status(201).json({
      message: 'Break-Glass Emergency Request submitted and logged to Audit DAG. Pending Supervisor Approval.',
      request: requestObj
    });
  } catch (err) {
    res.status(400).json({ error: 'EMERGENCY_REQ_FAILED', message: err.message });
  }
});

// POST /api/emergency/approve - Supervisor Approves 30-Minute Time-Boxed Emergency Grant
router.post('/approve', authenticateToken, (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: 'MISSING_REQUEST_ID', message: 'requestId is required' });
  }

  try {
    const grantObj = breakGlassService.approveEmergencyAccess({
      requestId,
      supervisorId: req.user.id
    });

    // Record BREAK_GLASS event on Audit DAG
    ledgerService.createEvent({
      document_id: 'CASE_' + (grantObj.caseId || 'UNKNOWN'),
      case_id: grantObj.caseId || 'UNKNOWN',
      action: 'BREAK_GLASS',
      user_id: req.user.id,
      user_role: req.user.role,
      data_hash: grantObj.id,
      metadata: { requestId, status: 'APPROVED_GRANT_30M' }
    });

    res.json({
      message: 'Break-Glass Emergency Access Approved! Granted 30-minute elevated access.',
      grant: grantObj
    });
  } catch (err) {
    res.status(400).json({ error: 'EMERGENCY_APPROVE_FAILED', message: err.message });
  }
});

// GET /api/emergency/active - Active Break-Glass Grants for current user
router.get('/active', authenticateToken, (req, res) => {
  const activeGrants = breakGlassService.getActiveGrantsForUser(req.user.id);
  const allRequests = breakGlassService.getAllRequests();
  res.json({ activeGrants, allRequests });
});

export default router;
