import React, { useState } from 'react';
import api from '../services/api';
import { X, Lock, Key, Copy, Check, Eye } from 'lucide-react';

export default function ShareModal({ doc, isOpen, onClose }) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [expiresAtHours, setExpiresAtHours] = useState('24');
  const [shareResult, setShareResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Test link viewer state
  const [inputOTP, setInputOTP] = useState('');
  const [testPayload, setTestPayload] = useState(null);
  const [testing, setTesting] = useState(false);

  if (!isOpen || !doc) return null;

  const handleCreateShareLink = async (e) => {
    e.preventDefault();
    if (!recipientEmail.trim()) return;

    setSubmitting(true);
    setShareResult(null);
    try {
      const res = await api.post('/sharing/create-link', {
        docId: doc.id,
        recipientEmail,
        expiresAtHours
      });
      setShareResult(res.data);
      setInputOTP(res.data.accessOTP);
    } catch (err) {
      alert(`Share link generation failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestLinkAccess = async () => {
    if (!shareResult || !inputOTP) return;
    setTesting(true);
    try {
      const res = await api.post('/sharing/access', {
        shareToken: shareResult.shareToken,
        otp: inputOTP
      });
      setTestPayload(res.data);
    } catch (err) {
      alert(`Access denied: ${err.response?.data?.message || err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 border border-[#24324d] bg-[#111827]">
        <div className="flex items-center justify-between pb-4 border-b border-[#24324d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Controlled OTP-Gated Sharing Link</h2>
              <p className="text-xs text-slate-400">Generates recipient-specific view-only link with 6-digit OTP & expiration.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs font-sans">
          <div className="bg-[#0d1424] p-3 rounded-lg border border-[#24324d] space-y-1">
            <div className="text-slate-400">Document: <span className="text-white font-bold">{doc.title}</span></div>
            <div className="text-slate-400">Policy Enforced: <span className="text-amber-400 font-mono">ViewOnly-NoDownload (HTTP Header Enforced)</span></div>
          </div>

          <form onSubmit={handleCreateShareLink} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Recipient Email:</label>
                <input
                  type="email"
                  placeholder="prosecutor.counsel@highcourt.gov.in"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="input-field text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Link Expiration:</label>
                <select value={expiresAtHours} onChange={(e) => setExpiresAtHours(e.target.value)} className="input-field text-sm">
                  <option value="1">1 Hour</option>
                  <option value="12">12 Hours</option>
                  <option value="24">24 Hours (1 Day)</option>
                  <option value="72">72 Hours (3 Days)</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary w-full text-xs py-2 flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              {submitting ? 'Generating Secure Share Link...' : 'Generate OTP-Gated Share Link'}
            </button>
          </form>

          {shareResult && (
            <div className="bg-[#0b0f19] p-4 rounded-xl border border-amber-500/40 font-mono space-y-3">
              <div className="text-amber-400 font-bold text-sm">✓ Controlled Share Link Created</div>
              <div>Share Token ID: <span className="text-blue-400">{shareResult.shareToken}</span></div>
              <div>Recipient Access OTP: <span className="text-emerald-400 font-bold text-base bg-slate-900 px-2 py-0.5 rounded">{shareResult.accessOTP}</span></div>
              <div>Expires At: <span className="text-slate-400">{shareResult.expiresAt}</span></div>

              {/* Live Test Dialog */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="text-slate-300 font-sans font-bold">Simulate Recipient OTP Access:</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 6-digit OTP code..."
                    value={inputOTP}
                    onChange={(e) => setInputOTP(e.target.value)}
                    className="input-field text-xs font-mono"
                  />
                  <button onClick={handleTestLinkAccess} disabled={testing} className="btn btn-success text-xs flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Verify OTP & Access
                  </button>
                </div>
              </div>

              {testPayload && (
                <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2 font-sans text-xs">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>{testPayload.message}</span>
                    <span className="badge badge-warning text-[10px]">Header: {testPayload.policy}</span>
                  </div>
                  <div className="bg-[#0b0f19] p-3 rounded text-slate-200 whitespace-pre-line max-h-[150px] overflow-y-auto">
                    {testPayload.content}
                  </div>
                  <div className="text-red-400 text-[10px] italic"> Downloads strictly disabled for controlled share links.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
