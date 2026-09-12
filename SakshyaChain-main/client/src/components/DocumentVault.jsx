import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileText, ShieldCheck, Lock, Key, Download, Eye, FilePlus, Filter, Search, Sparkles, Scissors, ArrowLeftRight, CheckCircle2, AlertTriangle, Share2, GitCommit
} from 'lucide-react';

export default function DocumentVault({ onOpenUpload, onOpenViewer, onOpenSigner, onOpenSummary, onOpenRedactor, onOpenTransfer, onOpenShare }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedCase, setSelectedCase] = useState('ALL');

  const fetchVaultData = async () => {
    setLoading(true);
    try {
      const [docsRes, casesRes] = await Promise.all([
        api.get('/documents'),
        api.get('/cases')
      ]);
      setDocuments(docsRes.data.documents || []);
      setCases(casesRes.data.cases || []);
    } catch (err) {
      console.error('Failed to load vault data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaultData();
  }, [user]);

  const filteredDocs = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;
    const matchesCase = selectedCase === 'ALL' || doc.caseId === selectedCase;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.caseId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesCase && matchesSearch;
  });

  const getClearanceBadge = (level) => {
    switch (level) {
      case 4: return <span className="badge badge-clearance-4"><Lock className="w-3 h-3"/> Top Secret L4</span>;
      case 3: return <span className="badge badge-clearance-3"><ShieldCheck className="w-3 h-3"/> Secret L3</span>;
      case 2: return <span className="badge badge-clearance-2"><ShieldCheck className="w-3 h-3"/> Confidential L2</span>;
      default: return <span className="badge badge-clearance-1">Unclassified L1</span>;
    }
  };

  const handleDownload = async (docId, title, mimeType, originalFileName) => {
    try {
      const response = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const type = response.headers['content-type'] || mimeType || 'application/pdf';
      const blob = new Blob([response.data], { type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      let filename = originalFileName || (title ? `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf` : `${docId}.pdf`);
      if (!/\.(pdf|txt|docx|json)$/i.test(filename)) {
        filename += '.pdf';
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err.response?.data?.message || 'Download failed due to authorization restriction';
      alert(`Access Restricted: ${msg}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Vault Overview Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 border border-[#24324d] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono">{documents.length}</div>
            <div className="text-xs text-slate-400">Authorized Legal Documents</div>
          </div>
        </div>

        <div className="glass-panel p-4 border border-[#24324d] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-emerald-400 font-mono">AES-256-GCM</div>
            <div className="text-xs text-slate-400">Storage Vault Encrypted at Rest</div>
          </div>
        </div>

        <div className="glass-panel p-4 border border-[#24324d] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-amber-400 font-mono">Level {user ? user.clearanceLevel : 1} Active</div>
            <div className="text-xs text-slate-400">Server ABAC Clearance Enforced</div>
          </div>
        </div>

        <div className="glass-panel p-4 border border-[#24324d] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-indigo-400 font-mono">RSA-2048 PKI</div>
            <div className="text-xs text-slate-400">Canonical Manifest Signatures</div>
          </div>
        </div>
      </div>

      {/* Vault Controls & Filters */}
      <div className="glass-panel p-4 border border-[#24324d] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search document title, ID, case number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 py-2 text-sm"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field w-auto py-2 text-sm"
          >
            <option value="ALL">All Categories</option>
            <option value="FIR">First Information Reports (FIR)</option>
            <option value="FORENSIC_REPORT">Forensic & Ballistics Reports</option>
            <option value="WITNESS_STATEMENT">Witness Statements</option>
            <option value="COURT_FILING">Court Filings & Orders</option>
          </select>

          <select
            value={selectedCase}
            onChange={(e) => setSelectedCase(e.target.value)}
            className="input-field w-auto py-2 text-sm"
          >
            <option value="ALL">All Legal Cases</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>{c.id}: {c.title.slice(0, 30)}...</option>
            ))}
          </select>
        </div>

        <button
          onClick={onOpenUpload}
          className="btn btn-primary text-sm flex items-center gap-2"
        >
          <FilePlus className="w-4 h-4" />
          Upload & Encrypt Document
        </button>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-slate-400">
          Loading encrypted document vault...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400 space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-lg font-semibold text-white">No Documents Accessible</h3>
          <p className="text-sm max-w-md mx-auto">
            No legal files found matching your search filters or your active clearance level (Level {user ? user.clearanceLevel : 1}).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="glass-panel p-5 border border-[#24324d] glass-panel-hover flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  {getClearanceBadge(doc.clearanceLevel)}
                  <span className="badge badge-success font-mono text-[10px]">v{doc.version || '1.0'}</span>
                </div>

                <h3 className="font-bold text-white text-base leading-snug line-clamp-2 hover:text-blue-400 transition-colors cursor-pointer"
                    onClick={() => onOpenViewer(doc)}>
                  {doc.title}
                </h3>

                <div className="mt-3 text-xs space-y-1.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Case ID:</span>
                    <span className="font-mono text-blue-400">{doc.caseId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Document ID:</span>
                    <span className="font-mono text-slate-300">{doc.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Author / Dept:</span>
                    <span className="text-emerald-400">{doc.authorName} ({doc.department})</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#24324d]/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400">PKI Signature:</span>
                  {doc.signature ? (
                    <span className="badge badge-success flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> RSA Verified
                    </span>
                  ) : (
                    <span className="badge badge-warning flex items-center gap-1">
                      Unsigned
                    </span>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-[#24324d] grid grid-cols-3 gap-2">
                <button
                  onClick={() => onOpenViewer(doc)}
                  className="btn btn-secondary text-xs py-1.5 px-2 flex items-center justify-center gap-1"
                  title="View Preview, Version History & Custody"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>

                <button
                  onClick={() => handleDownload(doc.id, doc.title)}
                  className="btn btn-secondary text-xs py-1.5 px-2 flex items-center justify-center gap-1 bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/60"
                  title="Download Decrypted File Stream"
                >
                  <Download className="w-3.5 h-3.5" /> Save
                </button>

                <button
                  onClick={() => onOpenSigner(doc)}
                  className="btn btn-secondary text-xs py-1.5 px-2 flex items-center justify-center gap-1 bg-indigo-950/40 text-indigo-300 border-indigo-800/40 hover:bg-indigo-900/60"
                  title="Apply RSA PKI Signature"
                >
                  <Key className="w-3.5 h-3.5" /> Sign
                </button>

                <button
                  onClick={() => onOpenShare(doc)}
                  className="btn btn-secondary text-xs py-1.5 px-2 flex items-center justify-center gap-1 text-amber-300 border-amber-800/40 hover:bg-amber-900/40"
                  title="Create Controlled OTP Share Link"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>

                <button
                  onClick={() => onOpenRedactor(doc)}
                  className="btn btn-secondary text-xs py-1.5 px-2 flex items-center justify-center gap-1 text-rose-300 border-rose-800/40 hover:bg-rose-900/40"
                  title="Visual PII Redaction"
                >
                  <Scissors className="w-3.5 h-3.5" /> Redact
                </button>

                <button
                  onClick={() => onOpenTransfer(doc)}
                  className="btn btn-secondary text-xs py-1.5 px-2 flex items-center justify-center gap-1 text-purple-300 border-purple-800/40 hover:bg-purple-900/40"
                  title="Request Custody Transfer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" /> Transfer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
