import express from 'express';
import { ragEngine } from '../services/ragEngine.js';
import { dbService } from '../services/dbService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/ai/rag-search - Permission-Aware RAG Search with Evidence Citations
router.post('/rag-search', authenticateToken, (req, res) => {
  const { query, caseId } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'MISSING_QUERY', message: 'Query string required' });
  }

  const results = ragEngine.performRAGSearch(req.user, query, caseId);
  res.json({ results });
});

// POST /api/ai/summarize - Auto Legal Brief Summarizer
router.post('/summarize', authenticateToken, (req, res) => {
  const { docId } = req.body;
  const doc = dbService.getDocumentById(docId);

  if (!doc) {
    return res.status(404).json({ error: 'DOC_NOT_FOUND', message: 'Document not found' });
  }

  // Clearance Guard
  if (req.user.clearanceLevel < doc.clearanceLevel) {
    return res.status(403).json({ error: 'FORBIDDEN_CLEARANCE', message: 'Insufficient clearance for AI summary' });
  }

  const summary = ragEngine.generateDocumentSummary(doc.extractedText, doc.category);
  res.json({ summary, docTitle: doc.title });
});

// POST /api/ai/detect-pii - PII Auto Redaction helper
router.post('/detect-pii', authenticateToken, (req, res) => {
  const { docId } = req.body;
  const doc = dbService.getDocumentById(docId);

  if (!doc) {
    return res.status(404).json({ error: 'DOC_NOT_FOUND', message: 'Document not found' });
  }

  const piiList = ragEngine.detectPIIForRedaction(doc.extractedText);
  res.json({ piiList, docTitle: doc.title });
});

export default router;
