import express from 'express';
import multer from 'multer';
import { dbService } from '../services/dbService.js';
import { storageService } from '../services/storageService.js';
import { ledgerService } from '../services/ledgerService.js';
import { ragEngine } from '../services/ragEngine.js';
import { versionService } from '../services/versionService.js';
import { wrapTextInPDFBuffer } from '../services/cryptoService.js';
import { authenticateToken } from '../middleware/auth.js';
import { evaluateDocumentAccess, getDocumentCapabilities, isEligibleForDocument } from '../services/documentAccessService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/documents - Returns clearance-filtered document list
router.get('/', authenticateToken, (req, res) => {
  const { caseId, category } = req.query;
  const db = dbService.readDB();
  const docs = req.user.systemRole === 'IT_ADMIN'
    ? db.documents.filter(d => (!caseId || d.caseId === caseId) && (!category || d.category === category)).map(({ extractedText, encryptionMetadata, ...d }) => d)
    : dbService.getDocumentsForUser(req.user, { caseId, category });
  res.json({ documents: docs.map(doc => ({ ...doc, access: req.user.systemRole === 'IT_ADMIN' ? { mode: 'VIEW', grantedPermission: null, canView: true, canDownload: false, canEdit: false, readOnlyAdmin: true } : getDocumentCapabilities({ user: req.user, doc, db }) })), count: docs.length });
});

// GET /api/documents/:id - Get metadata and custody timeline
router.get('/:id', authenticateToken, (req, res) => {
  const doc = dbService.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'DOC_NOT_FOUND', message: 'Document not found' });
  }

  const db = dbService.readDB();
  if (req.user.systemRole === 'IT_ADMIN') {
    ledgerService.addBlock({ action: 'IT_ADMIN_EVIDENCE_VIEWED', actorId: req.user.id, actorName: req.user.name, caseId: doc.caseId, docId: doc.id, docHash: doc.payloadHash, details: { readOnly: true } });
    return res.json({ document: doc, access: { mode: 'VIEW', canView: true, canDownload: false, canEdit: false, readOnlyAdmin: true } });
  }
  const decision = evaluateDocumentAccess({ user: req.user, doc, db, permission: 'VIEW', breakGlass: !!req.breakGlassActive });
  if (!decision.allowed) {
    const previousRequest = [...(db.accessRequests || [])].filter(r => r.documentId === doc.id && r.requesterId === req.user.id).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
    const denialReason = previousRequest?.ownerDecision === 'REJECTED' ? 'File owner approval rejected.' : previousRequest?.supervisorDecision === 'REJECTED' ? 'Supervisor approval rejected.' : decision.reason;
    ledgerService.addBlock({ action: 'ACCESS_DENIED', actorId: req.user.id, actorName: req.user.name, caseId: doc.caseId, docId: doc.id, docHash: doc.payloadHash, details: { requestId: previousRequest?.id, reason: denialReason } });
    return res.status(403).json({
      error: !decision.clearance ? 'FORBIDDEN_CLEARANCE_VIOLATION' : 'APPROVAL_REQUIRED',
      message: decision.reason,
      accessDecision: { requester: req.user.name, role: req.user.role, department: req.user.department, clearance: req.user.clearanceLevel, file: doc.title, owner: db.users.find(u => u.id === (doc.ownerId || doc.authorId))?.name || doc.authorName, rbacAbac: decision.rbacEligible ? 'PASS' : 'FAIL', ownerApproval: previousRequest?.ownerDecision || 'REQUIRED', supervisorApproval: previousRequest?.supervisorDecision || 'REQUIRED', decision: 'DENIED', reason: denialReason }
    });
  }

  // Log view event to Blockchain Ledger
  ledgerService.addBlock({
    action: req.breakGlassActive ? 'DOCUMENT_VIEWED_BREAK_GLASS' : 'DOCUMENT_VIEWED',
    actorId: req.user.id,
    actorName: req.user.name,
    caseId: doc.caseId,
    docId: doc.id,
    docHash: doc.payloadHash,
    details: {
      viewerRole: req.user.role,
      viewerDept: req.user.department,
      breakGlass: !!req.breakGlassActive
    }
  });

  res.json({ document: doc, access: getDocumentCapabilities({ user: req.user, doc, db }) });
});

// POST /api/documents/upload - Secure File Upload & Envelope Encryption
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
  const { title, caseId, category, clearanceLevel, textContent } = req.body;
  const file = req.file;

  if (!title || !caseId || !category) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Title, caseId, and category are required' });
  }

  const docClearance = parseInt(clearanceLevel || '2', 10);
  const db = dbService.readDB();
  const parentCase = db.cases.find(c => c.id === caseId);
  if (!parentCase || !isEligibleForDocument(req.user, { caseId, clearanceLevel: docClearance }, db).caseEligible) return res.status(403).json({ error: 'CASE_ASSIGNMENT_REQUIRED', message: 'Upload requires access to the selected case under your department or assignment.' });
  if (req.user.clearanceLevel < docClearance) {
    return res.status(403).json({
      error: 'FORBIDDEN_CANNOT_CREATE_ABOVE_CLEARANCE',
      message: `Cannot assign clearance level ${docClearance} higher than your clearance level ${req.user.clearanceLevel}.`
    });
  }

  let fileBuffer;
  let mimeType = 'text/plain';
  let originalFileName = null;
  let rawText = '';

  if (file) {
    fileBuffer = file.buffer; // Preserve exact binary buffer (PDF, images, etc.)
    mimeType = file.mimetype || 'application/pdf';
    originalFileName = file.originalname;

    // Avoid populating extractedText with raw binary PDF bytes
    if (textContent && !textContent.trim().startsWith('%PDF-')) {
      rawText = textContent.trim();
    } else {
      rawText = `[PDF Document Attachment: ${file.originalname}]`;
    }
  } else {
    rawText = textContent || 'Standard legal document content.';
    fileBuffer = Buffer.from(rawText, 'utf8');
  }

  const docId = `DOC-${caseId.replace('CASE-', '')}-${Date.now().toString().slice(-4)}`;

  // AES-256-GCM Envelope Encryption at Rest directly on fileBuffer
  const storageRes = storageService.saveFileToVault(docId, fileBuffer);

  // AI Document Intelligence (Auto Classification & Entity Extraction)
  const aiEntities = ragEngine.generateDocumentSummary(rawText, category);

  const newDoc = {
    id: docId,
    title,
    caseId,
    caseTitle: `Case ${caseId}`,
    category,
    clearanceLevel: docClearance,
    accessPolicy: docClearance >= 3 ? 'OWNER_APPROVAL' : 'CASE_POLICY',
    authorId: req.user.id,
    ownerId: req.user.id,
    authorName: req.user.name,
    authorRole: req.user.role,
    department: req.user.department,
    dateCreated: new Date().toISOString(),
    version: '1.0',
    status: 'VERIFIED',
    extractedText: rawText,
    mimeType,
    originalFileName: originalFileName || `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
    payloadHash: storageRes.payloadHash,
    fileSize: storageRes.fileSize,
    encryptionMetadata: storageRes.encryptionMetadata,
    signature: null,
    aiEntities: aiEntities.criticalEntities,
    versionHistory: [
      {
        version: '1.0',
        parentVersion: 'GENESIS',
        parentPayloadHash: '0'.repeat(64),
        payloadHash: storageRes.payloadHash,
        fileSize: storageRes.fileSize,
        authorId: req.user.id,
        authorName: req.user.name,
        department: req.user.department,
        dateCreated: new Date().toISOString(),
        changeNotes: 'Initial document filing (v1.0)'
      }
    ],
    chainOfCustody: [
      {
        action: 'UPLOADED_AND_ENCRYPTED',
        actorName: req.user.name,
        department: req.user.department,
        timestamp: new Date().toISOString()
      }
    ]
  };

  // Save Metadata to DB
  dbService.saveDocumentMetadata(newDoc);

  // Add to RAG Engine
  ragEngine.addChunksFromDocument(newDoc);

  // Record Immutable Block on Blockchain Ledger
  const ledgerBlock = ledgerService.addBlock({
    action: 'DOCUMENT_UPLOADED',
    actorId: req.user.id,
    actorName: req.user.name,
    caseId: newDoc.caseId,
    docId: newDoc.id,
    docHash: storageRes.payloadHash,
    details: {
      title: newDoc.title,
      category: newDoc.category,
      clearanceLevel: docClearance,
      encryptionAlgorithm: storageRes.encryptionMetadata.algorithm
    }
  });

  res.status(201).json({
    message: 'Document successfully uploaded, AES-256 encrypted, and anchored to Audit DAG.',
    document: newDoc,
    ledgerBlock
  });
});

// POST /api/documents/:id/versions - Add New Revision/Version (v1.1, v2.0)
router.post('/:id/versions', authenticateToken, (req, res) => {
  const docId = req.params.id;
  const { textContent, changeNotes, isMajorVersion } = req.body;

  if (!textContent) {
    return res.status(400).json({ error: 'MISSING_CONTENT', message: 'textContent is required for new version' });
  }

  const doc = dbService.getDocumentById(docId);
  const db = dbService.readDB();
  const decision = doc && evaluateDocumentAccess({ user: req.user, doc, db, permission: 'EDIT' });
  if (!decision?.allowed) {
    if (doc) ledgerService.addBlock({ action: 'ACCESS_DENIED', actorId: req.user.id, actorName: req.user.name, caseId: doc.caseId, docId: doc.id, docHash: doc.payloadHash, details: { reason: 'Edit permission required' } });
    return res.status(403).json({ error: 'EDIT_PERMISSION_REQUIRED', message: 'Only the file owner or a user with explicit edit permission may create a version.' });
  }

  try {
    const versionRes = versionService.addDocumentVersion({
      docId: docId || req.params.id,
      newTextContent: textContent,
      changeNotes: changeNotes || 'Revision updated',
      isMajorVersion: !!isMajorVersion,
      authorUser: req.user
    });

    res.status(201).json({
      message: `Document revision successfully created (${versionRes.versionRecord.version}) and anchored to Audit DAG.`,
      ...versionRes
    });
  } catch (err) {
    res.status(400).json({ error: 'VERSION_CREATION_FAILED', message: err.message });
  }
});

// GET /api/documents/:id/download - Stream decrypted buffer to authorized user
router.get('/:id/download', authenticateToken, (req, res) => {
  const doc = dbService.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'DOC_NOT_FOUND', message: 'Document not found' });
  }

  const db = dbService.readDB();
  const decision = evaluateDocumentAccess({ user: req.user, doc, db, permission: 'DOWNLOAD', breakGlass: !!req.breakGlassActive });
  if (!decision.allowed) {
    ledgerService.addBlock({ action: 'ACCESS_DENIED', actorId: req.user.id, actorName: req.user.name, caseId: doc.caseId, docId: doc.id, docHash: doc.payloadHash, details: { reason: decision.reason } });
    return res.status(403).json({
      error: !decision.clearance ? 'FORBIDDEN_CLEARANCE_VIOLATION' : 'APPROVAL_REQUIRED', message: decision.reason
    });
  }

  try {
    const decryptedBuffer = storageService.readFileFromVault(doc.currentFileId || doc.id, doc.encryptionMetadata);

    // Log Download Action to Ledger
    ledgerService.addBlock({
      action: req.breakGlassActive ? 'DOCUMENT_DOWNLOADED_BREAK_GLASS' : 'DOCUMENT_DOWNLOADED',
      actorId: req.user.id,
      actorName: req.user.name,
      caseId: doc.caseId,
      docId: doc.id,
      docHash: doc.payloadHash,
      details: { downloaderRole: req.user.role }
    });

    let filename = doc.originalFileName || `${doc.title ? doc.title.replace(/[^a-zA-Z0-9_-]/g, '_') : doc.id}.pdf`;
    if (!/\.(pdf|txt|docx|json)$/i.test(filename)) {
      filename += '.pdf';
    }

    let finalBuffer = decryptedBuffer;
    const isPdfBinary = decryptedBuffer.length >= 5 && decryptedBuffer.toString('utf-8', 0, 5) === '%PDF-';

    if (!isPdfBinary && (doc.mimeType === 'application/pdf' || filename.endsWith('.pdf'))) {
      finalBuffer = wrapTextInPDFBuffer(doc.title || doc.id, decryptedBuffer.toString('utf-8'));
    }

    const contentType = filename.endsWith('.txt') ? 'text/plain; charset=utf-8' : 'application/pdf';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(finalBuffer);
  } catch (err) {
    res.status(500).json({ error: 'DECRYPTION_FAILED', message: err.message });
  }
});

export default router;
