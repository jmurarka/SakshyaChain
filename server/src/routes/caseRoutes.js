import express from 'express';
import { dbService } from '../services/dbService.js';
import { ledgerService } from '../services/ledgerService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/cases - List accessible legal cases
router.get('/', authenticateToken, (req, res) => {
  const cases = dbService.getCasesForUser(req.user);
  res.json({ cases, count: cases.length });
});

// GET /api/cases/transfers - Get inter-departmental transfer requests
router.get('/transfers', authenticateToken, (req, res) => {
  const assigned = new Set(req.user.assignedCases || []);
  const requests = dbService.getTransferRequests().filter(request => req.user.systemRole === 'IT_ADMIN' || assigned.has(request.caseId));
  res.json({ requests });
});

// POST /api/cases/transfers/request - Request document transfer between departments
router.post('/transfers/request', authenticateToken, (req, res) => {
  const { docId, targetDepartment, reason } = req.body;
  const doc = dbService.getDocumentById(docId);

  if (!doc) {
    return res.status(404).json({ error: 'DOC_NOT_FOUND', message: 'Document not found' });
  }
  if (req.user.systemRole !== 'IT_ADMIN' && !(req.user.assignedCases || []).includes(doc.caseId)) {
    return res.status(403).json({ error: 'CASE_ASSIGNMENT_REQUIRED', message: 'This case is not assigned to your account.' });
  }

  const newRequest = {
    id: `TRF-${Date.now().toString().slice(-4)}`,
    caseId: doc.caseId,
    documentId: doc.id,
    documentTitle: doc.title,
    requestedBy: req.user.id,
    requestedByName: req.user.name,
    fromDepartment: req.user.department,
    toDepartment: targetDepartment,
    reason: reason || 'Inter-departmental prosecution and court trial evidence transfer',
    status: 'PENDING',
    dateRequested: new Date().toISOString()
  };

  dbService.createTransferRequest(newRequest);

  // Log on Ledger
  ledgerService.addBlock({
    action: 'EVIDENCE_TRANSFER_REQUESTED',
    actorId: req.user.id,
    actorName: req.user.name,
    caseId: doc.caseId,
    docId: doc.id,
    docHash: doc.payloadHash,
    details: { fromDept: req.user.department, toDept: targetDepartment }
  });

  res.status(201).json({ message: 'Transfer request logged', request: newRequest });
});

// POST /api/cases/transfers/approve - Approve transfer request
router.post('/transfers/approve', authenticateToken, (req, res) => {
  const { requestId } = req.body;
  const db = dbService.readDB();
  const reqObj = db.transferRequests.find(r => r.id === requestId);

  if (!reqObj) {
    return res.status(404).json({ error: 'REQ_NOT_FOUND', message: 'Transfer request not found' });
  }
  if (req.user.systemRole !== 'IT_ADMIN' && !(req.user.assignedCases || []).includes(reqObj.caseId)) {
    return res.status(403).json({ error: 'CASE_ASSIGNMENT_REQUIRED', message: 'This case is not assigned to your account.' });
  }

  reqObj.status = 'APPROVED';
  reqObj.dateApproved = new Date().toISOString();
  reqObj.approvedBy = req.user.name;

  const doc = dbService.getDocumentById(reqObj.documentId);
  if (doc) {
    doc.chainOfCustody.push({
      action: `INTER_DEPT_TRANSFER_APPROVED (${reqObj.fromDepartment} -> ${reqObj.toDepartment})`,
      actorName: req.user.name,
      department: req.user.department,
      timestamp: reqObj.dateApproved
    });
    dbService.saveDocumentMetadata(doc);
  }

  dbService.writeDB(db);

  // Log on Ledger
  ledgerService.addBlock({
    action: 'EVIDENCE_TRANSFER_APPROVED',
    actorId: req.user.id,
    actorName: req.user.name,
    caseId: reqObj.caseId,
    docId: reqObj.documentId,
    docHash: doc ? doc.payloadHash : 'N/A',
    details: { approvedBy: req.user.name, transferId: requestId }
  });

  res.json({ message: 'Transfer approved and chain of custody updated', request: reqObj });
});

export default router;
