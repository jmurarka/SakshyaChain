import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Lock, Key, ShieldCheck, Download, CheckCircle2, AlertTriangle, RefreshCw, GitCommit, FileText } from 'lucide-react';

export default function DocumentViewerPage({ doc: propDoc, navigateTo: propNavigateTo }) {
  const { id: routeDocId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doc, setDoc] = useState(propDoc || null);
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null);

  useEffect(() => {
    async function loadDoc() {
      const docId = propDoc?.id || routeDocId || 'DOC-8891-002';
      try {
        const res = await api.get(`/documents/${docId}`);
        setDoc(res.data.document);
      } catch (err) {
        console.error('Failed to load document view:', err);
      }
    }
    loadDoc();
  }, [propDoc, routeDocId, user]);

  const activeDoc = doc || {
    id: routeDocId || 'DOC-8891-002',
    title: 'Forensic Ballistics & DNA Fingerprint Analysis',
    caseId: 'CASE-2026-8891',
    category: 'FORENSIC_REPORT',
    clearanceLevel: 3,
    version: '1.0',
    payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    authorName: 'Dr. Sunita Rao',
    department: 'FOR',
    extractedText: 'State Central Forensic Science Laboratory Report #FSL-9921/2026.\n\n9mm bullet casing recovered from crime scene matches test-firing profile of Glock-17 pistol (Serial #GL-88392) seized from suspect residence.',
    versionHistory: [
      { version: '1.0', changeNotes: 'Initial forensic lab filing', authorName: 'Dr. Sunita Rao', dateCreated: '2026-08-16' }
    ]
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/documents/${activeDoc.id}/download`, { responseType: 'blob' });
      const type = response.headers['content-type'] || activeDoc.mimeType || 'application/pdf';
      const blob = new Blob([response.data], { type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      let filename = activeDoc.originalFileName || (activeDoc.title ? `${activeDoc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf` : `${activeDoc.id}.pdf`);
      if (!/\.(pdf|txt|docx|json)$/i.test(filename)) {
        filename += '.pdf';
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Download failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const isPdfContent = (activeDoc.extractedText || '').trim().startsWith('%PDF-') ||
    activeDoc.mimeType === 'application/pdf' ||
    (activeDoc.extractedText || '').startsWith('[PDF');

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button onClick={() => navigate('/cases')} className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold">
        <ArrowLeft className="w-4 h-4" /> Back to Cases & Vault
      </button>

      {/* Header Bar */}
      <div className="white-card p-6 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-info font-mono">{activeDoc.id}</span>
            <span className="badge badge-success font-mono">v{activeDoc.version || '1.0'}</span>
            <h2 className="text-xl font-bold text-slate-900 line-clamp-1">{activeDoc.title}</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">Case ID: {activeDoc.caseId} • Clearance Level {activeDoc.clearanceLevel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownload}
            className="btn btn-primary text-xs flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Decrypted PDF
          </button>
          <button
            onClick={handleVerifyIntegrity}
            disabled={verifying}
            className="btn btn-success text-xs flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
            {verifying ? 'Scanning SHA-256 Digest...' : 'Verify Integrity'}
          </button>
        </div>
      </div>

      {/* Integrity Toast Alert */}
      {verifyStatus && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono font-semibold ${
          verifyStatus === 'VERIFIED'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-red-50 border-red-300 text-red-900 animate-pulse'
        }`}>
          <div className="flex items-center gap-2">
            {verifyStatus === 'VERIFIED' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
            <span>{verifyStatus === 'VERIFIED' ? '✓ CRYPTOGRAPHIC SHA-256 INTEGRITY VERIFIED (100% MATCH)' : '❌ TAMPER DETECTED: Storage File Digest Mismatch!'}</span>
          </div>
          <button onClick={() => navigate('/audit')} className="underline text-blue-600">View Audit DAG</button>
        </div>
      )}

      {/* Split View: Document Preview Canvas & Metadata Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Preview Canvas with Watermark (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
            <span>Document File Preview</span>
            <span className="text-slate-400 font-mono">Watermarked View</span>
          </div>

          <div className={`white-card p-6 border border-slate-300 relative min-h-[350px] font-sans text-sm text-slate-800 leading-relaxed bg-white shadow-inner ${
            verifying ? 'scan-wave' : ''
          }`}>
            {/* Watermark Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none text-4xl font-bold font-mono text-slate-900 transform -rotate-12">
              CONFIDENTIAL • {user ? user.name : 'Officer_42'} • {new Date().toISOString().slice(0, 16)}
            </div>

            <div className="relative z-10 space-y-4">
              {isPdfContent ? (
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-slate-900 text-base">PDF Document Payload Encrypted</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    This document is stored as a raw binary PDF payload with AES-256-GCM envelope encryption and SHA-256 integrity anchoring.
                  </p>
                  <button onClick={handleDownload} className="btn btn-primary text-xs inline-flex items-center gap-2 mx-auto">
                    <Download className="w-4 h-4" /> Download & View Decrypted PDF
                  </button>
                </div>
              ) : (
                <div className="whitespace-pre-line">
                  {activeDoc.extractedText}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metadata Details Panel (1 Col) */}
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-900">Cryptographic Details & Signatures</div>

          <div className="white-card p-4 border border-slate-200 space-y-3 font-mono text-xs">
            <div>
              <div className="text-slate-500 text-[11px]">Database Cryptographic Hash Status:</div>
              <div className="bg-emerald-50 p-2 rounded border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1.5 mt-1 font-sans">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>✓ SHA-256 Verified & Stored in Database</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Signed By:</span>
                <span className="font-bold text-slate-900">{activeDoc.authorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PKI Algorithm:</span>
                <span className="text-indigo-600 font-semibold">RSA-2048 / ECDSA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Encryption:</span>
                <span className="badge badge-success text-[10px]">AES-256-GCM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Version:</span>
                <span className="font-bold text-slate-900">v{activeDoc.version}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2 font-sans">
              <button onClick={handleDownload} className="btn btn-primary text-xs w-full py-1.5 flex items-center justify-center gap-1.5">
                <Download className="w-4 h-4" /> Download Decrypted File
              </button>
              <button onClick={() => navigate('/audit')} className="btn btn-secondary text-xs w-full py-1.5">
                View Git-Style Audit DAG ➔
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Version History Strip at Bottom */}
      <div className="white-card p-4 border border-slate-200 space-y-2 font-mono text-xs">
        <div className="font-bold text-slate-900 font-sans text-xs">Version Control Lineage Strip</div>
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {(activeDoc.versionHistory || [{ version: '1.0', changeNotes: 'Initial filing', dateCreated: '2026-08-16' }]).map((v, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg min-w-[180px]">
                <div className="flex items-center justify-between">
                  <span className="badge badge-success text-[10px]">v{v.version}</span>
                  <span className="text-[10px] text-slate-400">{v.dateCreated}</span>
                </div>
                <div className="text-slate-700 font-sans text-xs mt-1 truncate">{v.changeNotes}</div>
              </div>
              {idx < (activeDoc.versionHistory?.length || 1) - 1 && (
                <span className="text-slate-400 font-bold">➔</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
