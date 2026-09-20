import express from 'express';
import { knowledgeGraphService, buildInitialCaseGraph } from '../services/knowledgeGraphService.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// Store dynamic in-memory graphs per case for interactive edits
const caseGraphStore = new Map();

function getOrCreateCaseGraph(caseId) {
  if (!caseGraphStore.has(caseId)) {
    caseGraphStore.set(caseId, buildInitialCaseGraph(caseId));
  }
  return caseGraphStore.get(caseId);
}

// GET /api/knowledge-graph/cases/:caseId - Get full graph
router.get('/cases/:caseId', (req, res) => {
  try {
    const { caseId } = req.params;
    const kg = getOrCreateCaseGraph(caseId);
    return res.json({ success: true, graph: kg.toGraphObject() });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/knowledge-graph/nodes - Add new node dynamically
router.post('/nodes', (req, res) => {
  try {
    const { caseId = 'CASE-2026-8891', label, entityType, properties = {} } = req.body;
    if (!label || !entityType) {
      return res.status(400).json({ message: 'Missing node label or entityType' });
    }
    const kg = getOrCreateCaseGraph(caseId);
    const node = kg.addOrGetNode(label, entityType, properties);
    return res.json({ success: true, node: node.toDict(), graph: kg.toGraphObject() });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// PUT /api/knowledge-graph/nodes/:nodeId - Update node label / position
router.put('/nodes/:nodeId', (req, res) => {
  try {
    const { caseId = 'CASE-2026-8891', label, entityType, x, y, properties } = req.body;
    const { nodeId } = req.params;
    const kg = getOrCreateCaseGraph(caseId);
    const node = kg.nodes.get(nodeId);

    if (!node) {
      return res.status(404).json({ message: 'Node not found' });
    }

    if (label) node.label = label;
    if (entityType) node.entityType = entityType;
    if (x !== undefined) node.x = x;
    if (y !== undefined) node.y = y;
    if (properties) node.properties = { ...node.properties, ...properties };

    return res.json({ success: true, node: node.toDict(), graph: kg.toGraphObject() });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// DELETE /api/knowledge-graph/nodes/:nodeId - Delete node & connected edges
router.delete('/nodes/:nodeId', (req, res) => {
  try {
    const { caseId = 'CASE-2026-8891' } = req.query;
    const { nodeId } = req.params;
    const kg = getOrCreateCaseGraph(caseId);

    if (!kg.nodes.has(nodeId)) {
      return res.status(404).json({ message: 'Node not found' });
    }

    kg.nodes.delete(nodeId);
    kg.adjList.delete(nodeId);
    kg.edges = kg.edges.filter(e => e.sourceId !== nodeId && e.targetId !== nodeId);

    return res.json({ success: true, message: `Node ${nodeId} deleted`, graph: kg.toGraphObject() });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/knowledge-graph/edges - Add edge dynamically
router.post('/edges', (req, res) => {
  try {
    const {
      caseId = 'CASE-2026-8891',
      sourceLabel,
      sourceType = 'PERSON',
      targetLabel,
      targetType = 'LOCATION',
      relation = 'CONNECTED_TO',
      quote = 'Direct evidence association logged by officer.',
      sourceDocId = 'DOC-8891-001',
      trackingNo = 'LOGGED-ED-01',
      pageNumber = 1
    } = req.body;

    if (!sourceLabel || !targetLabel || !relation) {
      return res.status(400).json({ message: 'Missing edge source, target, or relationship type' });
    }

    const kg = getOrCreateCaseGraph(caseId);
    const edge = kg.addProvenanceEdge({
      sourceLabel,
      sourceType,
      targetLabel,
      targetType,
      relation,
      quote,
      sourceDocId,
      trackingNo,
      pageNumber,
      confidence: 0.95,
      eventDate: new Date().toISOString().split('T')[0]
    });

    return res.json({ success: true, edge: edge.toDict(), graph: kg.toGraphObject() });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/knowledge-graph/pathfinder - Multi-hop evidence search
router.post('/pathfinder', (req, res) => {
  try {
    const { caseId = 'CASE-2026-8891', startLabel, endLabel } = req.body;
    const kg = getOrCreateCaseGraph(caseId);
    const path = kg.findRelationshipPath(startLabel, endLabel);
    return res.json({ success: true, path: path || [] });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/knowledge-graph/contradictions/:caseId
router.get('/contradictions/:caseId', (req, res) => {
  try {
    const { caseId } = req.params;
    const kg = getOrCreateCaseGraph(caseId);
    return res.json({ success: true, contradictions: kg.detectContradictions() });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/knowledge-graph/timeline/:caseId
router.get('/timeline/:caseId', (req, res) => {
  try {
    const { caseId } = req.params;
    const kg = getOrCreateCaseGraph(caseId);
    return res.json({ success: true, timeline: kg.reconstructTimeline() });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
