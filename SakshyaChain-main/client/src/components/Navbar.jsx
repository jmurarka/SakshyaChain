import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Cpu, Database, ArrowLeftRight, UserCog, ShieldAlert, Key } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenUserSwitcher, onOpenMFA, onOpenBreakGlass }) {
  const { user } = useAuth();

  const getClearanceBadge = (level) => {
    switch (level) {
      case 4: return <span className="badge badge-clearance-4"><Lock className="w-3 h-3"/> Top Secret L4</span>;
      case 3: return <span className="badge badge-clearance-3"><ShieldCheck className="w-3 h-3"/> Secret L3</span>;
      case 2: return <span className="badge badge-clearance-2"><ShieldCheck className="w-3 h-3"/> Confidential L2</span>;
      default: return <span className="badge badge-clearance-1">Unclassified L1</span>;
    }
  };

  return (
    <header className="border-b border-[#24324d] bg-[#0d1424] sticky top-0 z-50">
      {/* Top Banner: Active User Security Context */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 p-[2px] flex items-center justify-center shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-[#0d1424] rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-mono">SākshyaChain</h1>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-semibold border border-emerald-500/30">
                MVP v2.0 Production
              </span>
            </div>
            <p className="text-xs text-slate-400">Secure Digital Document Management System for Legal & Investigation</p>
          </div>
        </div>

        {/* User Context, MFA & Break-Glass Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenBreakGlass}
            className="btn btn-danger text-xs py-1.5 px-3 flex items-center gap-1.5 animate-pulse shadow-lg shadow-red-500/20"
            title="Request Time-Boxed 30-Minute Break-Glass Emergency Access"
          >
            <ShieldAlert className="w-4 h-4" />
            Break-Glass Override
          </button>

          <button
            onClick={onOpenMFA}
            className="btn btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/60"
            title="MFA 120s OTP & JWT Authentication Status"
          >
            <Key className="w-3.5 h-3.5" />
            MFA Login (120s OTP)
          </button>

          {user && (
            <div className="flex items-center gap-3 bg-[#141e33] border border-[#24324d] rounded-xl p-2 px-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-xs">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{user.name}</span>
                    {getClearanceBadge(user.clearanceLevel)}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="text-blue-400 font-medium">{user.roleTitle}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-mono">{user.department}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenUserSwitcher}
                className="ml-2 btn btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border-blue-500/40"
              >
                <UserCog className="w-3 h-3" />
                Switch Persona
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 border-t border-[#1d2a44] pt-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('vault')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all border-b-2 ${
            activeTab === 'vault'
              ? 'border-blue-500 bg-blue-600/10 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Database className="w-4 h-4" />
          Document Vault & Versioning
        </button>

        <button
          onClick={() => setActiveTab('rag')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all border-b-2 ${
            activeTab === 'rag'
              ? 'border-indigo-500 bg-indigo-600/10 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Cpu className="w-4 h-4 text-indigo-400" />
          AI RAG Search & Citations
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all border-b-2 ${
            activeTab === 'ledger'
              ? 'border-emerald-500 bg-emerald-600/10 text-emerald-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Lock className="w-4 h-4 text-emerald-400" />
          Audit DAG & Tamper Verification
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all border-b-2 ${
            activeTab === 'transfers'
              ? 'border-amber-500 bg-amber-600/10 text-amber-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4 text-amber-400" />
          Custody Transfers & Approval Queue
        </button>
      </div>
    </header>
  );
}
