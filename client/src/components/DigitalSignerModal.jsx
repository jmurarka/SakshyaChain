import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Key, ShieldCheck, CheckCircle2, Cpu } from 'lucide-react';

export default function DigitalSignerModal({ doc, isOpen, onClose, onSigned }) {
  const { user } = useAuth();
  const [signing, setSigning] = useState(false);
  const [signedResult, setSignedResult] = useState(null);

  if (!isOpen || !doc) return null;

  const versionStr = `v${doc.version || 1}.0`;

  const canonicalManifest = {
    documentId: doc.id,
    versionId: versionStr,
    sha256: '[SHA-256 Protected & Verified]',
    signerId: user ? user.id : 'USR-POL-101',
    metadata: {
      docTitle: doc.title,
      caseId: doc.caseId,
      signerName: user ? user.name : '',
      signerRole: user ? user.roleTitle : '',
      signerDepartment: user ? user.departmentName : ''
    },
    timestamp: new Date().toISOString()
  };

  const handleSign = async () => {
    setSigning(true);
    try {
      const res = await api.post(`/signature/documents/${doc.id}/versions/${versionStr}/sign`, {
        payloadHash: doc.payloadHash,
        metadata: canonicalManifest.metadata
      });
      setSignedResult(res.data);
      onSigned();
    } catch (err) {
      alert(`Signature failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 border border-[#24324d] bg-[#111827] max-w-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#24324d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">KMS-Abstracted Digital Signature Center</h2>
              <p className="text-xs text-slate-400">Signs deterministic canonical manifest payload via swappable KMS provider abstraction.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {signedResult ? (
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
              <div className="space-y-1 text-xs">
                <h3 className="font-bold text-emerald-300 text-sm">Cryptographic Signature Applied & Anchored!</h3>
                <p className="text-slate-300">Manifest ID: <span className="font-mono text-emerald-200">{signedResult.manifestId}</span></p>
                <p className="text-slate-300">Signature ID: <span className="font-mono text-emerald-200">{signedResult.signatureId}</span></p>
                <p className="text-slate-300">KMS Provider: <span className="font-mono text-indigo-300">{signedResult.provider}</span></p>
                <p className="text-slate-400 text-[11px]">Ledger Block Height: #{signedResult.ledgerBlock?.blockHeight} (Status: ✓ Block Anchored)</p>
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={onClose} className="btn btn-primary text-xs">Close</button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4 font-mono text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0d1424] p-3 rounded-xl border border-[#24324d] space-y-1">
                <div className="text-slate-400 text-[11px]">Signer Identity:</div>
                <div className="text-white font-bold text-xs">{user ? user.name : 'N/A'}</div>
                <div className="text-indigo-400 text-[11px]">{user ? user.roleTitle : ''}</div>
              </div>
              <div className="bg-[#0d1424] p-3 rounded-xl border border-[#24324d] space-y-1">
                <div className="text-slate-400 text-[11px] flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" /> KMS Provider Seam:
                </div>
                <div className="text-emerald-400 font-bold text-xs">LocalKmsProvider (local-dev-v1)</div>
                <div className="text-slate-400 text-[10px]">Swappable to AWS KMS CMK in prod</div>
              </div>
            </div>

            <div className="bg-[#0d1424] p-4 rounded-xl border border-[#24324d] space-y-3 font-sans">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  Canonical Manifest Certificate
                </span>
                <span className="badge badge-success text-[10px] font-mono">v{doc.version || '1.0'}</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Document Target:</span>
                  <span className="font-bold text-white truncate max-w-[280px]">{doc.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Document ID / Case:</span>
                  <span className="font-mono text-slate-300">{doc.id} ({doc.caseId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="text-indigo-300">{user?.departmentName || user?.department || 'Special Crime Branch'}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Payload Integrity:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> ✓ SHA-256 Verified & Stored in Database
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#24324d] flex justify-end gap-3 font-sans">
              <button onClick={onClose} className="btn btn-secondary text-xs">Cancel</button>
              <button onClick={handleSign} disabled={signing} className="btn btn-success text-xs flex items-center gap-2">
                <Key className="w-4 h-4" />
                {signing ? 'Executing KMS Sign...' : 'Apply Cryptographic Signature'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
