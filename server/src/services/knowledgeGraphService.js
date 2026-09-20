import collections from 'collections';

export class EvidenceNode {
  constructor(nodeId, label, entityType, properties = {}) {
    this.nodeId = nodeId;
    this.label = label;
    this.entityType = entityType; // PERSON, ORG, PHONE, ACCOUNT, VEHICLE, LOCATION, EVIDENCE_WEAPON
    this.properties = properties;
    this.aliases = [label];
    this.x = properties.x || null;
    this.y = properties.y || null;
  }

  toDict() {
    return {
      nodeId: this.nodeId,
      label: this.label,
      entityType: this.entityType,
      aliases: this.aliases,
      properties: this.properties,
      x: this.x,
      y: this.y
    };
  }
}

export class EvidenceEdge {
  constructor({
    edgeId,
    sourceId,
    targetId,
    relationshipType,
    sourceDocId = 'DOC-8891-001',
    trackingNo = 'DOC-2026-8891',
    pageNumber = 1,
    quote = '',
    confidence = 1.0,
    eventDate = null
  }) {
    this.edgeId = edgeId;
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.relationshipType = relationshipType;
    this.provenance = {
      sourceDocId,
      trackingNo,
      pageNumber,
      quote,
      confidence,
      eventDate
    };
  }

  toDict() {
    return {
      edgeId: this.edgeId,
      sourceId: this.sourceId,
      targetId: this.targetId,
      relationshipType: this.relationshipType,
      provenance: this.provenance
    };
  }
}

export class InvestigationKnowledgeGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
    this.adjList = new Map();
  }

  addOrGetNode(label, entityType, properties = {}) {
    const nodeId = `${entityType.toLowerCase()}_${label.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    if (!this.nodes.has(nodeId)) {
      const node = new EvidenceNode(nodeId, label, entityType, properties);
      this.nodes.set(nodeId, node);
      if (!this.adjList.has(nodeId)) {
        this.adjList.set(nodeId, []);
      }
    }
    return this.nodes.get(nodeId);
  }

  addProvenanceEdge(data) {
    const {
      sourceLabel,
      sourceType,
      targetLabel,
      targetType,
      relation,
      sourceDocId,
      trackingNo,
      pageNumber,
      quote,
      confidence = 1.0,
      eventDate = null
    } = data;

    const srcNode = this.addOrGetNode(sourceLabel, sourceType);
    const tgtNode = this.addOrGetNode(targetLabel, targetType);

    const edgeId = `edge_${this.edges.length + 1}_${srcNode.nodeId}_${tgtNode.nodeId}`;
    const edge = new EvidenceEdge({
      edgeId,
      sourceId: srcNode.nodeId,
      targetId: tgtNode.nodeId,
      relationshipType: relation,
      sourceDocId,
      trackingNo,
      pageNumber,
      quote,
      confidence,
      eventDate
    });

    this.edges.push(edge);
    if (!this.adjList.has(srcNode.nodeId)) {
      this.adjList.set(srcNode.nodeId, []);
    }
    this.adjList.get(srcNode.nodeId).push(edge);
    return edge;
  }

  findRelationshipPath(startLabel, endLabel) {
    let startId = null;
    let endId = null;

    for (const [nid, node] of this.nodes.entries()) {
      if (node.label.toLowerCase() === startLabel.toLowerCase() || node.nodeId === startLabel) {
        startId = nid;
      }
      if (node.label.toLowerCase() === endLabel.toLowerCase() || node.nodeId === endLabel) {
        endId = nid;
      }
    }

    if (!startId || !endId) return null;

    const queue = [[startId, []]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
      const [currId, path] = queue.shift();
      if (currId === endId) {
        return path.map(e => e.toDict());
      }

      const neighbors = this.adjList.get(currId) || [];
      for (const edge of neighbors) {
        const nxtId = edge.targetId;
        if (!visited.has(nxtId)) {
          visited.add(nxtId);
          queue.push([nxtId, [...path, edge]]);
        }
      }
    }
    return null;
  }

  reconstructTimeline() {
    const timeline = [];
    for (const edge of this.edges) {
      const dateStr = edge.provenance.eventDate;
      if (dateStr) {
        const srcNode = this.nodes.get(edge.sourceId);
        const tgtNode = this.nodes.get(edge.targetId);
        timeline.append ? timeline.push({
          date: dateStr,
          eventDescription: `${srcNode ? srcNode.label : 'Unknown'} ${edge.relationshipType} ${tgtNode ? tgtNode.label : 'Unknown'}`,
          sourceId: edge.sourceId,
          targetId: edge.targetId,
          provenance: edge.provenance
        }) : null;
      }
    }
    return timeline.sort((a, b) => (a.date > b.date ? 1 : -1));
  }

  detectContradictions() {
    const contradictions = [];
    const dateEntityMap = new Map();

    for (const edge of this.edges) {
      const dateStr = edge.provenance.eventDate;
      if (dateStr) {
        const key = `${dateStr}_${edge.sourceId}`;
        if (!dateEntityMap.has(key)) {
          dateEntityMap.set(key, []);
        }
        dateEntityMap.get(key).push(edge);
      }
    }

    for (const [key, edges] of dateEntityMap.entries()) {
      if (edges.length > 1) {
        const locations = new Set(edges.map(e => e.targetId).filter(id => id.includes('loc') || id.includes('mumbai') || id.includes('delhi')));
        if (locations.size > 1) {
          const conflictingClaims = edges.map(e => ({
            claim: `${this.nodes.get(e.sourceId)?.label} was at ${this.nodes.get(e.targetId)?.label}`,
            trackingNo: e.provenance.trackingNo,
            pageNumber: e.provenance.pageNumber,
            quote: e.provenance.quote
          }));

          const firstEdge = edges[0];
          const entityLabel = this.nodes.get(firstEdge.sourceId)?.label || 'Entity';
          const [dateStr] = key.split('_');

          contradictions.push({
            anomalyType: 'LOCATION_DATE_CONTRADICTION',
            date: dateStr,
            entity: entityLabel,
            description: `Conflicting physical location records on ${dateStr} for entity '${entityLabel}'.`,
            conflictingEvidence: conflictingClaims
          });
        }
      }
    }

    return contradictions;
  }

  toGraphObject() {
    return {
      nodes: Array.from(this.nodes.values()).map(n => n.toDict()),
      edges: this.edges.map(e => e.toDict())
    };
  }
}

// Seed helper for Case Knowledge Graphs
export function buildInitialCaseGraph(caseId = 'CASE-2026-8891') {
  const kg = new InvestigationKnowledgeGraph();

  if (caseId === 'CASE-2026-8891') {
    // Nodes
    kg.addOrGetNode('Sameer Verma', 'PERSON', { title: 'Former Sysadmin / Prime Suspect', alias: 'SV-992' });
    kg.addOrGetNode('Inspector Vikram Sharma', 'PERSON', { title: 'Chief Investigating Officer' });
    kg.addOrGetNode('Justice P. K. Mukherjee', 'PERSON', { title: 'Special Sessions Magistrate' });
    kg.addOrGetNode('Rajesh Kumar', 'PERSON', { title: 'Whistleblower (Deceased)' });
    kg.addOrGetNode('Cyber Syndicate', 'ORGANIZATION', { title: 'Target Cybercrime Cell' });
    kg.addOrGetNode('Tech Vault Facility', 'LOCATION', { title: 'Cyber Park, Bldg B4' });
    kg.addOrGetNode('Glock-17 Pistol', 'EVIDENCE_WEAPON', { serial: 'GL-88392', caliber: '9mm' });
    kg.addOrGetNode('Cold Wallet Key ($4.2M)', 'ACCOUNT', { type: 'Crypto Wallet' });
    kg.addOrGetNode('+91 98210-44910', 'PHONE', { carrier: 'Encrypted SIP' });
    kg.addOrGetNode('Mumbai Central Station', 'LOCATION', { city: 'Mumbai' });

    // Edges with Evidence Provenance
    kg.addProvenanceEdge({
      sourceLabel: 'Sameer Verma',
      sourceType: 'PERSON',
      targetLabel: 'Tech Vault Facility',
      targetType: 'LOCATION',
      relation: 'INTRUDED_AT',
      sourceDocId: 'DOC-8891-001',
      trackingNo: 'FIR #00492/2026',
      pageNumber: 1,
      quote: 'Masked male suspect matching physical description of sysadmin Sameer Verma entered server room B4 at 02:15 AM.',
      confidence: 0.95,
      eventDate: '2026-08-14'
    });

    kg.addProvenanceEdge({
      sourceLabel: 'Sameer Verma',
      sourceType: 'PERSON',
      targetLabel: 'Glock-17 Pistol',
      targetType: 'EVIDENCE_WEAPON',
      relation: 'OPERATED_WEAPON',
      sourceDocId: 'DOC-8891-002',
      trackingNo: 'FSL-9921/2026',
      pageNumber: 2,
      quote: 'Partial DNA profile on safety catch matches suspect Sameer Verma with 99.98% probability.',
      confidence: 0.99,
      eventDate: '2026-08-14'
    });

    kg.addProvenanceEdge({
      sourceLabel: 'Glock-17 Pistol',
      sourceType: 'EVIDENCE_WEAPON',
      targetLabel: 'Rajesh Kumar',
      targetType: 'PERSON',
      relation: 'FATAL_INJURY_TO',
      sourceDocId: 'DOC-8891-002',
      trackingNo: 'FSL-9921/2026',
      pageNumber: 1,
      quote: '9mm bullet casing recovered from crime scene matches test-firing profile of seized Glock-17.',
      confidence: 0.99,
      eventDate: '2026-08-14'
    });

    kg.addProvenanceEdge({
      sourceLabel: 'Sameer Verma',
      sourceType: 'PERSON',
      targetLabel: 'Cold Wallet Key ($4.2M)',
      targetType: 'ACCOUNT',
      relation: 'SIPHONED_FUNDS_TO',
      sourceDocId: 'DOC-8891-002',
      trackingNo: 'FSL-9921/2026',
      pageNumber: 3,
      quote: 'Cold wallet containing $4.2M transferred 18 minutes after incident.',
      confidence: 0.94,
      eventDate: '2026-08-14'
    });

    kg.addProvenanceEdge({
      sourceLabel: 'Sameer Verma',
      sourceType: 'PERSON',
      targetLabel: 'Cyber Syndicate',
      targetType: 'ORGANIZATION',
      relation: 'AFFILIATED_WITH',
      sourceDocId: 'DOC-8891-001',
      trackingNo: 'FIR #00492/2026',
      pageNumber: 1,
      quote: 'Suspect linked to Cyber Syndicate financial fraud operation under IT Act 66D.',
      confidence: 0.88,
      eventDate: '2026-08-14'
    });

    kg.addProvenanceEdge({
      sourceLabel: 'Inspector Vikram Sharma',
      sourceType: 'PERSON',
      targetLabel: 'Tech Vault Facility',
      targetType: 'LOCATION',
      relation: 'INVESTIGATED_SCENE',
      sourceDocId: 'DOC-8891-001',
      trackingNo: 'FIR #00492/2026',
      pageNumber: 1,
      quote: 'First Information Report recorded at 02:45 AM by Inspector Vikram Sharma.',
      confidence: 1.0,
      eventDate: '2026-08-14'
    });

    kg.addProvenanceEdge({
      sourceLabel: 'Sameer Verma',
      sourceType: 'PERSON',
      targetLabel: 'Mumbai Central Station',
      targetType: 'LOCATION',
      relation: 'SPOTTED_AT',
      sourceDocId: 'DOC-8891-003',
      trackingNo: 'WITNESS-DEPOSITION-04',
      pageNumber: 1,
      quote: 'Eyewitness Ramesh Chand observed suspect entering black sedan at Mumbai Central at 02:22 AM.',
      confidence: 0.82,
      eventDate: '2026-08-14'
    });

    kg.addProvenanceEdge({
      sourceLabel: 'Justice P. K. Mukherjee',
      sourceType: 'PERSON',
      targetLabel: '+91 98210-44910',
      targetType: 'PHONE',
      relation: 'AUTHORIZED_WIRETAP',
      sourceDocId: 'DOC-8891-004',
      trackingNo: 'COURT-ORDER-8891',
      pageNumber: 1,
      quote: 'Judicial order authorizing confidential wiretap on secondary communications.',
      confidence: 1.0,
      eventDate: '2026-08-18'
    });
  }

  return kg;
}

export const knowledgeGraphService = {
  getGraph: (caseId) => {
    const kg = buildInitialCaseGraph(caseId);
    return kg.toGraphObject();
  },
  findPath: (caseId, startLabel, endLabel) => {
    const kg = buildInitialCaseGraph(caseId);
    return kg.findRelationshipPath(startLabel, endLabel);
  },
  getContradictions: (caseId) => {
    const kg = buildInitialCaseGraph(caseId);
    return kg.detectContradictions();
  },
  getTimeline: (caseId) => {
    const kg = buildInitialCaseGraph(caseId);
    return kg.reconstructTimeline();
  }
};
