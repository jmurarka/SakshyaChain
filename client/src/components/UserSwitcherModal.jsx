import React from 'react';
import { useAuth } from '../context/AuthContext';
import { X, ShieldCheck, CheckCircle, Lock, UserCheck, Key } from 'lucide-react';

export default function UserSwitcherModal({ isOpen, onClose }) {
  const { allUsers, user, loginAsUser, isBoss, loading } = useAuth();

  if (!isOpen) return null;

  // Employees cannot switch profiles in-session (must logout and use login portal)
  if (!isBoss) {
    return (
      <div className="modal-overlay">
        <div className="modal-content max-w-md p-6 border border-rose-500/40 bg-[#111827] text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">In-Session Switch Restricted</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Employee personas cannot switch security profiles within an active session. You must log out and authenticate through the main Dual Portal login gateway.
          </p>
          <button onClick={onClose} className="btn btn-secondary text-xs">Close</button>
        </div>
      </div>
    );
  }

  const handleSelectUser = async (targetUser) => {
    if (user && targetUser.clearanceLevel > user.clearanceLevel) {
      alert(`Privilege Escalation Prohibited: Your current Level ${user.clearanceLevel} persona cannot elevate session to higher Level ${targetUser.clearanceLevel} persona (${targetUser.name}).`);
      return;
    }
    try {
      await loginAsUser(targetUser.id);
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
              <h2 className="text-lg font-bold text-white">Select Authenticated Persona (Clearance Hierarchy Enforced)</h2>
              <p className="text-xs text-slate-400">High-clearance personas (Level 4) can switch to lower levels. Lower levels cannot elevate to higher levels.</p>
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
            const isHigherClearance = user && u.clearanceLevel > user.clearanceLevel;

            return (
              <div
                key={u.id}
                onClick={() => handleSelectUser(u)}
                className={`p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-900/20 shadow-lg shadow-blue-500/10 cursor-pointer'
                    : isHigherClearance
                    ? 'border-rose-900/40 bg-rose-950/10 opacity-60 cursor-not-allowed'
                    : 'border-[#24324d] bg-[#162035] hover:border-slate-500 hover:bg-[#1a2742] cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isSelected ? 'bg-blue-600 text-white' : isHigherClearance ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        {u.name}
                        {isSelected && <CheckCircle className="w-4 h-4 text-blue-400" />}
                        {isHigherClearance && <Lock className="w-3.5 h-3.5 text-rose-400" />}
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
                  <div className="flex justify-between items-center text-slate-300 pt-1">
                    <span className="text-slate-400">Switch Authorization:</span>
                    {isHigherClearance ? (
                      <span className="font-mono text-[10px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                        🔒 Higher Level Locked
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        ✓ Allowed (Level {u.clearanceLevel} ≤ {user?.clearanceLevel})
                      </span>
                    )}
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
