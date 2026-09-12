import express from 'express';
import { ragEngine } from '../services/ragEngine.js';
import { dbService } from '../services/dbService.js';
import { ledgerService } from '../services/ledgerService.js';
import { authenticateToken } from '../middleware/auth.js';
import { ipAllowlist } from '../middleware/ipAllowlist.js';
import { CONFIG } from '../config.js';
import axios from 'axios';

const router = express.Router();

// Apply IP Allowlist to all AI Gateway endpoints
router.use(ipAllowlist);

// GET /api/ai/network-status - Diagnostic check for Air-Gap status, IP Allowlist, and Ollama connectivity
router.get('/network-status', authenticateToken, async (req, res) => {
  let ollamaOnline = false;
  let availableModels = [];

  try {
    const response = await axios.get(`${CONFIG.OLLAMA_URL}/api/tags`, { timeout: 1500 });
    if (response.data && response.data.models) {
      ollamaOnline = true;
      availableModels = response.data.models.map(m => m.name);
    }
  } catch (err) {
    ollamaOnline = false;
  }

  res.json({
    status: 'AIR_GAPPED_GATEWAY_ACTIVE',
    clientIp: req.clientIp || req.ip || '127.0.0.1',
    allowedIps: CONFIG.ALLOWED_IPS,
    ollama: {
      url: CONFIG.OLLAMA_URL,
      model: CONFIG.OLLAMA_MODEL,
      status: ollamaOnline ? 'ONLINE' : 'OFFLINE_FALLBACK_ACTIVE',
      availableModels
    },
    airGapSecured: true,
    auditTrailSync: 'ACTIVE'
  });
});

// POST /api/ai/rag-search - Permission-Aware RAG Search with Evidence Citations
router.post('/rag-search', authenticateToken, async (req, res) => {
  const { query, caseId } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'MISSING_QUERY', message: 'Query string required' });
  }

  const results = await ragEngine.performRAGSearch(req.user, query, caseId);

  // Record AI_QUERY event on Audit DAG
  ledgerService.createEvent({
    document_id: 'RAG_INDEX',
    case_id: caseId || 'ALL_CASES',
    action: 'AI_QUERY',
    user_id: req.user.id,
    user_role: req.user.role,
    data_hash: results.answer ? results.answer.slice(0, 32) : 'RAG_QUERY',
    metadata: {
      query: query.slice(0, 100),
      resultsCount: results.citations ? results.citations.length : 0,
      engine: results.engine,
      clientIp: req.clientIp || req.ip
    }
  });

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

  // Record AI_QUERY event on Audit DAG
  ledgerService.createEvent({
    document_id: doc.id,
    case_id: doc.caseId,
    version_id: doc.version,
    action: 'AI_QUERY',
    user_id: req.user.id,
    user_role: req.user.role,
    data_hash: doc.payloadHash,
    metadata: { operation: 'SUMMARIZE', docTitle: doc.title }
  });

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
