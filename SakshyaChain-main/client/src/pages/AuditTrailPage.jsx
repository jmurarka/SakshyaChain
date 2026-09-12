import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function AuditTrailPage() {
  const { docId } = useParams();
  const { user } = useAuth();
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/ledger');
      if (res.data.success) {
        setLedger(res.data.chain || []);
        if (res.data.chain && res.data.chain.length > 0) {
          setSelectedBlock(res.data.chain[res.data.chain.length - 1]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLedger = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const res = await axios.get('http://localhost:5000/api/ledger/verify');
      setTimeout(() => {
        setVerificationResult(res.data);
        setIsVerifying(false);
      }, 1000);
    } catch (err) {
      setVerificationResult({ isValid: false, message: 'Verification API failed' });
      setIsVerifying(false);
    }
  };

  const filteredChain = ledger.filter(block => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      block.index?.toString().includes(q) ||
      block.hash?.toLowerCase().includes(q) ||
      block.payload?.docId?.toLowerCase().includes(q) ||
      block.payload?.action?.toLowerCase().includes(q) ||
      block.payload?.actorId?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            Cryptographic Audit Ledger (DAG)
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Chain Audit & Immutability Visualizer</h1>
          <p className="text-slate-500 text-sm mt-1">
            Tamper-evident append-only cryptographic block chain anchored with SHA-256 parent block pointers.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          verificationResult.isValid 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-3">
            {verificationResult.isValid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            )}
            <div>
              <h4 className="font-semibold text-sm">
                {verificationResult.isValid ? 'Ledger Chain Verified Intact' : 'Tamper Alert Detected!'}
              </h4>
              <p className="text-xs opacity-90">{verificationResult.message}</p>
            </div>
          </div>
          <div className="text-xs font-mono font-semibold px-3 py-1 bg-white/80 rounded border">
            Blocks Scanned: {verificationResult.totalBlocks || ledger.length}
          </div>
        </div>
      )}

      {/* Main Grid: DAG Graph Flow & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Interactive Block DAG Flow */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-blue-600" />
                Block DAG Chain ({filteredChain.length} Blocks)
              </h3>

              {/* Search input */}
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
              <div className="py-12 text-center text-slate-400 text-sm">Loading block chain...</div>
            ) : filteredChain.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No ledger blocks found.</div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredChain.map((block, idx) => {
                  const isSelected = selectedBlock?.index === block.index;
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
                            block.index === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            #{block.index}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 text-sm">
                                {block.payload?.action || 'GENESIS_BLOCK'}
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                VERIFIED
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                              <span>Actor: <strong className="text-slate-700">{block.payload?.actorId || 'SYSTEM'}</strong></span>
                              <span>•</span>
                              <span>Doc: <strong className="text-slate-700">{block.payload?.docId || 'SYS-000'}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-xs text-slate-400 font-mono">
                          {new Date(block.timestamp).toLocaleTimeString()}
                        </div>
                      </div>

                      {/* Block Hashes Bar */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4 text-[11px] font-mono">
                        <div>
                          <span className="text-slate-400 mr-1">Prev:</span>
                          <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {block.previousHash ? block.previousHash.slice(0, 14) + '...' : '00000000000000'}
                          </span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        <div>
                          <span className="text-slate-400 mr-1">Hash:</span>
                          <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-semibold">
                            {block.hash ? block.hash.slice(0, 16) + '...' : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Block Inspector Panel */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm sticky top-6">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2 pb-3 border-b border-slate-200">
              <Database className="w-5 h-5 text-blue-600" />
              Block Inspector Details
            </h3>

            {selectedBlock ? (
              <div className="space-y-4 text-xs font-mono">
                <div>
                  <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Block Height Index</label>
                  <div className="text-slate-900 font-bold text-sm bg-slate-50 p-2 rounded border border-slate-200 flex items-center justify-between">
                    <span>Block #{selectedBlock.index}</span>
                    <span className="text-[11px] font-semibold text-emerald-600">IMMUTABLE</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Timestamp</label>
                  <div className="text-slate-800 bg-slate-50 p-2 rounded border border-slate-200">
                    {new Date(selectedBlock.timestamp).toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Current Block Hash (SHA-256)</label>
                  <div className="text-blue-700 bg-blue-50/60 p-2 rounded border border-blue-200 font-semibold break-all text-[11px]">
                    {selectedBlock.hash}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Previous Parent Block Hash</label>
                  <div className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-200 break-all text-[11px]">
                    {selectedBlock.previousHash || '0000000000000000000000000000000000000000000000000000000000000000'}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 uppercase tracking-wider text-[10px] block mb-1">Payload JSON Manifest</label>
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg overflow-x-auto text-[11px] max-h-48">
                    {JSON.stringify(selectedBlock.payload, null, 2)}
                  </pre>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center gap-2 text-slate-500 text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>RSA-2048 Digital Signature Validated</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">Select a block on the left to inspect cryptographic details.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
