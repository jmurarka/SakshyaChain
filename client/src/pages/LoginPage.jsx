import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, UserCheck, Key, ArrowRight, EyeOff, Award, Users, CheckCircle2 } from 'lucide-react';

export default function LoginPage({ navigateTo: propNavigateTo }) {
  const navigate = useNavigate();
  const { allUsers, loginAsUser } = useAuth();

  const [bossUserId, setBossUserId] = useState('USR-JUD-404');
  const [employeeUserId, setEmployeeUserId] = useState('USR-POL-101');
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);

  const handleBossLogin = async (e) => {
    e.preventDefault();
    setAuthenticating(true);
    setAuthError(null);
    try {
      await loginAsUser(bossUserId);
      if (propNavigateTo) return propNavigateTo('dashboard');
      navigate('/dashboard');
    } catch (err) {
      setAuthError(`Boss Portal Login Failed: ${err.message}`);
    } finally {
      setAuthenticating(false);
    }
  };

  const handleEmployeeLogin = async (e) => {
    e.preventDefault();
    setAuthenticating(true);
    setAuthError(null);
    try {
      await loginAsUser(employeeUserId);
      if (propNavigateTo) return propNavigateTo('dashboard');
      navigate('/dashboard');
    } catch (err) {
      setAuthError(`Employee Portal Login Failed: ${err.message}`);
    } finally {
      setAuthenticating(false);
    }
  };

  const bossUsers = allUsers.filter(u => u.clearanceLevel >= 4) || [
    { id: 'USR-JUD-404', name: 'Justice P. K. Mukherjee', roleTitle: 'Special Sessions Court Magistrate', departmentName: 'Sessions Court' },
    { id: 'USR-AUD-505', name: 'Anil Gupta', roleTitle: 'Principal Information Security Auditor', departmentName: 'Judicial Oversight Board' }
  ];

  const employeeUsers = allUsers.filter(u => u.clearanceLevel < 4) || [
    { id: 'USR-POL-101', name: 'Inspector Vikram Sharma', roleTitle: 'Chief Investigating Officer', departmentName: 'Special Crime Branch' },
    { id: 'USR-FOR-202', name: 'Dr. Sunita Rao', roleTitle: 'Senior Forensic Analyst', departmentName: 'Forensic Science Laboratory' },
    { id: 'USR-PRO-303', name: 'Advocate Rajesh Verma', roleTitle: 'Senior Public Prosecutor', departmentName: 'Directorate of Prosecution' }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Header Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-600/20">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">SākshyaChain Portal Gateway</h1>
          <p className="text-xs text-slate-500 mt-1">Multi-Tenant Legal & Investigation Digital Vault • Role Gateway</p>
        </div>
      </div>

      {authError && (
        <div className="max-w-4xl mx-auto w-full mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-mono">
          {authError}
        </div>
      )}

      {/* Dual Portal Selection Cards (Matching Blue Boxes) */}
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Boss / Executive Portal (Blue Box) */}
        <div className="bg-white border-2 border-blue-200 hover:border-blue-500 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-blue-600" /> EXECUTIVE PORTAL (LEVEL 4)
              </span>
              <span className="text-xs text-slate-400 font-mono">Boss Interface</span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" /> Boss / Magistrate Login
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Full System Oversight, PKI Signature Verification & Stamping, Audit DAG Graph, and Security Alerts.
              </p>
            </div>

            <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 space-y-2 text-xs">
              <div className="font-semibold text-blue-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600" /> Boss Privileges Included:
              </div>
              <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside">
                <li>PKI Digital Signature Verification & Stamping</li>
                <li>Audit Trail DAG Graph & System Logs</li>
                <li>Security Alerts & Break-Glass Access</li>
                <li>User Directory & Supervisor Oversight</li>
              </ul>
            </div>

            <form onSubmit={handleBossLogin} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Boss / Magistrate Persona:</label>
                <select
                  value={bossUserId}
                  onChange={(e) => setBossUserId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {bossUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.roleTitle} • Level {u.clearanceLevel || 4})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={authenticating}
                className="btn btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                <span>{authenticating ? 'Authenticating...' : 'Enter Boss Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="text-[10px] text-slate-400 font-mono text-center pt-2 border-t border-slate-100">
            Clearance Level 4 • Full System Access
          </div>
        </div>

        {/* Card 2: Employee / Field Officer Portal (Blue Box) */}
        <div className="bg-white border-2 border-blue-200 hover:border-blue-500 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" /> FIELD PORTAL (LEVEL 3 / 2)
              </span>
              <span className="text-xs text-slate-400 font-mono">Employee Interface</span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" /> Employee / Officer Login
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Restricted Operational Workspace for Case File Management, Evidence Upload, and AI Legal Assistant.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <EyeOff className="w-4 h-4 text-slate-500" /> Employee Access Isolation:
              </div>
              <ul className="space-y-1 text-slate-600 text-[11px] list-disc list-inside">
                <li>Verify Signature / PKI Options Hidden</li>
                <li>Boss User IDs & Senior Authorities Hidden</li>
                <li>Security Alerts & Audit DAG Hidden</li>
                <li>Profile Switching Disabled Without Logout</li>
              </ul>
            </div>

            <form onSubmit={handleEmployeeLogin} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Employee / Officer Persona:</label>
                <select
                  value={employeeUserId}
                  onChange={(e) => setEmployeeUserId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {employeeUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.roleTitle} • Level {u.clearanceLevel || 3})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={authenticating}
                className="btn btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>{authenticating ? 'Authenticating...' : 'Enter Employee Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="text-[10px] text-slate-400 font-mono text-center pt-2 border-t border-slate-100">
            Clearance Level 3/2 • Operational Field Access
          </div>
        </div>

      </div>
    </div>
  );
}

