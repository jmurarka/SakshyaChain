import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Cpu, Search, Sparkles, ShieldCheck, Lock, ExternalLink, AlertCircle, FileText, Tag } from 'lucide-react';
import { performHardcodedRAGSearch } from '../pages/RAGAssistantPage';

// Real API call function preserved with unchanged signature (not invoked for this demo build)
export const realRagSearchApi = async (payload) => {
  return await api.post('/ai/rag-search', payload);
};

export default function RAGAssistant({ onOpenViewer }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [ragResponse, setRagResponse] = useState(null);
  const [error, setError] = useState(null);

  // Automatically filter sample chunks on mount and when active user role/session changes
  useEffect(() => {
    if (user) {
      const results = performHardcodedRAGSearch(user, query || 'suspect evidence', 'CASE-2026-8891');
      setRagResponse(results);
    }
  }, [user]);

  const handleSearch = async (queryText = query) => {
    if (!queryText.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // NOTE: Real function signature preserved above (realRagSearchApi).
      // Requirement: Do not change the API call signature or remove the real function — just don't invoke it; use the hardcoded filter function in its place for this demo build.
      const results = performHardcodedRAGSearch(user, queryText, 'CASE-2026-8891');
      setRagResponse(results);
    } catch (err) {
      setError(err.response?.data?.message || 'RAG Search query failed');
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    'What ballistics & DNA evidence connects suspect Sameer Verma to the crime scene?',
    'Summarize witness statements regarding the fleeing black sedan.',
    'Show restricted judicial wiretap orders for Case 8891.'
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 border border-[#24324d] bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Permission-Aware Legal AI RAG Engine</h2>
            <p className="text-xs text-slate-400">
              Queries evidence text chunks scoped strictly by your active JWT clearance level (Level {user ? user.clearanceLevel : 1}) with explicit document citations.
            </p>
          </div>
        </div>

        {/* Query Input (Requirement: Keep the input field and existing layout) */}
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Ask an investigative or legal question (e.g. ballistics match, suspect timeline, wiretaps)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="input-field pl-10 py-3 text-sm bg-slate-950/80 border-[#334155]"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="btn btn-primary px-6 flex items-center gap-2"
          >
            {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Searching...' : 'Run RAG Search'}
          </button>
        </div>

        {/* Sample Query Pills */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Try Prompts:</span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => { setQuery(q); handleSearch(q); }}
              className="text-xs px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-700/40 text-indigo-300 hover:bg-indigo-900/60 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* RAG Results Display */}
      {error && (
        <div className="glass-panel p-4 border border-red-500/40 bg-red-950/20 text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {ragResponse && (
        <div className="space-y-6">
          {/* Clearance Metrics Banner */}
          <div className="glass-panel p-4 border border-indigo-500/30 bg-indigo-950/20 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-indigo-300 font-mono">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Role Scoped: {user?.role || 'INVESTIGATOR'} (Level {user ? user.clearanceLevel : 1})</span>
            </div>
            <div className="flex items-center gap-4 text-slate-300 font-mono">
              <span>Accessible: <strong className="text-white">{ragResponse.accessibleCount}</strong> / {ragResponse.chunksEvaluated}</span>
              <span>•</span>
              <span className="text-rose-400 font-semibold">Excluded: {ragResponse.securityFilteredCount}</span>
            </div>
          </div>

          {/* Synthesized Answer Box */}
          <div className="glass-panel p-6 border border-[#24324d] bg-[#111827]">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Synthesized Legal Evidence Brief
            </h3>
            <div className="text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans bg-[#0d1424] p-4 rounded-xl border border-[#24324d]">
              {ragResponse.answer}
            </div>
          </div>

          {/* Evaluated Chunks Section */}
          <div>
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Evaluated Case Evidence Chunks ({ragResponse.evaluatedChunks?.length || ragResponse.citations.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(ragResponse.evaluatedChunks || ragResponse.citations).map((chunk, idx) => {
                if (chunk.isExcluded) {
                  return (
                    <div key={idx} className="glass-panel p-4 border border-dashed border-slate-700 bg-slate-900/60 opacity-60 text-slate-400 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 uppercase">
                            TAG: {chunk.tag}
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-rose-950 text-rose-400 px-2 py-0.5 rounded border border-rose-800 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-rose-400" />
                            excluded — insufficient clearance
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-300 text-sm line-clamp-1">{chunk.docTitle}</h4>

                        <div className="my-3 p-3 rounded bg-slate-950/80 border border-slate-800/80 text-center font-mono text-xs text-slate-500 italic">
                          [no content shown]
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-mono text-slate-500">
                        <span>Doc: {chunk.docId}</span>
                        <span className="text-rose-400 font-bold">Clearance L{chunk.clearanceRequired} Required</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} className="glass-panel p-4 border border-[#24324d] flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="badge badge-info font-mono">{chunk.citationTag}</span>
                        <span className="text-xs font-mono text-emerald-400">Clearance L{chunk.clearanceRequired || chunk.clearanceLevel}</span>
                      </div>

                      <h4 className="font-bold text-white text-sm line-clamp-1">{chunk.docTitle}</h4>

                      <div className="mt-2 text-xs text-slate-400 flex items-center gap-3 font-mono">
                        <span>Doc: {chunk.docId}</span>
                        <span>•</span>
                        <span className="uppercase text-blue-400 font-semibold">TAG: {chunk.tag}</span>
                      </div>

                      <p className="mt-3 text-xs text-slate-300 italic bg-[#0d1424] p-3 rounded border border-[#24324d]/60">
                        "{chunk.content || chunk.snippet}"
                      </p>
                    </div>

                    {onOpenViewer && (
                      <div className="pt-2 border-t border-[#24324d] flex justify-end">
                        <button
                          onClick={() => onOpenViewer({ id: chunk.docId, title: chunk.docTitle, caseId: chunk.caseId, clearanceLevel: chunk.clearanceRequired })}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                        >
                          View Source Document <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
