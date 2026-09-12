import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, ArrowLeftRight, CheckCircle2 } from 'lucide-react';

export default function TransferModal({ doc, isOpen, onClose, onTransferred }) {
  const { user } = useAuth();
  const [targetDept, setTargetDept] = useState('PROS');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !doc) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/cases/transfers/request', {
        docId: doc.id,
        targetDepartment: targetDept,
        reason
      });
      alert('Inter-departmental custody transfer request submitted and logged to Blockchain Ledger!');
      if (onTransferred) onTransferred();
      onClose();
    } catch (err) {
      alert(`Transfer request failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 border border-[#24324d] bg-[#111827]">
        <div className="flex items-center justify-between pb-4 border-b border-[#24324d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Request Inter-Departmental Custody Transfer</h2>
              <p className="text-xs text-slate-400">Transfers legal evidence chain-of-custody between agencies.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs font-sans">
          <div className="bg-[#0d1424] p-3 rounded-lg border border-[#24324d] space-y-1">
            <div className="text-slate-400">Document: <span className="text-white font-bold">{doc.title}</span></div>
            <div className="text-slate-400">Current Custodian: <span className="text-emerald-400 font-mono">{doc.department}</span> ({doc.authorName})</div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Recipient Department:</label>
            <select value={targetDept} onChange={(e) => setTargetDept(e.target.value)} className="input-field text-sm">
              <option value="PROS">Directorate of Prosecution (PROS)</option>
              <option value="JUD">High Court / Magistrate Court (JUD)</option>
              <option value="FOR">Central Forensic Science Lab (FOR)</option>
              <option value="LEO">Special Crime Branch Police (LEO)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Transfer Justification / Legal Request:</label>
            <textarea
              rows={3}
              placeholder="State legal reason for transfer (e.g. Charge sheet filing, trial exhibition submission)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field text-sm"
              required
            />
          </div>

          <div className="pt-4 border-t border-[#24324d] flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn btn-secondary text-xs">Cancel</button>
            <button type="submit" disabled={submitting} className="btn btn-primary text-xs flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              {submitting ? 'Logging Request...' : 'Submit Transfer Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
