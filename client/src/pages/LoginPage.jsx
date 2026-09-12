import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, User, Key, ArrowRight } from 'lucide-react';

export default function LoginPage({ navigateTo: propNavigateTo }) {
  const navigate = useNavigate();
  const { allUsers, loginAsUser } = useAuth();
  const [username, setUsername] = useState('sharma_leo');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (propNavigateTo) return propNavigateTo('otp');
    navigate('/otp');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="white-card p-8 max-w-md w-full shadow-lg border border-slate-200 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-600/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-mono">SākshyaChain Secure DMS</h2>
          <p className="text-xs text-slate-500">Legal & Investigation Document Security System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Username / Offender ID:</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field pl-9 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Password:</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-9 text-sm"
                required
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
              <span>Remember device</span>
            </label>
            <a href="#forgot" className="text-blue-600 hover:underline">Forgot password?</a>
          </div>

          <button type="submit" className="btn btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2">
            <span>Proceed to 2-Factor OTP Verification</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-[11px] text-center font-mono">
          Demo Mode: Any official credentials proceed to OTP verification.
        </div>
      </div>
    </div>
  );
}
