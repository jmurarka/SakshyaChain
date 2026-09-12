import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Clock, CheckCircle2, RefreshCw } from 'lucide-react';

export default function OTPPage({ navigateTo: propNavigateTo }) {
  const navigate = useNavigate();
  const { allUsers, loginAsUser } = useAuth();
  const [otpDigits, setOtpDigits] = useState(['0', '4', '2', '3', '1', '7']);
  const [countdown, setCountdown] = useState(120);
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await loginAsUser('USR-POL-101');
      if (propNavigateTo) return propNavigateTo('dashboard');
      navigate('/dashboard');
    } catch (err) {
      alert(`OTP verification error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="white-card p-8 max-w-md w-full shadow-lg border border-slate-200 space-y-6 text-center">
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-600/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-mono">Verify 2-Factor OTP Code</h2>
          <p className="text-xs text-slate-500">Enter 6-digit numeric security code sent to +91-XXXXXX1234</p>
        </div>

        {/* Countdown Banner */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between text-xs font-mono text-blue-900">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Code Expires In:</span>
          </div>
          <span className={`font-bold ${countdown < 30 ? 'text-red-600 animate-pulse' : 'text-emerald-700'}`}>
            {countdown}s
          </span>
        </div>

        {/* 6 Digit Input Boxes */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex items-center justify-center gap-2">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-13 text-center text-xl font-bold font-mono border-2 border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none bg-white text-slate-900 shadow-sm"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting || countdown === 0}
            className="btn btn-success w-full py-2.5 text-xs flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? 'Verifying OTP...' : 'Verify OTP & Log In'}
          </button>
        </form>

        <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-200">
          <button onClick={() => setCountdown(120)} className="hover:underline flex items-center gap-1 text-blue-600">
            <RefreshCw className="w-3 h-3" /> Resend OTP
          </button>
          <span className="font-mono text-[11px]">Demo: any 6 digits work</span>
        </div>
      </div>
    </div>
  );
}
