import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck, Lock } from 'lucide-react';

export default function UserSwitcherModal({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  if (!isOpen) return null;
  const returnToSignIn = () => { logout(); onClose(); navigate('/login'); };
  return <div className="modal-overlay"><div className="modal-content max-w-md space-y-4 border border-[#24324d] bg-[#111827] p-6 text-center text-white">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-600/20 text-blue-400"><ShieldCheck className="h-6 w-6" /></div>
    <h3 className="text-base font-bold">Sign in as another employee</h3>
    <p className="text-xs leading-relaxed text-slate-300">To change accounts, sign out and use the portal sign-in page. Every account must provide its credentials and verify a new OTP.</p>
    <div className="flex justify-center gap-2"><button onClick={onClose} className="btn btn-secondary text-xs"><X className="mr-1 inline h-3.5 w-3.5" />Close</button><button onClick={returnToSignIn} className="btn btn-primary text-xs"><Lock className="mr-1 inline h-3.5 w-3.5" />Sign out and continue</button></div>
  </div></div>;
}
