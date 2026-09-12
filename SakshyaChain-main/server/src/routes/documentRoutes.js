import express from 'express';
import multer from 'multer';
import { dbService } from '../services/dbService.js';
import { storageService } from '../services/storageService.js';
import { ledgerService } from '../services/ledgerService.js';
import { ragEngine } from '../services/ragEngine.js';
import { versionService } from '../services/versionService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/documents - Returns clearance-filtered document list
router.get('/', authenticateToken, (req, res) => {
  const { caseId, category } = req.query;
  const docs = dbService.getDocumentsForUser(req.user, { caseId, category });
  res.json({ documents: docs, count: docs.length });
});

// GET /api/documents/:id - Get metadata and custody timeline
router.get('/:id', authenticateToken, (req, res) => {
  const doc = dbService.getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'DOC_NOT_FOUND', message: 'Document not found' });
  }

  // Clearance check unless active Break-Glass Grant exists
  if (!req.breakGlassActive && req.user.clearanceLevel < doc.clearanceLevel) {
    return res.status(403).json({
      error: 'FORBIDDEN_CLEARANCE_VIOLATION',
      message: `Access Denied: Clearance Level ${doc.clearanceLevel} required. Your level is ${req.user.clearanceLevel}.`
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

  res.json({ document: doc });
});

// POST /api/documents/upload - Secure File Upload & Envelope Encryption
router.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
  const { title, caseId, category, clearanceLevel, textContent } = req.body;
  const file = req.file;

  if (!title || !caseId || !category) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Title, caseId, and category are required' });
  }

  const docClearance = parseInt(clearanceLevel || '2', 10);
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
    authorId: req.user.id,
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
  const { docId } = req.params;
  const { textContent, changeNotes, isMajorVersion } = req.body;

  if (!textContent) {
    return res.status(400).json({ error: 'MISSING_CONTENT', message: 'textContent is required for new version' });
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

  // Clearance check unless active Break-Glass Grant exists
  if (!req.breakGlassActive && req.user.clearanceLevel < doc.clearanceLevel) {
    return res.status(403).json({
      error: 'FORBIDDEN_CLEARANCE_VIOLATION',
      message: `Access Denied: Clearance Level ${doc.clearanceLevel} required.`
    });
  }

  try {
    const decryptedBuffer = storageService.readFileFromVault(doc.id, doc.encryptionMetadata);

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

    const contentType = doc.mimeType || (doc.title?.endsWith('.pdf') || doc.originalFileName?.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
    const filename = doc.originalFileName || `${doc.id}_v${doc.version}_decrypted.pdf`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(decryptedBuffer);
  } catch (err) {
    res.status(500).json({ error: 'DECRYPTION_FAILED', message: err.message });
  }
});

export default router;
