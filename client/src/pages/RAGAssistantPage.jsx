import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Search, 
  ShieldCheck, 
  Lock, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  EyeOff, 
  Tag, 
  AlertTriangle,
  Send,
  BookOpen,
  UserCheck,
  Globe,
  Wifi,
  Server,
  Activity
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function RAGAssistantPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('Who is the suspect identified in the CCTV and bullet forensic report?');
  const [caseId, setCaseId] = useState('CASE-2026-8891');
  const [loading, setLoading] = useState(false);
  const [ragResult, setRagResult] = useState(null);
  const [piiList, setPiiList] = useState([]);
  const [loadingPII, setLoadingPII] = useState(false);
  const [netStatus, setNetStatus] = useState(null);
  const [showDiagModal, setShowDiagModal] = useState(false);

  useEffect(() => {
    fetchNetworkStatus();
  }, []);

  const fetchNetworkStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/ai/network-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNetStatus(res.data);
    } catch (err) {
      console.error('Network status fetch error:', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setRagResult(null);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/ai/rag-search',
        { query, caseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.results) {
        setRagResult(res.data.results);
      }
    } catch (err) {
      console.error('RAG Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectPII = async () => {
    setLoadingPII(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/ai/detect-pii',
        { docId: 'DOC-8891-001' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.piiList) {
        setPiiList(res.data.piiList);
      }
    } catch (err) {
      console.error('PII Detection error:', err);
    } finally {
      setLoadingPII(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            Air-Gapped Centralized AI Engine (SIH 26190 Architecture)
          </div>
          <h1 className="text-2xl font-bold text-slate-900">AI Legal Assistant & Evidence Citations</h1>
          <p className="text-slate-500 text-sm mt-1">
            Zero-Trust local AI Gateway enforcing IP allowlisting, case permission scoping, and local Ollama / RAG inference.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowDiagModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-emerald-400 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono transition"
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Air-Gap Net Status:</span>
            <span className="font-bold text-white">
              {netStatus ? `${netStatus.clientIp} (Verified)` : 'Checking...'}
            </span>
          </button>

          <button
            onClick={handleDetectPII}
            disabled={loadingPII}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-semibold transition"
          >
            <EyeOff className="w-4 h-4 text-amber-600" />
            {loadingPII ? 'Scanning PII...' : 'Scan PII Redaction'}
          </button>
        </div>
      </div>

      {/* Query Search Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask legal assistant (e.g. ballistics match, suspect vehicle, wiretap summary)..."
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="w-48">
              <select
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-700 focus:outline-none"
              >
                <option value="CASE-2026-8891">CASE-2026-8891 (Homicide)</option>
                <option value="CASE-2026-4412">CASE-2026-4412 (Narcotics)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Synthesizing...' : 'Run RAG Search'}
            </button>
          </div>
        </form>

        <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono pt-1">
          <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-600" /> Pre-Retrieval Clearance Scoped</span>
          <span>•</span>
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-blue-600" /> Page & Para Evidence Tags</span>
        </div>
      </div>

      {/* PII Detection Alert Banner if scanned */}
      {piiList.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
          <div className="font-bold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            AI PII & Sensitive Info Redaction Scanner ({piiList.length} Items Flagged)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {piiList.map((pii) => (
              <div key={pii.id} className="bg-white p-2.5 rounded-lg border border-amber-200 flex justify-between items-center font-mono text-[11px]">
                <div>
                  <span className="text-amber-800 font-bold block">{pii.type}</span>
                  <span className="text-slate-600">{pii.text}</span>
                </div>
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                  {pii.suggestion}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RAG Results & Citations Container */}
      {ragResult && (
        <div className="space-y-6">
          {/* Answer Card */}
          <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Synthesized AI Evidence Brief</h3>
              </div>
              <div className="flex items-center gap-2">
                {ragResult.engine && (
                  <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
                    Engine: {ragResult.engine}
                  </span>
                )}
                <span className="text-[11px] font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-semibold border border-blue-200">
                  Evaluated Chunks: {ragResult.chunksEvaluated}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
              {ragResult.answer}
            </div>
          </div>

          {/* Citations List */}
          {ragResult.citations && ragResult.citations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                Verified Evidence Source Citations ({ragResult.citations.length})
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ragResult.citations.map((cite, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold bg-slate-900 text-emerald-400 px-2 py-0.5 rounded">
                          {cite.citationTag}
                        </span>
                        <h5 className="font-bold text-slate-900 text-xs mt-1.5">{cite.docTitle}</h5>
                      </div>
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        Clearance L{cite.clearanceLevel}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 italic">
                      "{cite.snippet}"
                    </p>

                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1">
                      <span>Doc: {cite.docId}</span>
                      <span>Case: {cite.caseId}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Air-Gap Diagnostic Modal */}
      {showDiagModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fade-in font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Air-Gapped AI System Diagnostics</h3>
              </div>
              <button onClick={() => setShowDiagModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            {netStatus ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-900 text-emerald-400 space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Network Gateway Status</div>
                  <div className="text-sm font-bold text-white">{netStatus.status}</div>
                  <div className="text-[11px] text-emerald-300">Your Client IP: {netStatus.clientIp} (ALLOWLIST VERIFIED)</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-slate-700">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-600" /> Ollama Local LLM Runtime:
                  </div>
                  <div>URL: {netStatus.ollama?.url}</div>
                  <div>Default Model: {netStatus.ollama?.model}</div>
                  <div>
                    Status:{' '}
                    <span className={netStatus.ollama?.status === 'ONLINE' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                      {netStatus.ollama?.status}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-slate-700">
                  <div className="font-bold text-slate-900">Allowed Network IPs / Subnets:</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {netStatus.allowedIps?.map((ip, i) => (
                      <span key={i} className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                        {ip}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-sans italic bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                  🔒 Zero-Trust Isolation: No traffic leaves your local Wi-Fi / Hotspot. Every query is signed and recorded on the SākshyaChain SHA-256 DAG ledger.
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">Loading diagnostic metrics...</div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button onClick={() => setShowDiagModal(false)} className="btn btn-secondary text-xs px-4 py-2">
                Close Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
