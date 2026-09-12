import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { X, Scissors, ShieldAlert, Check } from 'lucide-react';

export default function RedactorModal({ doc, isOpen, onClose }) {
  const [piiList, setPiiList] = useState([]);
  const [redactedText, setRedactedText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (doc && isOpen) {
      setLoading(true);
      setRedactedText(doc.extractedText || '');
      api.post('/ai/detect-pii', { docId: doc.id })
        .then(res => {
          setPiiList(res.data.piiList || []);
        })
        .catch(() => setPiiList([]))
        .finally(() => setLoading(false));
    }
  }, [doc, isOpen]);

  if (!isOpen || !doc) return null;

  const handleApplyRedaction = (piiItem) => {
    if (!redactedText.includes(piiItem.text)) return;
    const newText = redactedText.replace(piiItem.text, piiItem.suggestion);
    setRedactedText(newText);
  };

  const handleRedactAll = () => {
    let current = redactedText;
    piiList.forEach(p => {
      current = current.replace(p.text, p.suggestion);
    });
    setRedactedText(current);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 border border-[#24324d] bg-[#111827]">
        <div className="flex items-center justify-between pb-4 border-b border-[#24324d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI PII & Sensitive Evidence Redactor</h2>
              <p className="text-xs text-slate-400">Blacks out PII (phones, national IDs, victim addresses) before court/public sharing.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Detected PII List */}
          <div className="space-y-3 border-r border-[#24324d] pr-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-xs">AI Detected PII Items ({piiList.length})</h3>
              <button onClick={handleRedactAll} className="text-[11px] text-rose-400 hover:underline">
                Redact All PII
              </button>
            </div>

            {loading ? (
              <div className="text-xs text-slate-400">Scanning document text for PII...</div>
            ) : piiList.map(item => {
              const isApplied = !redactedText.includes(item.text);
              return (
                <div key={item.id} className="bg-[#0d1424] p-3 rounded border border-[#24324d] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-warning text-[10px]">{item.type}</span>
                    {isApplied ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1"><Check className="w-3 h-3"/> Redacted</span>
                    ) : (
                      <button onClick={() => handleApplyRedaction(item)} className="btn btn-secondary py-0.5 px-2 text-[10px]">
                        Redact
                      </button>
                    )}
                  </div>
                  <div className="text-slate-300 font-mono text-[11px]">{item.text}</div>
                </div>
              );
            })}
          </div>

          {/* Live Redacted Text Box */}
          <div className="col-span-2 space-y-2">
            <h3 className="font-bold text-white text-xs">Sanitized Document Export Preview:</h3>
            <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#24324d] font-sans text-sm text-slate-200 whitespace-pre-line leading-relaxed max-h-[300px] overflow-y-auto">
              {redactedText}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => { alert('Sanitized document exported to court defense file.'); onClose(); }} className="btn btn-primary text-xs">
                Export Sanitized Court Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
