import React from 'react';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck, CheckCircle, Lock, UserCheck, Key } from 'lucide-react';

export default function UserSwitcherModal({ isOpen, onClose }) {
  const { allUsers, user, loginAsUser, loading } = useAuth();

  if (!isOpen) return null;

  const handleSelectUser = async (userId) => {
    try {
      await loginAsUser(userId);
      onClose();
    } catch (err) {
      alert(`Login failed: ${err.message}`);
    }
  };

  const getClearanceLabel = (level) => {
    switch (level) {
      case 4: return <span className="text-red-400 font-semibold font-mono">Level 4: Top Secret</span>;
      case 3: return <span className="text-amber-400 font-semibold font-mono">Level 3: Secret</span>;
      case 2: return <span className="text-blue-400 font-semibold font-mono">Level 2: Confidential</span>;
      default: return <span className="text-slate-400 font-semibold font-mono">Level 1: Unclassified</span>;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 border border-[#24324d] bg-[#111827]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#24324d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Select Authenticated Persona (JWT Re-issue)</h2>
              <p className="text-xs text-slate-400">Switching user regenerates server JWT token & enforces real RBAC/ABAC authorization boundaries.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Persona Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {allUsers.map(u => {
            const isSelected = user && user.id === u.id;
            return (
              <div
                key={u.id}
                onClick={() => handleSelectUser(u.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/10'
                    : 'border-[#24324d] bg-[#162035] hover:border-slate-500 hover:bg-[#1a2742]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        {u.name}
                        {isSelected && <CheckCircle className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="text-xs text-blue-400 font-medium">{u.roleTitle}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#24324d]/60 text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-mono text-emerald-400">{u.departmentName} ({u.department})</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Security Clearance:</span>
                    {getClearanceLabel(u.clearanceLevel)}
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">PKI Key status:</span>
                    <span className="font-mono text-xs text-indigo-400 flex items-center gap-1">
                      <Key className="w-3 h-3" /> RSA-2048 Loaded
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#24324d] flex justify-end">
          <button onClick={onClose} className="btn btn-secondary text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
