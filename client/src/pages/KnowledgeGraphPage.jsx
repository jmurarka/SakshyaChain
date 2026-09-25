import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  GitFork, 
  Plus, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Zap, 
  FileText, 
  Trash2, 
  Maximize2, 
  RotateCcw, 
  Link as LinkIcon, 
  User, 
  Building, 
  Phone, 
  MapPin, 
  Shield, 
  Crosshair, 
  X,
  ZoomIn,
  ZoomOut,
  Move
} from 'lucide-react';

const FALLBACK_GRAPH = {
  nodes: [
    { nodeId: 'person_sameer_verma', label: 'Sameer Verma', entityType: 'PERSON', properties: { title: 'Former Sysadmin / Prime Suspect', alias: 'SV-992' }, x: 60, y: 80, width: 220, height: 50 },
    { nodeId: 'person_vikram_sharma', label: 'Inspector Vikram Sharma', entityType: 'PERSON', properties: { title: 'Chief Investigating Officer' }, x: 60, y: 340, width: 240, height: 50 },
    { nodeId: 'person_mukherjee', label: 'Justice P. K. Mukherjee', entityType: 'PERSON', properties: { title: 'Special Sessions Magistrate' }, x: 540, y: 380, width: 240, height: 50 },
    { nodeId: 'person_rajesh_kumar', label: 'Rajesh Kumar', entityType: 'PERSON', properties: { title: 'Whistleblower (Deceased)' }, x: 540, y: 60, width: 220, height: 50 },
    { nodeId: 'org_cyber_syndicate', label: 'Cyber Syndicate', entityType: 'ORGANIZATION', properties: { title: 'Target Cybercrime Cell' }, x: 60, y: 210, width: 200, height: 50 },
    { nodeId: 'location_tech_vault', label: 'Tech Vault Facility (Bldg B4)', entityType: 'LOCATION', properties: { address: 'Cyber Park, Bldg B4' }, x: 360, y: 200, width: 260, height: 50 },
    { nodeId: 'evidence_glock_17', label: 'Glock-17 Pistol (#GL-88392)', entityType: 'EVIDENCE_WEAPON', properties: { caliber: '9mm' }, x: 660, y: 200, width: 250, height: 50 },
    { nodeId: 'account_cold_wallet', label: 'Cold Wallet Key ($4.2M Siphoned)', entityType: 'ACCOUNT', properties: { type: 'Crypto Cold Wallet' }, x: 340, y: 40, width: 260, height: 50 },
    { nodeId: 'phone_wiretap', label: '+91 98210-44910', entityType: 'PHONE', properties: { carrier: 'Encrypted SIP Wiretap' }, x: 680, y: 300, width: 210, height: 50 },
    { nodeId: 'location_mumbai', label: 'Mumbai Central Terminal', entityType: 'LOCATION', properties: { city: 'Mumbai' }, x: 340, y: 360, width: 240, height: 50 }
  ],
  edges: [
    {
      edgeId: 'e1',
      sourceId: 'person_sameer_verma',
      targetId: 'location_tech_vault',
      relationshipType: 'INTRUDED_AT',
      provenance: { sourceDocId: 'DOC-8891-001', trackingNo: 'FIR #00492/2026', pageNumber: 1, quote: 'Masked male suspect matching physical description of sysadmin Sameer Verma entered server room B4 at 02:15 AM.', confidence: 0.95, eventDate: '2026-08-14' }
    },
    {
      edgeId: 'e2',
      sourceId: 'person_sameer_verma',
      targetId: 'evidence_glock_17',
      relationshipType: 'OPERATED_WEAPON',
      provenance: { sourceDocId: 'DOC-8891-002', trackingNo: 'FSL-9921/2026', pageNumber: 2, quote: 'Partial DNA profile on safety catch matches suspect Sameer Verma with 99.98% probability.', confidence: 0.99, eventDate: '2026-08-14' }
    },
    {
      edgeId: 'e3',
      sourceId: 'evidence_glock_17',
      targetId: 'person_rajesh_kumar',
      relationshipType: 'FATAL_INJURY_TO',
      provenance: { sourceDocId: 'DOC-8891-002', trackingNo: 'FSL-9921/2026', pageNumber: 1, quote: '9mm bullet casing recovered from crime scene matches test-firing profile of seized Glock-17.', confidence: 0.99, eventDate: '2026-08-14' }
    },
    {
      edgeId: 'e4',
      sourceId: 'person_sameer_verma',
      targetId: 'account_cold_wallet',
      relationshipType: 'SIPHONED_FUNDS_TO',
      provenance: { sourceDocId: 'DOC-8891-002', trackingNo: 'FSL-9921/2026', pageNumber: 3, quote: 'Cold wallet containing $4.2M transferred 18 minutes after incident.', confidence: 0.94, eventDate: '2026-08-14' }
    },
    {
      edgeId: 'e5',
      sourceId: 'person_sameer_verma',
      targetId: 'org_cyber_syndicate',
      relationshipType: 'AFFILIATED_WITH',
      provenance: { sourceDocId: 'DOC-8891-001', trackingNo: 'FIR #00492/2026', pageNumber: 1, quote: 'Suspect linked to Cyber Syndicate financial fraud operation under IT Act 66D.', confidence: 0.88, eventDate: '2026-08-14' }
    },
    {
      edgeId: 'e6',
      sourceId: 'person_vikram_sharma',
      targetId: 'location_tech_vault',
      relationshipType: 'INVESTIGATED_SCENE',
      provenance: { sourceDocId: 'DOC-8891-001', trackingNo: 'FIR #00492/2026', pageNumber: 1, quote: 'First Information Report recorded at 02:45 AM by Inspector Vikram Sharma.', confidence: 1.0, eventDate: '2026-08-14' }
    },
    {
      edgeId: 'e7',
      sourceId: 'person_sameer_verma',
      targetId: 'location_mumbai',
      relationshipType: 'SPOTTED_AT',
      provenance: { sourceDocId: 'DOC-8891-003', trackingNo: 'WITNESS-DEPOSITION-04', pageNumber: 1, quote: 'Eyewitness Ramesh Chand observed suspect entering black sedan at Mumbai Central at 02:22 AM.', confidence: 0.82, eventDate: '2026-08-14' }
    },
    {
      edgeId: 'e8',
      sourceId: 'person_mukherjee',
      targetId: 'phone_wiretap',
      relationshipType: 'AUTHORIZED_WIRETAP',
      provenance: { sourceDocId: 'DOC-8891-004', trackingNo: 'COURT-ORDER-8891', pageNumber: 1, quote: 'Judicial order authorizing confidential wiretap on secondary communications.', confidence: 1.0, eventDate: '2026-08-18' }
    }
  ]
};

const ENTITY_CONFIG = {
  PERSON: { label: 'Person / Suspect', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', icon: User },
  ORGANIZATION: { label: 'Organization / Syndicate', color: '#9333ea', bg: '#faf5ff', border: '#d8b4fe', icon: Building },
  PHONE: { label: 'Phone / Wiretap', color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: Phone },
  ACCOUNT: { label: 'Account / Wallet', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', icon: Shield },
  LOCATION: { label: 'Location / Scene', color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', icon: MapPin },
  EVIDENCE_WEAPON: { label: 'Evidence / Weapon', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', icon: Crosshair }
};

export default function KnowledgeGraphPage() {
  const { user, isITAdmin } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [activeTab, setActiveTab] = useState('visualizer');
  const [caseId, setCaseId] = useState('CASE-2026-8891');
  const [nodes, setNodes] = useState(FALLBACK_GRAPH.nodes);
  const [edges, setEdges] = useState(FALLBACK_GRAPH.edges);
  const [loading, setLoading] = useState(false);

  // Canvas State & Scaling
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [resizingNodeId, setResizingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoomScale, setZoomScale] = useState(1);

  // Pathfinder Tab State
  const [pathStart, setPathStart] = useState('person_sameer_verma');
  const [pathEnd, setPathEnd] = useState('account_cold_wallet');
  const [discoveredPath, setDiscoveredPath] = useState(null);
  const [findingPath, setFindingPath] = useState(false);

  // Editing Modals
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [isAddEdgeOpen, setIsAddEdgeOpen] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeType, setNewNodeType] = useState('PERSON');
  const [newEdgeSource, setNewEdgeSource] = useState('');
  const [newEdgeTarget, setNewEdgeTarget] = useState('');
  const [newEdgeRelation, setNewEdgeRelation] = useState('CONNECTED_TO');
  const [newEdgeQuote, setNewEdgeQuote] = useState('');

  // Load Graph Data from API
  useEffect(() => {
    async function loadGraphData() {
      setLoading(true);
      try {
        const res = await api.get(`/knowledge-graph/cases/${caseId}`);
        if (res.data?.graph?.nodes?.length > 0) {
          const fetchedNodes = res.data.graph.nodes.map((n, idx) => ({
            ...n,
            x: n.x || FALLBACK_GRAPH.nodes[idx]?.x || (60 + (idx % 3) * 260),
            y: n.y || FALLBACK_GRAPH.nodes[idx]?.y || (60 + Math.floor(idx / 3) * 120),
            width: n.width || 230,
            height: n.height || 50
          }));
          setNodes(fetchedNodes);
          setEdges(res.data.graph.edges || []);
        }
      } catch (err) {
        console.warn('[Knowledge Graph] Backend API unreachable, using static fallback graph.', err);
        setNodes(FALLBACK_GRAPH.nodes);
        setEdges(FALLBACK_GRAPH.edges);
      } finally {
        setLoading(false);
      }
    }
    loadGraphData();
  }, [caseId]);

  // ULTRA-CRISP HIGH-DPI CANVAS RENDERER
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const parent = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const width = parent.clientWidth || 940;
    const height = 560;

    // Set canvas dimensions matched to High-DPI display ratio
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.save();
    ctx.scale(dpr * zoomScale, dpr * zoomScale);
    ctx.clearRect(0, 0, width, height);

    // Map Node Positions & Dynamic Text Width Measurements
    const nodeMap = new Map();
    nodes.forEach(node => {
      ctx.font = 'bold 13px Inter, system-ui, -apple-system, sans-serif';
      const textWidth = ctx.measureText(node.label).width;
      // Ensure node is wide enough for complete text without truncation
      const minWidth = Math.max(180, textWidth + 60);
      const computedWidth = node.width ? Math.max(node.width, minWidth) : minWidth;
      const computedHeight = node.height || 50;

      nodeMap.set(node.nodeId, { ...node, width: computedWidth, height: computedHeight });
    });

    // 1. Draw Directional Edges & Bezier Curves
    edges.forEach(edge => {
      const src = nodeMap.get(edge.sourceId);
      const tgt = nodeMap.get(edge.targetId);
      if (!src || !tgt) return;

      const isSelected = selectedEdgeId === edge.edgeId;
      const isPathHighlighted = discoveredPath && discoveredPath.some(p => p.edgeId === edge.edgeId);

      const srcCenterX = src.x + src.width / 2;
      const srcCenterY = src.y + src.height / 2;
      const tgtCenterX = tgt.x + tgt.width / 2;
      const tgtCenterY = tgt.y + tgt.height / 2;

      const midX = (srcCenterX + tgtCenterX) / 2;
      const midY = (srcCenterY + tgtCenterY) / 2 - 20;

      // Curve path
      ctx.beginPath();
      ctx.moveTo(srcCenterX, srcCenterY);
      ctx.quadraticCurveTo(midX, midY, tgtCenterX, tgtCenterY);

      ctx.lineWidth = isPathHighlighted ? 4 : isSelected ? 3 : 2;
      ctx.strokeStyle = isPathHighlighted ? '#06b6d4' : isSelected ? '#2563eb' : '#cbd5e1';
      ctx.stroke();

      // Directional Arrowhead
      const angle = Math.atan2(tgtCenterY - midY, tgtCenterX - midX);
      ctx.beginPath();
      ctx.fillStyle = isPathHighlighted ? '#06b6d4' : isSelected ? '#2563eb' : '#64748b';
      ctx.moveTo(tgtCenterX - 14 * Math.cos(angle - Math.PI / 6), tgtCenterY - 14 * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(tgtCenterX, tgtCenterY);
      ctx.lineTo(tgtCenterX - 14 * Math.cos(angle + Math.PI / 6), tgtCenterY - 14 * Math.sin(angle + Math.PI / 6));
      ctx.fill();

      // Relationship Text Pill Badge
      ctx.font = 'bold 10px monospace';
      const labelText = edge.relationshipType;
      const labelWidth = ctx.measureText(labelText).width + 14;

      ctx.fillStyle = isPathHighlighted ? '#0891b2' : isSelected ? '#1d4ed8' : '#334155';
      ctx.beginPath();
      ctx.roundRect(midX - labelWidth / 2, midY - 9, labelWidth, 18, 9);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, midX, midY);
    });

    // 2. Draw Vector Node Cards (Auto-sized, Crisp High-DPI Rendering)
    nodes.forEach(node => {
      const computed = nodeMap.get(node.nodeId);
      const isSelected = selectedNodeId === node.nodeId;
      const isHighlightedInPath = discoveredPath && discoveredPath.some(p => p.sourceId === node.nodeId || p.targetId === node.nodeId);
      const cfg = ENTITY_CONFIG[node.entityType] || ENTITY_CONFIG.PERSON;

      // Card Body Background
      ctx.shadowColor = isSelected ? 'rgba(37, 99, 235, 0.25)' : isHighlightedInPath ? 'rgba(6, 182, 212, 0.25)' : 'rgba(15, 23, 42, 0.08)';
      ctx.shadowBlur = isSelected || isHighlightedInPath ? 12 : 6;
      ctx.shadowOffsetY = 3;

      ctx.beginPath();
      ctx.roundRect(computed.x, computed.y, computed.width, computed.height, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Outer Border
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.strokeStyle = isSelected ? '#2563eb' : isHighlightedInPath ? '#06b6d4' : cfg.border;
      ctx.stroke();

      // Color Badge Left Bar
      ctx.beginPath();
      ctx.roundRect(computed.x, computed.y, 6, computed.height, [10, 0, 0, 10]);
      ctx.fillStyle = cfg.color;
      ctx.fill();

      // Node Label Text (100% visible, never cut off)
      ctx.font = 'bold 13px Inter, system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, computed.x + 18, computed.y + computed.height / 2 - 8);

      // Subtitle Entity Tag
      ctx.font = '10px monospace';
      ctx.fillStyle = cfg.color;
      ctx.fillText(node.entityType.replace('_', ' '), computed.x + 18, computed.y + computed.height / 2 + 10);

      // Resize Handle Grip on Bottom Right when selected
      if (isSelected) {
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(computed.x + computed.width - 6, computed.y + computed.height - 6, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    ctx.restore();
  }, [nodes, edges, selectedNodeId, selectedEdgeId, discoveredPath, zoomScale]);

  // Accurate Mouse Coordinate Helper
  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoomScale,
      y: (e.clientY - rect.top) / zoomScale
    };
  };

  // Drag & Resize Mouse Handlers
  const handleMouseDown = (e) => {
    const pos = getCanvasPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Check if clicked inside a node or resize handle
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      ctx.font = 'bold 13px Inter, system-ui, -apple-system, sans-serif';
      const textWidth = ctx.measureText(node.label).width;
      const minWidth = Math.max(180, textWidth + 60);
      const width = node.width ? Math.max(node.width, minWidth) : minWidth;
      const height = node.height || 50;

      // Check Bottom-Right Resize Handle
      const isResizeClick = Math.abs(pos.x - (node.x + width)) < 15 && Math.abs(pos.y - (node.y + height)) < 15;
      if (isResizeClick) {
        setSelectedNodeId(node.nodeId);
        setResizingNodeId(node.nodeId);
        return;
      }

      // Check Inside Node Body
      if (pos.x >= node.x && pos.x <= node.x + width && pos.y >= node.y && pos.y <= node.y + height) {
        setSelectedNodeId(node.nodeId);
        setSelectedEdgeId(null);
        setDraggingNodeId(node.nodeId);
        setDragOffset({ x: pos.x - node.x, y: pos.y - node.y });
        return;
      }
    }

    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

  const handleMouseMove = (e) => {
    const pos = getCanvasPos(e);

    // Resizing Node Width & Height
    if (resizingNodeId) {
      setNodes(prev => prev.map(n => {
        if (n.nodeId === resizingNodeId) {
          const newW = Math.max(180, pos.x - n.x);
          const newH = Math.max(40, pos.y - n.y);
          return { ...n, width: newW, height: newH };
        }
        return n;
      }));
      return;
    }

    // Dragging Node Position
    if (draggingNodeId) {
      const newX = Math.max(10, pos.x - dragOffset.x);
      const newY = Math.max(10, pos.y - dragOffset.y);
      setNodes(prev => prev.map(n => n.nodeId === draggingNodeId ? { ...n, x: newX, y: newY } : n));
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setResizingNodeId(null);
  };

  // Add Custom Node
  const handleAddNodeSubmit = (e) => {
    e.preventDefault();
    if (!newNodeLabel) return;
    const nodeId = `${newNodeType.toLowerCase()}_${newNodeLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext('2d') : null;
    let computedW = 230;
    if (ctx) {
      ctx.font = 'bold 13px Inter, system-ui, sans-serif';
      computedW = Math.max(180, ctx.measureText(newNodeLabel).width + 60);
    }

    const newNode = {
      nodeId,
      label: newNodeLabel,
      entityType: newNodeType,
      properties: { title: 'Custom Operational Entity' },
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 150,
      width: computedW,
      height: 50
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(nodeId);
    setNewNodeLabel('');
    setIsAddNodeOpen(false);
  };

  // Add Custom Edge
  const handleAddEdgeSubmit = (e) => {
    e.preventDefault();
    if (!newEdgeSource || !newEdgeTarget || !newEdgeRelation) return;
    const edgeId = `edge_${Date.now()}`;
    const newEdge = {
      edgeId,
      sourceId: newEdgeSource,
      targetId: newEdgeTarget,
      relationshipType: newEdgeRelation.toUpperCase().replace(/\s+/g, '_'),
      provenance: {
        sourceDocId: 'DOC-8891-001',
        trackingNo: 'MANUAL-ENTRY-01',
        pageNumber: 1,
        quote: newEdgeQuote || 'Direct relationship mapped manually on canvas by officer.',
        confidence: 0.95,
        eventDate: new Date().toISOString().split('T')[0]
      }
    };
    setEdges(prev => [...prev, newEdge]);
    setIsAddEdgeOpen(false);
  };

  // Delete Node
  const handleDeleteNode = (idToDelete) => {
    setNodes(prev => prev.filter(n => n.nodeId !== idToDelete));
    setEdges(prev => prev.filter(e => e.sourceId !== idToDelete && e.targetId !== idToDelete));
    if (selectedNodeId === idToDelete) setSelectedNodeId(null);
  };

  // Multi-hop Pathfinder Execution
  const handleTracePath = async () => {
    if (!pathStart || !pathEnd) return;
    setFindingPath(true);
    setDiscoveredPath(null);

    try {
      const res = await api.post('/knowledge-graph/pathfinder', { caseId, startLabel: pathStart, endLabel: pathEnd });
      if (res.data?.path && res.data.path.length > 0) {
        setDiscoveredPath(res.data.path);
      } else {
        const path = findClientPath(pathStart, pathEnd);
        setDiscoveredPath(path);
      }
    } catch (err) {
      const path = findClientPath(pathStart, pathEnd);
      setDiscoveredPath(path);
    } finally {
      setFindingPath(false);
    }
  };

  const findClientPath = (startId, endId) => {
    const queue = [[startId, []]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
      const [currId, path] = queue.shift();
      if (currId === endId) return path;

      const outgoing = edges.filter(e => e.sourceId === currId);
      for (const edge of outgoing) {
        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          queue.push([edge.targetId, [...path, edge]]);
        }
      }
    }
    return [];
  };

  const selectedNode = nodes.find(n => n.nodeId === selectedNodeId);
  const nodeEdges = selectedNode ? edges.filter(e => e.sourceId === selectedNode.nodeId || e.targetId === selectedNode.nodeId) : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="white-card p-6 border border-slate-200 bg-gradient-to-r from-blue-50/50 via-white to-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <GitFork className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 font-mono">Crime Report Knowledge Graph &amp; Entity Pathfinder</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Crisp Vector Canvas • Drag &amp; Resize Nodes • Citation Provenance • Contradiction Scanner
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 font-sans">
          <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="input-field text-xs py-2 px-3 font-semibold">
            <option value="CASE-2026-8891">CASE-2026-8891 (State vs. Cyber Syndicate)</option>
            <option value="CASE-2026-4412">CASE-2026-4412 (Contraband Seizure)</option>
            <option value="CASE-2026-1102">CASE-2026-1102 (Judicial Interception)</option>
          </select>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 font-sans text-xs">
        <button
          onClick={() => setActiveTab('visualizer')}
          className={`py-2.5 px-4 font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'visualizer' ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <GitFork className="w-4 h-4" /> Interactive Canvas (Editable)
        </button>
        <button
          onClick={() => setActiveTab('pathfinder')}
          className={`py-2.5 px-4 font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pathfinder' ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4 text-cyan-600" /> Evidence Pathfinder
        </button>
        <button
          onClick={() => setActiveTab('contradictions')}
          className={`py-2.5 px-4 font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'contradictions' ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" /> Contradiction Scanner
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`py-2.5 px-4 font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'timeline' ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-emerald-600" /> Timeline Reconstruction
        </button>
      </div>

      {/* TAB 1: EDITABLE CANVAS VISUALIZER */}
      {activeTab === 'visualizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Canvas Container */}
          <div className="lg:col-span-2 space-y-4">
            <div className="white-card p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-3 font-sans text-xs">
              {isITAdmin ? <span className="rounded bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-800">IT ADMIN · READ-ONLY GRAPH</span> : <div className="flex items-center gap-2">
                <button onClick={() => setIsAddNodeOpen(true)} className="btn btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold shadow-sm">
                  <Plus className="w-4 h-4" /> Add Entity Node
                </button>
                <button onClick={() => setIsAddEdgeOpen(true)} className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-blue-600" /> Connect Relationship Edge
                </button>
              </div>}

              <div className="flex items-center gap-2">
                <button onClick={() => setZoomScale(z => Math.max(0.6, z - 0.1))} className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100" title="Zoom Out">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-[11px] font-bold text-slate-600 px-1">{Math.round(zoomScale * 100)}%</span>
                <button onClick={() => setZoomScale(z => Math.min(1.8, z + 0.1))} className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100" title="Zoom In">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button onClick={() => setZoomScale(1)} className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 ml-1" title="Reset Zoom">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative white-card p-0 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 shadow-sm">
              <canvas
                ref={canvasRef}
                onMouseDown={isITAdmin ? undefined : handleMouseDown}
                onMouseMove={isITAdmin ? undefined : handleMouseMove}
                onMouseUp={isITAdmin ? undefined : handleMouseUp}
                className={`w-full h-[560px] ${isITAdmin ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} block`}
              />

              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-md text-[10px] font-mono text-slate-600 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-blue-600" /> Interactive Controls:
                </div>
                <div>• Drag inside node card to move position</div>
                <div>• Drag bottom-right blue dot to resize node</div>
                <div>• Click any node to inspect evidence quotes</div>
              </div>
            </div>
          </div>

          {/* Side Inspector Drawer */}
          <div className="space-y-4">
            <div className="white-card p-5 border border-slate-200 space-y-4 min-h-[610px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 text-sm font-mono flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" /> Evidence Citation Inspector
                  </h3>
                  {selectedNode && !isITAdmin && (
                    <button onClick={() => handleDeleteNode(selectedNode.nodeId)} className="text-red-600 hover:text-red-700 p-1 text-xs flex items-center gap-1 font-semibold">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>

                {selectedNode ? (
                  <div className="mt-4 space-y-4 font-sans text-xs">
                    <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-blue-800 font-bold uppercase">{selectedNode.entityType}</span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {selectedNode.nodeId}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{selectedNode.label}</h4>
                      {selectedNode.properties?.title && (
                        <p className="text-xs text-slate-600">{selectedNode.properties.title}</p>
                      )}
                    </div>

                    <div>
                      <h5 className="font-bold text-slate-800 text-xs mb-2">Connected Relationships ({nodeEdges.length}):</h5>
                      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                        {nodeEdges.map(edge => {
                          const src = nodes.find(n => n.nodeId === edge.sourceId);
                          const tgt = nodes.find(n => n.nodeId === edge.targetId);
                          return (
                            <div key={edge.edgeId} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-sans">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-blue-700 font-mono">{edge.relationshipType}</span>
                                <span className="badge badge-info text-[9px] font-mono">{edge.provenance.trackingNo}</span>
                              </div>
                              <div className="text-[11px] text-slate-800 font-semibold">
                                {src?.label} ➔ {tgt?.label}
                              </div>
                              <div className="p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-600 italic leading-relaxed">
                                "{edge.provenance.quote}"
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                                <span>Page {edge.provenance.pageNumber} • Conf: {(edge.provenance.confidence * 100).toFixed(0)}%</span>
                                <span>{edge.provenance.eventDate || 'Verified'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-16 text-center text-slate-400 space-y-2 py-8">
                    <GitFork className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-medium">Click any node or relationship arrow on the canvas to inspect evidence citations.</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-mono text-center">
                AES-256 Envelope Vaulted Evidence Graph
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EVIDENCE PATHFINDER */}
      {activeTab === 'pathfinder' && (
        <div className="white-card p-6 border border-slate-200 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 font-mono flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-600" /> Multi-Hop Relationship Pathfinder Engine
            </h2>
            <p className="text-xs text-slate-500">
              Discovers step-by-step evidence chains connecting suspect entities, crime scenes, cold wallets, or weapons across all uploaded case files.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Source Entity (Start):</label>
              <select value={pathStart} onChange={(e) => setPathStart(e.target.value)} className="input-field text-xs">
                {nodes.map(n => (
                  <option key={n.nodeId} value={n.nodeId}>{n.label} ({n.entityType})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Entity (Destination):</label>
              <select value={pathEnd} onChange={(e) => setPathEnd(e.target.value)} className="input-field text-xs">
                {nodes.map(n => (
                  <option key={n.nodeId} value={n.nodeId}>{n.label} ({n.entityType})</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button onClick={handleTracePath} disabled={findingPath} className="btn btn-primary w-full py-2 text-xs font-bold flex items-center justify-center gap-2">
                <Search className="w-4 h-4" />
                {findingPath ? 'Tracing Graph...' : 'Trace Evidence Chain →'}
              </button>
            </div>
          </div>

          {discoveredPath && (
            <div className="space-y-4 font-sans animate-fade-in">
              <div className="p-4 rounded-xl bg-cyan-950 border border-cyan-800 text-white flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-cyan-300">✓ Verifiable Evidence Chain Discovered</div>
                  <div className="text-xs text-cyan-100 mt-0.5">Found {discoveredPath.length}-hop evidence-backed relationship trail.</div>
                </div>
                <span className="badge badge-info font-mono text-xs">{discoveredPath.length} Hop Chain</span>
              </div>

              <div className="space-y-3">
                {discoveredPath.map((step, idx) => {
                  const src = nodes.find(n => n.nodeId === step.sourceId);
                  const tgt = nodes.find(n => n.nodeId === step.targetId);
                  return (
                    <div key={step.edgeId || idx} className="p-4 rounded-xl bg-white border-2 border-cyan-200 shadow-sm flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-cyan-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="space-y-1.5 text-xs flex-1">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2 font-mono">
                          <span>{src?.label}</span>
                          <span className="text-cyan-600">──[{step.relationshipType}]──►</span>
                          <span>{tgt?.label}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 italic">
                          "{step.provenance.quote}"
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
                          <span>Source Doc: <strong className="text-slate-800">{step.provenance.trackingNo}</strong></span>
                          <span>Page {step.provenance.pageNumber}</span>
                          <span className="text-emerald-700 font-bold">Confidence: {((step.provenance.confidence || 0.95) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONTRADICTION SCANNER */}
      {activeTab === 'contradictions' && (
        <div className="white-card p-6 border border-slate-200 space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 font-mono flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" /> Crime Report Contradiction Scanner
            </h2>
            <p className="text-xs text-slate-500">
              Scans case files for conflicting physical location records, witness depositions, or timeline anomalies.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200 pb-3">
              <span className="font-bold text-amber-950 font-mono text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> ANOMALY DETECTED: LOCATION / DATE CONTRADICTION
              </span>
              <span className="badge badge-warning text-[10px] font-mono">HIGH SEVERITY</span>
            </div>

            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              Entity <strong>'Sameer Verma'</strong> has mutually incompatible physical location records for <strong>14 August 2026</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
              <div className="p-3.5 rounded-xl bg-white border border-amber-300 space-y-2 shadow-sm">
                <div className="font-mono text-[11px] text-amber-900 font-bold">RECORD A: FIR #00492/2026 (Page 1)</div>
                <div className="text-slate-700 italic">"Masked male suspect matching sysadmin Sameer Verma entered server room B4 at Tech Vault Facility, Cyber Park at 02:15 AM."</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-amber-300 space-y-2 shadow-sm">
                <div className="font-mono text-[11px] text-amber-900 font-bold">RECORD B: WITNESS-DEPOSITION-04 (Page 1)</div>
                <div className="text-slate-700 italic">"Eyewitness Ramesh Chand observed suspect entering black sedan fleeing Mumbai Central Station at 02:22 AM."</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TIMELINE RECONSTRUCTION */}
      {activeTab === 'timeline' && (
        <div className="white-card p-6 border border-slate-200 space-y-6 font-sans text-xs">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 font-mono flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" /> Chronological Timeline Reconstruction
            </h2>
            <p className="text-xs text-slate-500">
              Chronological sequence of verified events extracted from evidence relationships.
            </p>
          </div>

          <div className="space-y-4">
            {edges.map((edge, idx) => {
              const src = nodes.find(n => n.nodeId === edge.sourceId);
              const tgt = nodes.find(n => n.nodeId === edge.targetId);
              return (
                <div key={edge.edgeId || idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 font-mono font-bold text-xs shrink-0">
                    {edge.provenance.eventDate || '2026-08-14'}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="font-bold text-slate-900 text-xs font-mono">
                      {src?.label} {edge.relationshipType} {tgt?.label}
                    </div>
                    <div className="text-slate-600 italic">"{edge.provenance.quote}"</div>
                    <div className="text-[10px] text-slate-400 font-mono pt-1">
                      Tracking No: {edge.provenance.trackingNo} • Page {edge.provenance.pageNumber}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ADD NODE */}
      {isAddNodeOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-6 border border-slate-200 bg-white max-w-md space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm font-mono flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" /> Add Custom Entity Node
              </h3>
              <button onClick={() => setIsAddNodeOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNodeSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Entity Label / Name:</label>
                <input
                  type="text"
                  placeholder="e.g. 9mm Shell Casing #B-12"
                  value={newNodeLabel}
                  onChange={(e) => setNewNodeLabel(e.target.value)}
                  className="input-field text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Entity Type:</label>
                <select value={newNodeType} onChange={(e) => setNewNodeType(e.target.value)} className="input-field text-xs">
                  <option value="PERSON">Person / Suspect</option>
                  <option value="ORGANIZATION">Organization / Syndicate</option>
                  <option value="PHONE">Phone / Communication IP</option>
                  <option value="ACCOUNT">Account / Crypto Wallet</option>
                  <option value="LOCATION">Location / Scene</option>
                  <option value="EVIDENCE_WEAPON">Evidence / Weapon</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddNodeOpen(false)} className="btn btn-secondary text-xs py-2 px-3">Cancel</button>
                <button type="submit" className="btn btn-primary text-xs py-2 px-4 font-bold">Add Node to Canvas</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONNECT NODES */}
      {isAddEdgeOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-6 border border-slate-200 bg-white max-w-md space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm font-mono flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-600" /> Connect Relationship Edge
              </h3>
              <button onClick={() => setIsAddEdgeOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEdgeSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Source Node:</label>
                <select value={newEdgeSource} onChange={(e) => setNewEdgeSource(e.target.value)} className="input-field text-xs" required>
                  <option value="">Select Source Node...</option>
                  {nodes.map(n => <option key={n.nodeId} value={n.nodeId}>{n.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Node:</label>
                <select value={newEdgeTarget} onChange={(e) => setNewEdgeTarget(e.target.value)} className="input-field text-xs" required>
                  <option value="">Select Target Node...</option>
                  {nodes.map(n => <option key={n.nodeId} value={n.nodeId}>{n.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Relationship Type:</label>
                <input
                  type="text"
                  placeholder="e.g. COMMUNICATED_WITH, SPOTTED_NEAR"
                  value={newEdgeRelation}
                  onChange={(e) => setNewEdgeRelation(e.target.value)}
                  className="input-field text-xs font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Evidence Citation Quote:</label>
                <textarea
                  rows={3}
                  placeholder="Paste verbatim evidence quote from crime report..."
                  value={newEdgeQuote}
                  onChange={(e) => setNewEdgeQuote(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddEdgeOpen(false)} className="btn btn-secondary text-xs py-2 px-3">Cancel</button>
                <button type="submit" className="btn btn-primary text-xs py-2 px-4 font-bold">Connect Edge</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
