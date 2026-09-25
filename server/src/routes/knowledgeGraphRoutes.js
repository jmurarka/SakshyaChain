import express from 'express';
import { knowledgeGraphService, buildInitialCaseGraph, InvestigationKnowledgeGraph } from '../services/knowledgeGraphService.js';
import { authenticateToken } from '../middleware/auth.js';
import { dbService } from '../services/dbService.js';
import { evaluateDocumentAccess } from '../services/documentAccessService.js';
import { ledgerService } from '../services/ledgerService.js';

const router = express.Router();

// Store dynamic in-memory graphs per case for interactive edits
const caseGraphStore = new Map();

function getOrCreateCaseGraph(caseId) {
  if (!caseGraphStore.has(caseId)) {
    caseGraphStore.set(caseId, buildInitialCaseGraph(caseId));
  }
  return caseGraphStore.get(caseId);
}

function scopedGraph(caseId, user) {
  const db = dbService.readDB();
  const targetCase = db.cases.find(c => c.id === caseId);
  if (!targetCase) return null;
  const source = getOrCreateCaseGraph(caseId);
  if (user.systemRole === 'IT_ADMIN') {
    const graph = new InvestigationKnowledgeGraph();
    graph.nodes = new Map(source.nodes);
    graph.edges = [...source.edges];
    graph.adjList = new Map([...graph.nodes.keys()].map(id => [id, []]));
    for (const edge of graph.edges) graph.adjList.get(edge.sourceId)?.push(edge);
    return graph;
  }
  if (user.clearanceLevel < targetCase.clearanceRequired || (user.systemRole !== 'IT_ADMIN' && !(user.assignedCases || []).includes(caseId))) return null;
  const edges = source.edges.filter(edge => {
    const doc = db.documents.find(d => d.id === edge.provenance.sourceDocId);
    return doc && evaluateDocumentAccess({ user, doc, db, permission: 'VIEW' }).allowed;
  });
  const connected = new Set(edges.flatMap(edge => [edge.sourceId, edge.targetId]));
  const graph = new InvestigationKnowledgeGraph();
  graph.nodes = new Map([...source.nodes].filter(([id]) => connected.has(id)));
  graph.edges = edges;
  graph.adjList = new Map([...graph.nodes.keys()].map(id => [id, []]));
  for (const edge of edges) graph.adjList.get(edge.sourceId)?.push(edge);
  return graph;
}

// GET /api/knowledge-graph/cases/:caseId - Get full graph
router.get('/cases/:caseId', authenticateToken, (req, res) => {
  try {
    const { caseId } = req.params;
    const kg = scopedGraph(caseId, req.user);
    if (!kg) return res.status(403).json({ error: 'CASE_ACCESS_DENIED' });
    return res.json({ success: true, graph: kg.toGraphObject() });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/knowledge-graph/nodes - Add new node dynamically
router.post('/nodes', authenticateToken, (req, res) => {
  try {
    const { caseId = 'CASE-2026-8891', label, entityType, properties = {} } = req.body;
    if (!label || !entityType) {
      return res.status(400).json({ message: 'Missing node label or entityType' });
    }
    const kg = scopedGraph(caseId, req.user);
    if (!kg) return res.status(403).json({ error: 'CASE_ACCESS_DENIED' });
    const target = getOrCreateCaseGraph(caseId);
    const node = target.addOrGetNode(label, entityType, properties);
    ledgerService.addBlock({ action: 'KNOWLEDGE_GRAPH_NODE_ADDED', actorId: req.user.id, actorName: req.user.name, caseId, docId: 'KNOWLEDGE_GRAPH', docHash: '', details: { nodeId: node.nodeId, label, entityType } });
    return res.json({ success: true, node: node.toDict(), graph: scopedGraph(caseId, req.user).toGraphObject() });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// PUT /api/knowledge-graph/nodes/:nodeId - Update node label / position
router.put('/nodes/:nodeId', authenticateToken, (req, res) => {
  try {
    const { caseId = 'CASE-2026-8891', label, entityType, x, y, properties } = req.body;
    const { nodeId } = req.params;
    const kg = scopedGraph(caseId, req.user);
    if (!kg) return res.status(403).json({ error: 'CASE_ACCESS_DENIED' });
    const node = kg.nodes.get(nodeId);

    if (!node) {
      return res.status(404).json({ message: 'Node not found' });
    }

    if (label) node.label = label;
    if (entityType) node.entityType = entityType;
    if (x !== undefined) node.x = x;
    if (y !== undefined) node.y = y;
    if (properties) node.properties = { ...node.properties, ...properties };
    ledgerService.addBlock({ action: 'KNOWLEDGE_GRAPH_NODE_UPDATED', actorId: req.user.id, actorName: req.user.name, caseId, docId: 'KNOWLEDGE_GRAPH', docHash: '', details: { nodeId, label, entityType } });

    return res.json({ success: true, node: node.toDict(), graph: kg.toGraphObject() });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// DELETE /api/knowledge-graph/nodes/:nodeId - Delete node & connected edges
router.delete('/nodes/:nodeId', authenticateToken, (req, res) => {
  try {
    const { caseId = 'CASE-2026-8891' } = req.query;
    const { nodeId } = req.params;
    const kg = scopedGraph(caseId, req.user);
    if (!kg) return res.status(403).json({ error: 'CASE_ACCESS_DENIED' });
    const target = getOrCreateCaseGraph(caseId);

    if (!kg.nodes.has(nodeId) || !target.nodes.has(nodeId)) {
      return res.status(404).json({ message: 'Node not found' });
    }

    target.nodes.delete(nodeId);
    target.adjList.delete(nodeId);
    target.edges = target.edges.filter(e => e.sourceId !== nodeId && e.targetId !== nodeId);
    ledgerService.addBlock({ action: 'KNOWLEDGE_GRAPH_NODE_REMOVED', actorId: req.user.id, actorName: req.user.name, caseId, docId: 'KNOWLEDGE_GRAPH', docHash: '', details: { nodeId } });

    return res.json({ success: true, message: `Node ${nodeId} deleted`, graph: scopedGraph(caseId, req.user).toGraphObject() });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/knowledge-graph/edges - Add edge dynamically
router.post('/edges', authenticateToken, (req, res) => {
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

    const db = dbService.readDB();
    const kg = scopedGraph(caseId, req.user);
    const sourceDoc = db.documents.find(d => d.id === sourceDocId);
    if (!kg || !sourceDoc || !evaluateDocumentAccess({ user: req.user, doc: sourceDoc, db, permission: 'VIEW' }).allowed) return res.status(403).json({ error: 'DOCUMENT_ACCESS_REQUIRED' });
    const target = getOrCreateCaseGraph(caseId);
    const edge = target.addProvenanceEdge({
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
    ledgerService.addBlock({ action: 'KNOWLEDGE_GRAPH_EDGE_ADDED', actorId: req.user.id, actorName: req.user.name, caseId, docId: sourceDoc.id, docHash: sourceDoc.payloadHash, details: { edgeId: edge.edgeId, relation } });

    return res.json({ success: true, edge: edge.toDict(), graph: scopedGraph(caseId, req.user).toGraphObject() });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/knowledge-graph/pathfinder - Multi-hop evidence search
router.post('/pathfinder', authenticateToken, (req, res) => {
  try {
    const { caseId = 'CASE-2026-8891', startLabel, endLabel } = req.body;
    const kg = scopedGraph(caseId, req.user);
    if (!kg) return res.status(403).json({ error: 'CASE_ACCESS_DENIED' });
    const path = kg.findRelationshipPath(startLabel, endLabel);
    return res.json({ success: true, path: path || [] });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/knowledge-graph/contradictions/:caseId
router.get('/contradictions/:caseId', authenticateToken, (req, res) => {
  try {
    const { caseId } = req.params;
    const kg = scopedGraph(caseId, req.user);
    if (!kg) return res.status(403).json({ error: 'CASE_ACCESS_DENIED' });
    return res.json({ success: true, contradictions: kg.detectContradictions() });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/knowledge-graph/timeline/:caseId
router.get('/timeline/:caseId', authenticateToken, (req, res) => {
  try {
    const { caseId } = req.params;
    const kg = scopedGraph(caseId, req.user);
    if (!kg) return res.status(403).json({ error: 'CASE_ACCESS_DENIED' });
    return res.json({ success: true, timeline: kg.reconstructTimeline() });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
