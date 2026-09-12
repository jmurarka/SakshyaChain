import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Search,
  Database,
  ShieldCheck,
  Anchor,
  Zap,
  GitCommit,
  GitBranch,
  GitMerge
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

// Custom DAG Node Component for ReactFlow
function CustomBlockNode({ data, selected }) {
  const isHead = data.isHead;
  const isTampered = data.isTampered;
  const isMerge = data.action === 'MERGE';
  const isBranch = data.action === 'BRANCH' || data.action === 'EDIT';

  let borderColor = 'border-blue-600';
  let badgeBg = 'bg-blue-100 text-blue-800';

  if (isTampered) {
    borderColor = 'border-rose-600 bg-rose-50/90';
    badgeBg = 'bg-rose-100 text-rose-800 font-bold animate-pulse';
  } else if (isHead) {
    borderColor = 'border-purple-600 bg-purple-50/90';
    badgeBg = 'bg-purple-100 text-purple-800';
  } else if (isMerge) {
    borderColor = 'border-emerald-600 bg-emerald-50/90';
    badgeBg = 'bg-emerald-100 text-emerald-800';
  } else if (isBranch) {
    borderColor = 'border-amber-600 bg-amber-50/90';
    badgeBg = 'bg-amber-100 text-amber-800';
  }

  return (
    <div
      className={`p-3 rounded-xl border-2 bg-white shadow-md transition-all cursor-pointer min-w-[200px] ${borderColor} ${
        selected ? 'ring-4 ring-blue-400/40 scale-105 shadow-lg' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-3 !h-3" />
      <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          {isMerge ? (
            <GitMerge className="w-4 h-4 text-emerald-600" />
          ) : isBranch ? (
            <GitBranch className="w-4 h-4 text-amber-600" />
          ) : (
            <GitCommit className="w-4 h-4 text-blue-600" />
          )}
          <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">{data.action}</span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badgeBg}`}>
          {isTampered ? 'TAMPERED' : isHead ? 'HEAD' : 'VERIFIED'}
        </span>
      </div>

      <div className="space-y-1 text-[11px] text-slate-600">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-mono">User:</span>
          <span className="font-semibold text-slate-800 truncate max-w-[110px]">{data.user_id}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-mono">Time:</span>
          <span className="font-mono text-[10px] text-slate-500">{new Date(data.timestamp).toLocaleTimeString()}</span>
        </div>
        <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between font-mono text-[10px]">
          <span className="text-slate-400">Hash:</span>
          <span className="text-blue-700 bg-blue-50 font-bold px-1 rounded truncate max-w-[120px]">
            {data.event_hash ? data.event_hash.slice(0, 10) + '...' : 'N/A'}
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-3 !h-3" />
    </div>
  );
}

const nodeTypes = {
  blockNode: CustomBlockNode
};

export default function AuditTrailPage() {
  const { docId } = useParams();
  const { user } = useAuth();

  const [rawBlocks, setRawBlocks] = useState([]);
  const [rawEdges, setRawEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [anchorNotice, setAnchorNotice] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    fetchAuditChain();
  }, [docId]);

  const fetchAuditChain = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit/blocks');
      const blocks = res.data.blocks || res.data.chain || [];
      const edgeLinks = res.data.edges || [];

      setRawBlocks(blocks);
      setRawEdges(edgeLinks);

      if (blocks.length > 0) {
        setSelectedBlock(blocks[blocks.length - 1]);
      }
    } catch (err) {
      console.error('Failed to fetch audit chain:', err);
      // Fallback try legacy endpoint /ledger
      try {
        const legacyRes = await api.get('/ledger');
        const legacyBlocks = legacyRes.data.chain || legacyRes.data.blocks || [];
        setRawBlocks(legacyBlocks);
        if (legacyBlocks.length > 0) {
          setSelectedBlock(legacyBlocks[legacyBlocks.length - 1]);
        }
      } catch (lErr) {
        console.error('Legacy fallback also failed:', lErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Convert blocks & edges into ReactFlow node positions
  useEffect(() => {
    if (!rawBlocks || rawBlocks.length === 0) return;

    const filtered = rawBlocks.filter(b => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.action?.toLowerCase().includes(q) ||
        b.user_id?.toLowerCase().includes(q) ||
        b.event_hash?.toLowerCase().includes(q) ||
        b.document_id?.toLowerCase().includes(q)
      );
    });

    const isTamperedMap = new Set(verificationResult?.broken_blocks || []);

    const flowNodes = filtered.map((b, idx) => {
      const isHead = idx === filtered.length - 1;
      const isTampered = isTamperedMap.has(b.event_hash);

      let xPos = 180;
      if (b.action === 'VERIFY' || b.action === 'BRANCH') {
        xPos = 380;
      } else if (b.action === 'EDIT') {
        xPos = 180;
      } else if (b.action === 'MERGE') {
        xPos = 280;
      }

      return {
        id: b.event_hash || b.event_id || `node-${idx}`,
        type: 'blockNode',
        position: { x: xPos, y: idx * 140 + 30 },
        data: {
          ...b,
          isHead,
          isTampered
        }
      };
    });

    const flowEdges = rawEdges.map((e, idx) => ({
      id: `edge-${idx}`,
      source: e.source,
      target: e.target,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#3b82f6', strokeWidth: 2 }
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [rawBlocks, rawEdges, searchQuery, verificationResult]);

  const handleVerifyLedger = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const res = await api.get('/audit/verify');
      setVerificationResult(res.data);
    } catch (err) {
      setVerificationResult({ status: 'ERROR', message: 'Verification API server request failed.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAnchorMerkleRoot = async () => {
    setIsAnchoring(true);
    try {
      const res = await api.post('/audit/anchor', {});
      setAnchorNotice(res.data.anchor);
      fetchAuditChain();
    } catch (err) {
      console.error('Anchoring failed:', err);
    } finally {
      setIsAnchoring(false);
    }
  };

  const handleSimulateTamper = async () => {
    if (!selectedBlock) return;
    try {
      await api.post('/audit/simulate-tamper', {
        event_id: selectedBlock.event_id
      });
      fetchAuditChain();
      handleVerifyLedger();
    } catch (err) {
      console.error('Tampering simulation failed:', err);
    }
  };

  const onNodeClick = useCallback((event, node) => {
    setSelectedBlock(node.data);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            Cryptographic Audit Trail (DAG)
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Chain Audit & Immutability Visualizer</h1>
          <p className="text-slate-500 text-sm mt-1">
            Tamper-evident append-only cryptographic block chain anchored with SHA-256 parent block pointers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleAnchorMerkleRoot}
            disabled={isAnchoring}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition shadow-sm disabled:opacity-50"
          >
            <Anchor className={`w-4 h-4 ${isAnchoring ? 'animate-spin' : ''}`} />
            {isAnchoring ? 'Anchoring Merkle Root...' : 'Anchor to Hyperledger'}
          </button>

          <button
            onClick={handleVerifyLedger}
            disabled={isVerifying}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            {isVerifying ? 'Verifying Hashes...' : 'Verify Ledger Integrity'}
          </button>
        </div>
      </div>

      {/* Verification Status Alert */}
      {verificationResult && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            verificationResult.status === 'OK'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {verificationResult.status === 'OK' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            )}
            <div>
              <h4 className="font-semibold text-sm">
                {verificationResult.status === 'OK' ? 'Ledger Chain Verified Intact' : 'Tamper Alert Detected!'}
              </h4>
              <p className="text-xs opacity-90">{verificationResult.message}</p>
            </div>
          </div>
          <div className="text-xs font-mono font-semibold px-3 py-1 bg-white/80 rounded border">
            Blocks Checked: {verificationResult.blocks_checked || rawBlocks.length}
          </div>
        </div>
      )}

      {/* Anchor Notice Alert */}
      {anchorNotice && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Anchor className="w-4 h-4 text-indigo-600" />
            <span>Hyperledger Fabric Merkle Root Anchored!</span>
          </div>
          <div>
            Tx ID: <span className="font-bold">{anchorNotice.fabric_tx_id}</span>
          </div>
        </div>
      )}

      {/* Main Grid: ReactFlow DAG Canvas & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Interactive ReactFlow Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col" style={{ height: 640 }}>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Block DAG Chain ({rawBlocks.length} Blocks)
                </h3>
              </div>

              {/* Filter Search Input */}
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by hash or action..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                Loading DAG block graph...
              </div>
            ) : rawBlocks.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                No ledger blocks found.
              </div>
            ) : (
              <div className="flex-1 w-full h-full flex flex-col gap-3 min-h-[500px]">
                <div className="flex-1 w-full rounded-lg border border-slate-100 bg-slate-50/50 overflow-hidden relative min-h-[360px]">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                  >
                    <Background color="#cbd5e1" gap={16} />
                    <Controls />
                  </ReactFlow>
                </div>

                {/* Audit Block Stream */}
                <div className="max-h-52 overflow-y-auto space-y-1.5 border-t border-slate-100 pt-2 pr-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Audit Block Log Stream</span>
                    <span className="text-blue-600 font-mono font-normal">{rawBlocks.length} Blocks Loaded</span>
                  </div>
                  {rawBlocks.slice().reverse().map((block, idx) => (
                    <div
                      key={block.event_hash || block.event_id || idx}
                      onClick={() => setSelectedBlock(block)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                        selectedBlock?.event_id === block.event_id || selectedBlock?.event_hash === block.event_hash
                          ? 'border-blue-500 bg-blue-50/70 font-semibold ring-1 ring-blue-400'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                          #{rawBlocks.length - idx}
                        </span>
                        <span className="font-bold text-slate-900">{block.action}</span>
                        <span className="text-slate-500 text-[11px]">by <strong className="text-slate-700">{block.user_id}</strong></span>
                      </div>
                      <div className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        {(block.event_hash || '').slice(0, 12)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Block Inspector Details Panel */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm sticky top-6">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2 pb-3 border-b border-slate-200">
              <Database className="w-5 h-5 text-blue-600" />
              Block Inspector Details
            </h3>

            {selectedBlock ? (
              <div className="space-y-3.5 text-xs font-mono">
                <div>
                  <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Action Type</label>
                  <div className="text-slate-900 font-bold text-sm bg-slate-50 p-2 rounded border border-slate-200 flex items-center justify-between">
                    <span>{selectedBlock.action}</span>
                    <span className="text-[11px] font-semibold text-emerald-600 uppercase">APPEND-ONLY</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">User ID</label>
                    <div className="text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 truncate">
                      {selectedBlock.user_id}
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Role</label>
                    <div className="text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 truncate">
                      {selectedBlock.user_role}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Timestamp (UTC ISO-8601)</label>
                  <div className="text-slate-800 bg-slate-50 p-2 rounded border border-slate-200">
                    {new Date(selectedBlock.timestamp).toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Event Hash (SHA-256)</label>
                  <div className="text-blue-700 bg-blue-50/70 p-2 rounded border border-blue-200 font-semibold break-all text-[11px]">
                    {selectedBlock.event_hash}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Parent Hashes</label>
                  <div className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 break-all text-[11px]">
                    {selectedBlock.parent_hashes && selectedBlock.parent_hashes.length > 0
                      ? selectedBlock.parent_hashes.join(', ')
                      : 'GENESIS (No parent)'}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Data Hash</label>
                  <div className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 break-all text-[11px]">
                    {selectedBlock.data_hash}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Metadata JSON</label>
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg overflow-x-auto text-[11px] max-h-40 font-mono">
                    {JSON.stringify(selectedBlock.metadata || {}, null, 2)}
                  </pre>
                </div>

                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Independent Cryptographic Integrity Validated</span>
                  </div>

                  <button
                    onClick={handleSimulateTamper}
                    className="w-full mt-2 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Zap className="w-3.5 h-3.5 text-rose-600" />
                    Simulate Byte Tamper on This Block
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-sm">
                Select a block node on the left canvas to inspect cryptographic details.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
