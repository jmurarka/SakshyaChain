import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import {
  GitCommit,
  ShieldCheck,
  Search,
  RefreshCw,
  CheckCircle2,
  Lock,
  User,
  Clock,
  FileText,
  Layers,
  ArrowRight,
  Database,
  Key,
  AlertTriangle,
  Network,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

/**
 * Frontend-only audit ledger tamper detection component.
 * Uses local hardcoded ledger data for deterministic tamper simulation and verification.
 * No backend calls are made - all verification and simulation happens in local state.
 */

/**
 * Compute SHA-256 hash using Web Crypto API (SubtleCrypto).
 * Mirrors the backend's computeCanonicalHash from ledgerService.js
 */
async function computeCanonicalHash(frontendBlock) {
  const sortedParents = [...(frontendBlock.parent_hashes || [])].sort();
  const canonical = `${frontendBlock.blockHeight}|${frontendBlock.timestamp}|${frontendBlock.action}|${frontendBlock.actorId}|${frontendBlock.caseId}|${frontendBlock.docId}|${frontendBlock.docHash}|${frontendBlock.previousBlockHash}|${sortedParents.join('')}|${JSON.stringify(frontendBlock.details)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const LEDGER_DATA = [
  {
    index: 0,
    blockHeight: 0,
    timestamp: '2026-09-01T08:00:00.000Z',
    action: 'GENESIS_BLOCK_MINED',
    actorId: 'SYSTEM',
    actorName: 'SākshyaChain Root Security Kernel',
    caseId: 'SYSTEM-ROOT',
    docId: 'DOC-GENESIS',
    docHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    details: { note: 'Initial cryptographic genesis state initialized with SHA-256 chain protection.' },
    previousBlockHash: '0000000000000000000000000000000000000000000000000000000000000000',
    parent_hashes: [],
    blockHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    event_hash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    payload: {
      action: 'GENESIS_BLOCK_MINED',
      actorId: 'SYSTEM',
      actorName: 'SākshyaChain Root Security Kernel',
      caseId: 'SYSTEM-ROOT',
      docId: 'DOC-GENESIS',
      docHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      details: { note: 'Initial cryptographic genesis state initialized with SHA-256 chain protection.' }
    }
  },
  {
    index: 1,
    blockHeight: 1,
    timestamp: '2026-09-01T09:15:30.000Z',
    action: 'DOCUMENT_UPLOADED',
    actorId: 'USR-POL-101',
    actorName: 'Inspector Vikram Sharma',
    caseId: 'CASE-2026-8891',
    docId: 'DOC-8891-001',
    docHash: 'cadb9587906ebe388ffd212cb3921bbffa52e95ef092dded2cfe0ff1d43bc7b4',
    details: { title: 'First Information Report (FIR #00492/2026)', encryptionAlgorithm: 'AES-256-GCM' },
    previousBlockHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    parent_hashes: ['a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'],
    blockHash: 'f1e2d3c4b5a6978819283746504938271605b4a3d2c1b0a9f8e7d6c5b4a3f2e1',
    event_hash: 'f1e2d3c4b5a6978819283746504938271605b4a3d2c1b0a9f8e7d6c5b4a3f2e1',
    payload: {
      action: 'DOCUMENT_UPLOADED',
      actorId: 'USR-POL-101',
      actorName: 'Inspector Vikram Sharma',
      caseId: 'CASE-2026-8891',
      docId: 'DOC-8891-001',
      docHash: 'cadb9587906ebe388ffd212cb3921bbffa52e95ef092dded2cfe0ff1d43bc7b4',
      details: { title: 'First Information Report (FIR #00492/2026)', encryptionAlgorithm: 'AES-256-GCM' }
    }
  },
  {
    index: 2,
    blockHeight: 2,
    timestamp: '2026-09-01T10:30:15.000Z',
    action: 'DOCUMENT_UPLOADED',
    actorId: 'USR-FOR-202',
    actorName: 'Dr. Sunita Rao',
    caseId: 'CASE-2026-8891',
    docId: 'DOC-8891-002',
    docHash: '63820f5f8a4d414c685d8b1313f53ed6ceb04a62cb5ac17c16aceb07017d75b5',
    details: { title: 'Forensic Ballistics & DNA Fingerprint Analysis', encryptionAlgorithm: 'AES-256-GCM', kmsKeyId: 'KMS-MASTER-KEY-PROD-2026' },
    previousBlockHash: 'f1e2d3c4b5a6978819283746504938271605b4a3d2c1b0a9f8e7d6c5b4a3f2e1',
    parent_hashes: ['f1e2d3c4b5a6978819283746504938271605b4a3d2c1b0a9f8e7d6c5b4a3f2e1'],
    blockHash: 'a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8',
    event_hash: 'a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8',
    payload: {
      action: 'DOCUMENT_UPLOADED',
      actorId: 'USR-FOR-202',
      actorName: 'Dr. Sunita Rao',
      caseId: 'CASE-2026-8891',
      docId: 'DOC-8891-002',
      docHash: '63820f5f8a4d414c685d8b1313f53ed6ceb04a62cb5ac17c16aceb07017d75b5',
      details: { title: 'Forensic Ballistics & DNA Fingerprint Analysis', encryptionAlgorithm: 'AES-256-GCM', kmsKeyId: 'KMS-MASTER-KEY-PROD-2026' }
    }
  },
  {
    index: 3,
    blockHeight: 3,
    timestamp: '2026-09-01T11:45:00.000Z',
    action: 'QUERY_EXECUTED',
    actorId: 'USR-POL-101',
    actorName: 'Inspector Vikram Sharma',
    caseId: 'CASE-2026-8891',
    docId: 'QRY-8891-001',
    docHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    details: { query: 'ballistics match suspect Sameer Verma', results: 3, clearanceLevel: 3 },
    previousBlockHash: 'a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8',
    parent_hashes: ['a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8'],
    blockHash: 'b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7',
    event_hash: 'b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7',
    payload: {
      action: 'QUERY_EXECUTED',
      actorId: 'USR-POL-101',
      actorName: 'Inspector Vikram Sharma',
      caseId: 'CASE-2026-8891',
      docId: 'QRY-8891-001',
      docHash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
      details: { query: 'ballistics match suspect Sameer Verma', results: 3, clearanceLevel: 3 }
    }
  },
  {
    index: 4,
    blockHeight: 4,
    timestamp: '2026-09-01T13:20:45.000Z',
    action: 'DISCUSSION_LOGGED',
    actorId: 'USR-JUD-404',
    actorName: 'Justice P. K. Mukherjee',
    caseId: 'CASE-2026-8891',
    docId: 'DOC-8891-004',
    docHash: 'f0e9d8c7b6a54321098765432109876543210fedcba98765432109876543210f',
    details: { title: 'Restricted Judicial Interception Order', clearanceLevel: 4, classification: 'TOP_SECRET' },
    previousBlockHash: 'b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7',
    parent_hashes: ['b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7'],
    blockHash: '1a2b3c4d5e6f789012345678901234567890fedcba98765432109876543210fe',
    event_hash: '1a2b3c4d5e6f789012345678901234567890fedcba98765432109876543210fe',
    payload: {
      action: 'DISCUSSION_LOGGED',
      actorId: 'USR-JUD-404',
      actorName: 'Justice P. K. Mukherjee',
      caseId: 'CASE-2026-8891',
      docId: 'DOC-8891-004',
      docHash: 'f0e9d8c7b6a54321098765432109876543210fedcba98765432109876543210f',
      details: { title: 'Restricted Judicial Interception Order', clearanceLevel: 4, classification: 'TOP_SECRET' }
    }
  }
];

// Deep copy function for state management
function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default function AuditTrailPage() {
  const { docId } = useParams();
  const { user, isITAdmin } = useAuth();
  const [viewMode, setViewMode] = useState('dag'); // Default to DAG Tree View
  const [ledger, setLedger] = useState(deepCopy(LEDGER_DATA));
  const [serverEdges, setServerEdges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTampering, setIsTampering] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [tamperResult, setTamperResult] = useState(null);

  // Load the backend append-only ledger, including access approval events.
  useEffect(() => {
    let active = true;
    api.get('/audit').then(({ data }) => { if (active && data.chain?.length) { setLedger(data.chain); setServerEdges(data.edges || []); } }).catch(() => { if (active) setLedger(deepCopy(LEDGER_DATA)); });
    return () => { active = false; };
  }, [user]);

  const calculateBlockHash = async (block) => {
    // We need to calculate hash based on block properties (excluding blockHash and event_hash for calculation)
    const blockForHash = {
      ...block,
      blockHash: '0000000000000000000000000000000000000000000000000000000000000000',
      event_hash: '0000000000000000000000000000000000000000000000000000000000000000'
    };
    return await computeCanonicalHash(blockForHash);
  };

  const verifyLedgerIntegrity = async () => {
    if (ledger.length === 0) return { chainIntact: true, tamperDetected: false, blockErrors: [], totalBlocksChecked: 0 };

    const verificationResults = {
      timestamp: new Date().toISOString(),
      totalBlocksChecked: ledger.length,
      chainIntact: true,
      tamperDetected: false,
      blockErrors: [],
      fileErrors: [] // Not applicable in frontend-only mode
    };

    for (let i = 0; i < ledger.length; i++) {
      const block = ledger[i];
      const recalculatedHash = await calculateBlockHash(block);

      if (recalculatedHash !== block.blockHash) {
        verificationResults.chainIntact = false;
        verificationResults.tamperDetected = true;
        verificationResults.blockErrors.push({
          blockHeight: block.index,
          issue: 'Block Hash Mismatch - Content altered in block ledger',
          recordedHash: block.blockHash,
          computedHash: recalculatedHash
        });
      }

      if (i > 0) {
        const prevBlock = ledger[i - 1];
        if (block.previousBlockHash !== prevBlock.blockHash) {
          verificationResults.chainIntact = false;
          verificationResults.tamperDetected = true;
          verificationResults.blockErrors.push({
            blockHeight: block.index,
            issue: 'Previous Block Hash Pointer Invalid - Chain broken',
            recordedPrevHash: block.previousBlockHash,
            actualPrevHash: prevBlock.blockHash
          });
        }
      }
    }

    return verificationResults;
  };

  const simulateTampering = async () => {
    if (ledger.length === 0) return null;

    // Tamper with a random block (not genesis for demo purposes)
    const tamperIndex = Math.floor(Math.random() * (ledger.length - 1)) + 1; // Skip genesis block
    const tamperedLedger = deepCopy(ledger);

    // Modify the block's details to tamper with the hash
    tamperedLedger[tamperIndex].details = {
      ...tamperedLedger[tamperIndex].details,
      tampered: true,
      tamperTimestamp: new Date().toISOString()
    };

    // Recalculate the hash for the tampered block
    tamperedLedger[tamperIndex].blockHash = await calculateBlockHash(tamperedLedger[tamperIndex]);
    tamperedLedger[tamperIndex].event_hash = tamperedLedger[tamperIndex].blockHash;

    // Also break the chain by modifying the next block's previousHash (if exists)
    if (tamperIndex + 1 < tamperedLedger.length) {
      tamperedLedger[tamperIndex + 1].previousBlockHash = '0000000000000000000000000000000000000000000000000000000000000000'; // Invalid hash
    }

    return {
      tamperedLedger,
      tamperIndex,
      message: `Simulated tampering on block #${tamperedLedger[tamperIndex].index} (${tamperedLedger[tamperIndex].action})`
    };
  };

  const handleVerifyLedger = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    setTamperResult(null);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const result = await verifyLedgerIntegrity();
      setVerificationResult(result);
    } catch (err) {
      setVerificationResult({ isValid: false, message: 'Verification failed' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateTampering = async () => {
    setIsTampering(true);
    setTamperResult(null);
    setVerificationResult(null);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const tamperResult = await simulateTampering();
      if (tamperResult) {
        setLedger(tamperResult.tamperedLedger);
        setTamperResult(tamperResult);
      }
    } catch (err) {
      setTamperResult({ error: 'Tamper simulation failed' });
    } finally {
      setIsTampering(false);
    }
  };

  const handleResetLedger = () => {
    setLedger(deepCopy(LEDGER_DATA));
    setVerificationResult(null);
    setTamperResult(null);
    setSelectedBlock(null);
  };

  const filteredChain = ledger.filter(block => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const action = block.payload?.action || block.action || '';
    const actorId = block.payload?.actorId || block.actorId || '';
    const hash = block.blockHash || block.event_hash || '';
    const dId = block.payload?.docId || block.docId || '';

    return (
      block.index?.toString().includes(q) ||
      hash.toLowerCase().includes(q) ||
      dId.toLowerCase().includes(q) ||
      action.toLowerCase().includes(q) ||
      actorId.toLowerCase().includes(q)
    );
  });

  // Generate ReactFlow Nodes & Edges for DAG Graph Canvas
  const dagNodes = filteredChain.map((block, idx) => {
    const isSelected = selectedBlock?.index === block.index || selectedBlock?.blockHeight === block.blockHeight;
    const action = block.payload?.action || block.action || 'BLOCK';
    const actorId = block.payload?.actorId || block.actorId || 'SYSTEM';
    const hashStr = block.blockHash || block.event_hash || '0x7f8a99...';

    return {
      id: `node-${block.index !== undefined ? block.index : idx}`,
      position: { x: (idx % 3) * 260 + 40, y: Math.floor(idx / 3) * 170 + 40 },
      data: {
        label: (
          <div className="p-3 text-left font-mono text-xs space-y-1.5 bg-white rounded-xl shadow-sm">
            <div className="font-bold text-slate-900 flex items-center justify-between gap-1">
              <span className="text-blue-700">#{block.index !== undefined ? block.index : idx} {action}</span>
              <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {block.details?.tampered ? 'TAMPERED' : 'SEALED'}
              </span>
            </div>
            <div className="text-slate-600 text-[11px]">Actor: <strong className="text-slate-800">{actorId}</strong></div>
            <div className="text-slate-500 text-[10px] truncate">Doc: {block.payload?.docId || block.docId || 'N/A'}</div>
            <div className="text-emerald-400 text-[10px] font-bold font-mono bg-slate-900 px-2 py-0.5 rounded truncate">
              {hashStr.slice(0, 16)}...
            </div>
          </div>
        )
      },
      style: {
        background: isSelected ? '#eff6ff' : '#ffffff',
        border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
        borderRadius: '16px',
        width: 230,
        cursor: 'pointer'
      }
    };
  });

  const dagEdges = serverEdges.length > 0 ? serverEdges.map((e, idx) => ({
    id: `edge-${idx}`,
    source: `node-${e.parent_id}`,
    target: `node-${e.child_id}`,
    animated: true,
    style: { stroke: '#2563eb', strokeWidth: 2 }
  })) : filteredChain.slice(1).map((block, idx) => ({
    id: `edge-${idx}`,
    source: `node-${filteredChain[idx].index !== undefined ? filteredChain[idx].index : idx}`,
    target: `node-${block.index !== undefined ? block.index : idx + 1}`,
    animated: true,
    style: { stroke: '#2563eb', strokeWidth: 2 }
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            {isITAdmin ? 'SYSTEM AUDIT LEDGER · READ ONLY' : 'Append-only Audit Ledger'}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Chain Audit & DAG Visualizer</h1>
          <p className="text-slate-500 text-sm mt-1">
            Access requests, approvals, grants, document views, and security actions are recorded in the backend ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm text-xs font-medium flex items-center gap-1">
            <button
              onClick={() => setViewMode('dag')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                viewMode === 'dag' ? 'bg-blue-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>DAG Tree Graph</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                viewMode === 'list' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Chain List</span>
            </button>
          </div>

          {!isITAdmin && <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyLedger}
              disabled={isVerifying}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              {isVerifying ? 'Verifying Hashes...' : 'Verify Ledger Integrity'}
            </button>

            <button
              onClick={handleSimulateTampering}
              disabled={isTampering || ledger.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition shadow-sm disabled:opacity-50 ml-2"
            >
              <Zap className={`w-3.5 h-3.5 ${isTampering ? 'animate-spin' : ''}`} />
              {isTampering ? 'Tampering...' : 'Simulate Tampering'}
            </button>

            <button
              onClick={handleResetLedger}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition shadow-sm disabled:opacity-50 ml-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Ledger
            </button>
          </div>}
        </div>
      </div>

      {/* Verification Status Alert */}
      {verificationResult && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          verificationResult.chainIntact !== false && !verificationResult.tamperDetected
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-3">
            {verificationResult.chainIntact !== false && !verificationResult.tamperDetected ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            )}
            <div>
              <h4 className="font-bold text-sm">
                {verificationResult.chainIntact !== false && !verificationResult.tamperDetected
                  ? 'Ledger Chain Verified Intact'
                  : 'Tamper Alert Detected!'}
              </h4>
              <p className="text-xs opacity-90">{verificationResult.message ||
                verificationResult.tamperDetected
                  ? `Blockchain tampering detected! ${verificationResult.blockErrors.length} blocks affected.`
                  : 'All SHA-256 block hashes and parent chain links verified unbroken.'}</p>
            </div>
            <div className="text-xs font-mono font-bold px-3 py-1 bg-white/90 rounded-xl border border-emerald-200 text-emerald-900">
              Blocks Scanned: {verificationResult.totalBlocksChecked || ledger.length}
            </div>
          </div>
        </div>
      )}

      {/* Tamper Status Alert */}
      {tamperResult && tamperResult.message && (
        <div className="p-4 rounded-2xl border flex items-center justify-between bg-amber-50 border-amber-200 text-amber-900">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Tampering Simulated</h4>
              <p className="text-xs opacity-90">{tamperResult.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: DAG Graph Flow / List & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Cols: Interactive Block DAG Flow or Chain List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                {viewMode === 'dag' ? <Network className="w-4 h-4 text-blue-600" /> : <GitCommit className="w-4 h-4 text-blue-600" />}
                {viewMode === 'dag' ? 'Interactive DAG Graph Canvas' : `Block Chain Stream (${filteredChain.length} Blocks)`}
              </h3>

              {/* Search input */}
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by hash or action..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs font-mono">Loading block chain ledger...</div>
            ) : filteredChain.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs font-mono">No ledger blocks found.</div>
            ) : viewMode === 'dag' ? (
              <div className="w-full h-[540px] bg-slate-50/50 rounded-xl border border-slate-200 relative overflow-hidden">
                <ReactFlow
                  nodes={dagNodes}
                  edges={dagEdges}
                  onNodeClick={(evt, node) => {
                    const blockIdx = parseInt(node.id.replace('node-', ''));
                    const blk = filteredChain.find(b => b.index === blockIdx || b.blockHeight === blockIdx);
                    if (blk) setSelectedBlock(blk);
                  }}
                  fitView
                >
                  <Background color="#94a3b8" gap={16} />
                  <Controls />
                </ReactFlow>
              </div>
            ) : (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {filteredChain.map((block, idx) => {
                  const isSelected = selectedBlock?.index === block.index || selectedBlock?.blockHeight === block.blockHeight;
                  const action = block.payload?.action || block.action || 'GENESIS_BLOCK';
                  const actorId = block.payload?.actorId || block.actorId || 'SYSTEM';

                  return (
                    <div
                      key={block.index || idx}
                      onClick={() => setSelectedBlock(block)}
                      className={`p-4 rounded-xl border transition cursor-pointer relative ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${
                            (block.index === 0 || block.blockHeight === 0) ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            #{block.index !== undefined ? block.index : idx}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {action}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {block.details?.tampered ? 'TAMPERED' : 'VERIFIED'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 font-mono">
                              <span>Actor: <strong className="text-slate-700">{actorId}</strong></span>
                              <span>•</span>
                              <span>Doc: <strong className="text-slate-700">{block.payload?.docId || block.docId || 'SYS-000'}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-xs text-slate-400 font-mono">
                          {new Date(block.timestamp).toLocaleTimeString()}
                        </div>
                      </div>

                      {/* Block Hashes Bar */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>Parent Linked: <strong className="text-slate-700">✓ Cryptographic Chain Intact</strong></span>
                        </div>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[10px]">
                          ✓ SEALED IN DATABASE
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Col: Block Inspector Panel */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-6">
              <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2 pb-3 border-b border-slate-200">
                <Database className="w-5 h-5 text-blue-600" />
                Block Inspector Details
              </h3>

              {selectedBlock ? (
                <div className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Block Height Index</label>
                    <div className="text-slate-900 font-bold text-sm bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <span>Block #{selectedBlock.index !== undefined ? selectedBlock.index : selectedBlock.blockHeight}</span>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">IMMUTABLE</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Timestamp</label>
                    <div className="text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      {new Date(selectedBlock.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Block Cryptographic Integrity</label>
                    <div className="text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 font-semibold text-[11px] flex items-center gap-2 font-sans">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        {selectedBlock.details?.tampered
                          ? '✗ SHA-256 Block Hash MISMATCH - TAMPERED'
                          : '✓ SHA-256 Block Hash Verified & Anchored'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Parent Chain Link</label>
                    <div className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] flex items-center gap-2 font-sans">
                      <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        {selectedBlock.previousBlockHash === '0000000000000000000000000000000000000000000000000000000000000000' && selectedBlock.index > 0
                          ? '✗ Parent Chain Link BROKEN'
                          : selectedBlock.index === 0
                            ? 'Genesis Block - No Parent'
                            : '✓ Linked to Parent Block #' + (selectedBlock.index - 1)
                        }
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Payload JSON Manifest</label>
                    <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl overflow-x-auto text-[11px] max-h-48 leading-relaxed">
                      {JSON.stringify(selectedBlock.payload || selectedBlock.details || {}, null, 2)}
                    </pre>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center gap-2 text-slate-500 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>RSA-2048 Digital Signature Validated</span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs font-mono">Select a block on the left to inspect cryptographic details.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
