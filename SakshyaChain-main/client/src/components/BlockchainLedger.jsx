import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Lock, ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2, Zap, FileText } from 'lucide-react';

export default function BlockchainLedger() {
  const [blocks, setBlocks] = useState([]);
  const [auditReport, setAuditReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  const [tampering, setTampering] = useState(false);
  const [tamperMsg, setTamperMsg] = useState(null);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit/blocks');
      setBlocks(res.data.blocks || []);
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAudit = async () => {
    setAuditing(true);
    try {
      const res = await api.get('/audit/verify');
      setAuditReport(res.data.auditReport);
    } catch (err) {
      alert('Audit verification request failed');
    } finally {
      setAuditing(false);
    }
  };

  const handleSimulateTamper = async () => {
    setTampering(true);
    setTamperMsg(null);
    try {
      const res = await api.post('/audit/simulate-tamper', { docId: 'DOC-8891-001' });
      setTamperMsg(res.data.message);
      await fetchLedger();
    } catch (err) {
      alert('Tamper simulation failed');
    } finally {
      setTampering(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="glass-panel p-6 border border-[#24324d] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Cryptographic Append-Only Blockchain Ledger</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Every document creation, PKI signature, access, and transfer appends an immutable SHA-256 chained block.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSimulateTamper}
            disabled={tampering}
            className="btn btn-danger text-xs flex items-center gap-2"
            title="Inject 1-byte alteration into vault storage disk file"
          >
            <Zap className="w-4 h-4" />
            {tampering ? 'Injecting...' : 'Simulate Disk Storage Tampering'}
          </button>

          <button
            onClick={handleRunAudit}
            disabled={auditing}
            className="btn btn-success text-xs flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${auditing ? 'animate-spin' : ''}`} />
            {auditing ? 'Scanning Ledger & Disk Vault...' : 'Run Cryptographic Audit'}
          </button>
        </div>
      </div>

      {/* Tamper Alert Banner */}
      {tamperMsg && (
        <div className="glass-panel p-4 border border-amber-500/40 bg-amber-950/20 text-amber-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-semibold text-white">{tamperMsg}</span>
              <p className="text-slate-400">Click "Run Cryptographic Audit" to verify SākshyaChain catch the altered file digest!</p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Report Results Box */}
      {auditReport && (
        <div className={`glass-panel p-6 border ${
          auditReport.tamperDetected ? 'border-red-500/50 bg-red-950/20' : 'border-emerald-500/50 bg-emerald-950/20'
        }`}>
          <div className="flex items-center justify-between border-b border-[#24324d] pb-4 mb-4">
            <div className="flex items-center gap-3">
              {auditReport.tamperDetected ? (
                <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-white">
                  {auditReport.tamperDetected ? 'CRITICAL TAMPER DETECTED BY CRYPTO ENGINE' : 'CRYPTOGRAPHIC INTEGRITY VERIFIED (100%)'}
                </h3>
                <p className="text-xs text-slate-300 font-mono">
                  Timestamp: {auditReport.timestamp} • Blocks Evaluated: {auditReport.totalBlocksChecked}
                </p>
              </div>
            </div>

            <div className="text-right">
              {auditReport.tamperDetected ? (
                <span className="badge badge-danger">TAMPER ALERT</span>
              ) : (
                <span className="badge badge-success">ALL BLOCKS & VAULT FILES VALID</span>
              )}
            </div>
          </div>

          {/* Audit Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-[#0d1424] p-3 rounded-lg border border-[#24324d]">
              <div className="font-semibold text-slate-300">Blockchain Hash Chaining:</div>
              <div className={`font-mono font-bold mt-1 ${auditReport.chainIntact ? 'text-emerald-400' : 'text-red-400'}`}>
                {auditReport.chainIntact ? '✓ All Previous Hash Pointers Match Chained Blocks' : '✗ Blockchain Hash Chaining Error'}
              </div>
            </div>

            <div className="bg-[#0d1424] p-3 rounded-lg border border-[#24324d]">
              <div className="font-semibold text-slate-300">Physical Vault Storage Integrity:</div>
              <div className={`font-mono font-bold mt-1 ${auditReport.vaultFilesIntegrityOK ? 'text-emerald-400' : 'text-red-400'}`}>
                {auditReport.vaultFilesIntegrityOK ? '✓ All Disk Storage SHA-256 Digests Match Recorded Ledger Hashes' : '✗ Storage Vault Disk Byte Tamper Detected!'}
              </div>
            </div>
          </div>

          {/* File Tamper Details */}
          {auditReport.fileErrors && auditReport.fileErrors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-red-500/30">
              <h4 className="font-bold text-red-400 text-xs mb-2">Tampered Disk Files Identified:</h4>
              {auditReport.fileErrors.map((err, idx) => (
                <div key={idx} className="bg-red-900/30 p-3 rounded border border-red-500/40 text-xs font-mono space-y-1">
                  <div className="text-white font-bold">{err.docTitle} ({err.docId})</div>
                  <div className="text-red-300">Issue: {err.issue}</div>
                  <div className="text-slate-400">Expected Hash: {err.recordedHash}</div>
                  <div className="text-amber-400 font-bold">Actual Disk Hash: {err.actualDiskHash}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Block Chain List */}
      <div>
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-400" />
          Ledger Blocks Stream ({blocks.length})
        </h3>

        {loading ? (
          <div className="glass-panel p-8 text-center text-slate-400">Loading ledger blocks...</div>
        ) : (
          <div className="space-y-4">
            {blocks.slice().reverse().map(b => (
              <div key={b.blockHeight} className="glass-panel p-5 border border-[#24324d] font-mono text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded font-bold">Block #{b.blockHeight}</span>
                    <span className="badge badge-info">{b.action}</span>
                  </div>
                  <span className="text-slate-400">{b.timestamp}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300 pt-2 border-t border-[#24324d]/60">
                  <div>
                    <span className="text-slate-500">Actor: </span>
                    <span className="text-emerald-400 font-semibold">{b.actorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Case ID: </span>
                    <span className="text-blue-400">{b.caseId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Doc ID: </span>
                    <span className="text-amber-400">{b.docId}</span>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-[#24324d]/40">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-slate-500">Prev Block Hash:</span>
                    <span className="text-slate-400">{b.previousBlockHash}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 font-bold text-emerald-400">
                    <span className="text-slate-500">Current Block Hash:</span>
                    <span>{b.blockHash}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
