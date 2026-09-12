import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck, Lock, Key, Clock, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function MFALoginModal({ isOpen, onClose }) {
  const { allUsers, loginAsUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState('USR-POL-101');
  const [step, setStep] = useState(1); // 1: Select User, 2: OTP Verification
  const [otpCode, setOtpCode] = useState('');
  const [rawOTP, setRawOTP] = useState(''); // Generated raw OTP for demo convenience
  const [countdown, setCountdown] = useState(120);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handleRequestOTP = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/request-otp', { userId: selectedUserId });
      setRawOTP(res.data.rawOTP);
      setOtpCode(res.data.rawOTP); // Auto-fill for quick testing
      setCountdown(120);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/verify-otp', { userId: selectedUserId, otp: otpCode });
      localStorage.setItem('sakshya_jwt_token', res.data.accessToken);
      if (res.data.refreshToken) {
        localStorage.setItem('sakshya_refresh_token', res.data.refreshToken);
      }
      alert('MFA OTP Verification Successful! Issued 15-minute Access JWT + 8-hour Refresh Token.');
      onClose();
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'OTP Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 border border-[#24324d] bg-[#111827] max-w-md">
        <div className="flex items-center justify-between pb-4 border-b border-[#24324d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">2-Factor MFA Authentication</h2>
              <p className="text-xs text-slate-400">Argon2id/PBKDF2 Password + 120s TTL OTP MFA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <div className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-2">Select User Account Persona:</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="input-field text-sm"
              >
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.roleTitle} (Clearance Level {u.clearanceLevel})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-[#0d1424] p-3 rounded border border-[#24324d] text-slate-300 space-y-1">
              <div>Security Layer: <span className="text-emerald-400 font-mono">Argon2id / PBKDF2 Password</span></div>
              <div>MFA TTL: <span className="text-amber-400 font-mono">120 Seconds OTP</span></div>
              <div>Lockout Policy: <span className="text-red-400 font-mono">3 Invalid Attempts = 15-Min Lockout</span></div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleRequestOTP}
                disabled={loading}
                className="btn btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                {loading ? 'Generating MFA OTP...' : 'Generate 6-Digit MFA OTP Code'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleVerifyOTP} className="mt-4 space-y-4 text-xs font-sans">
            {/* Countdown Banner */}
            <div className="bg-[#0d1424] p-3 rounded-lg border border-blue-500/30 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-blue-400">
                <Clock className="w-4 h-4" />
                <span>OTP Expires In:</span>
              </div>
              <span className={`font-bold ${countdown < 30 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                {countdown}s
              </span>
            </div>

            {/* Raw OTP Notification for Demo Testing */}
            <div className="p-3 rounded bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 font-mono text-center">
              <div>Simulated Secure SMS / Authenticator Code:</div>
              <div className="text-xl font-bold text-white tracking-widest my-1">{rawOTP}</div>
              <div className="text-[10px] text-slate-400">(Auto-hashed with SHA-256 before verification)</div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Enter 6-Digit MFA OTP Code:</label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="input-field text-center font-mono text-lg tracking-widest"
                required
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button type="button" onClick={() => setStep(1)} className="text-slate-400 hover:underline text-[11px]">
                ← Back
              </button>
              <button type="submit" disabled={loading || countdown === 0} className="btn btn-success text-xs py-2 px-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {loading ? 'Verifying OTP...' : 'Verify MFA & Login'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
