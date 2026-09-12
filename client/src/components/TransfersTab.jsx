import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ArrowLeftRight, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

export default function TransfersTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cases/transfers');
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Failed to fetch transfer requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await api.post('/cases/transfers/approve', { requestId });
      alert('Transfer request approved and anchored to Blockchain Ledger!');
      fetchTransfers();
    } catch (err) {
      alert(`Approval failed: ${err.response?.data?.message || err.message}`);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 border border-[#24324d] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Inter-Departmental Custody Transfer Queue</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracks evidence movement between Police, Forensic Labs, Prosecution, and Judiciary.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-8 text-center text-slate-400">Loading transfer queue...</div>
      ) : requests.length === 0 ? (
        <div className="glass-panel p-8 text-center text-slate-400">No active transfer requests.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map(r => (
            <div key={r.id} className="glass-panel p-5 border border-[#24324d] flex flex-wrap items-center justify-between gap-4 text-xs font-sans">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="badge badge-info font-mono">{r.id}</span>
                  <span className="font-bold text-white text-sm">{r.documentTitle}</span>
                  <span className="text-slate-400 font-mono">({r.documentId})</span>
                </div>

                <div className="text-slate-300 flex items-center gap-3">
                  <span>Requested By: <strong className="text-emerald-400">{r.requestedByName}</strong></span>
                  <span>•</span>
                  <span className="font-mono">Route: {r.fromDepartment} ➔ {r.toDepartment}</span>
                </div>

                <div className="text-slate-400 italic">Justification: "{r.reason}"</div>
              </div>

              <div className="flex items-center gap-3">
                {r.status === 'APPROVED' ? (
                  <span className="badge badge-success flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approved by {r.approvedBy}
                  </span>
                ) : (
                  <button
                    onClick={() => handleApprove(r.id)}
                    className="btn btn-success text-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Update Custody
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
