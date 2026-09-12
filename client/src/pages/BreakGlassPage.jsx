import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  User, 
  FileText,
  Key,
  Flame,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BreakGlassPage() {
  const { user } = useAuth();
  const [docId, setDocId] = useState('DOC-8891-002');
  const [reason, setReason] = useState('COURT_SUBPOENA_EXIGENT_CIRCUMSTANCE');
  const [submitting, setSubmitting] = useState(false);
  const [activeGrant, setActiveGrant] = useState(null);
  const [message, setMessage] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 mins in seconds

  useEffect(() => {
    let timer;
    if (activeGrant) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setActiveGrant(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeGrant]);

  const handleRequestGrant = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await api.post('/break-glass/request', {
        docId,
        justification: reason,
        userId: user?.id || 'officer_42'
      });

      if (res.data.success) {
        setActiveGrant(res.data.grant);
        setTimeLeft(1800);
        setMessage({ type: 'success', text: 'Break-Glass Emergency 30-Minute Access Granted! Audit block created.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Emergency Request Failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-600 to-amber-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
          <Flame className="w-64 h-64" />
        </div>

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Break-Glass Emergency Protocol
          </div>
          <h1 className="text-3xl font-extrabold">Emergency Access Override</h1>
          <p className="text-rose-100 text-sm max-w-xl">
            Bypass standard role-based clearance boundaries for urgent court hearings or life-critical investigations. All actions are logged immutably to the blockchain ledger.
          </p>
        </div>
      </div>

      {/* Active Grant Status */}
      {activeGrant && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center font-mono font-bold text-lg animate-pulse">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">Active Emergency Window</div>
              <h3 className="font-bold text-amber-950 text-base">Grant ID: {activeGrant.grantId || 'BG-9912'}</h3>
              <div className="text-xs text-amber-800 mt-0.5 font-mono">
                Document: <strong>{activeGrant.docId || docId}</strong> • Authorized User: <strong>{user?.name || 'Inspector Vikram'}</strong>
              </div>
            </div>
          </div>

          <div className="text-right font-mono">
            <div className="text-xs text-amber-700 font-semibold uppercase">Remaining Window</div>
            <div className="text-3xl font-black text-amber-900">{formatTimer(timeLeft)}</div>
          </div>
        </div>
      )}

      {/* Message Feedback */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {message.text}
        </div>
      )}

      {/* Break Glass Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 border-b border-slate-200 pb-3">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          Request Temporary Emergency Access Grant
        </h3>

        <form onSubmit={handleRequestGrant} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Target Document ID
            </label>
            <input
              type="text"
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              placeholder="e.g. DOC-8891-002"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Exigent Justification Reason
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Detail urgent judicial order or immediate forensic imperative..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-rose-600" /> Mandatory Audit Notice:
            </div>
            <p>
              1. This action instantly fires a High-Severity alert to the Department Supervisor & Chief Judiciary Compliance Officer.
            </p>
            <p>
              2. Grant automatically expires in 30 minutes. All decrypted document views are stamped with your officer badge ID watermark.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {submitting ? 'Authenticating Exigent Access...' : 'Confirm Break-Glass Emergency Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
