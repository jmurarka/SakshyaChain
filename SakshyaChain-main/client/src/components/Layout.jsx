import React, { useState } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, Search, Bell, Lock, Database, Cpu, ShieldAlert,
  SlidersHorizontal, Users, Smartphone, User, FileText, CheckCircle2, Menu, X, LogOut, ChevronRight, HardDrive, Key
} from 'lucide-react';
import UserSwitcherModal from './UserSwitcherModal';
import MFALoginModal from './MFALoginModal';
import BreakGlassModal from './BreakGlassModal';

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [isMFAOpen, setIsMFAOpen] = useState(false);
  const [isBreakGlassOpen, setIsBreakGlassOpen] = useState(false);

  // Dynamic Sidebar Navigation based on user role
  const getSidebarNavItems = (role) => {
    const commonBefore = [
      { id: 'dashboard', label: 'Dashboard', icon: SlidersHorizontal, path: '/dashboard' },
      { id: 'cases', label: 'Case Management', icon: Database, path: '/cases' },
      { id: 'upload', label: 'Upload & Ingest', icon: FileText, path: '/upload' },
      { id: 'rag', label: 'AI Legal Assistant', icon: Cpu, path: '/rag' },
      { id: 'audit', label: 'Audit Trail DAG', icon: Lock, path: '/audit' },
    ];

    const commonAfter = [
      { id: 'integrity', label: 'Integrity Scanner', icon: ShieldCheck, path: '/integrity' },
      { id: 'alerts', label: 'Security Alerts', icon: Bell, badge: '3', path: '/alerts' },
      { id: 'break-glass', label: 'Break Glass Access', icon: ShieldAlert, path: '/break-glass' }
    ];

    if (role === 'COMPLIANCE_AUDITOR' || role === 'ADMIN' || role === 'SYSTEM_ADMIN') {
      return [
        ...commonBefore,
        ...commonAfter,
        { id: 'admin-users', label: 'User Directory', icon: Users, path: '/admin/users' },
        { id: 'admin-devices', label: 'Device Approvals', icon: Smartphone, path: '/admin/devices' }
      ];
    }

    return [...commonBefore, ...commonAfter];
  };

  const navItems = getSidebarNavItems(user ? user.role : 'POLICE_INVESTIGATOR');

  const getClearanceBadge = (level) => {
    switch (level) {
      case 5: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Level 5 • Top Secret</span>;
      case 4: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Level 4 • Classified</span>;
      case 3: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Level 3 • Secret</span>;
      case 2: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Level 2 • Restricted</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Level 1 • Standard</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#334155] flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-lg tracking-tight font-mono">SākshyaChain</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold border border-emerald-200">
                    MVP v2.0
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 hidden sm:block font-medium">Digital Document & Legal Evidence System</div>
              </div>
            </Link>
          </div>

          {/* Global Search Input */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Global Search (FIR #, Case ID, SHA-256 hash, Witness name)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Right Controls & User Profile Pill */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsBreakGlassOpen(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Request Break-Glass Emergency Access"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Break Glass</span>
            </button>

            <button
              onClick={() => setIsMFAOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              title="2-Factor MFA Verification"
            >
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">MFA Re-Auth</span>
            </button>

            <Link
              to="/alerts"
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Live Security Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                3
              </span>
            </Link>

            {/* User Profile / Persona Switcher */}
            {user && (
              <div
                onClick={() => setIsUserSwitcherOpen(true)}
                className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-1 px-2.5 cursor-pointer transition-colors"
                title="Click to Switch Security Persona"
              >
                <div className="w-7 h-7 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  {user.name ? user.name[0] : 'U'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{user.role}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 py-6 gap-6">
        
        {/* Navigation Sidebar */}
        <aside className={`w-60 flex-shrink-0 bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm h-fit ${
          mobileMenuOpen ? 'block fixed top-16 left-4 z-50 shadow-2xl' : 'hidden lg:block'
        }`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 px-2">
            Navigation Menu
          </div>

          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-mono text-[10px] font-bold">{item.badge}</span>
                  ) : (
                    isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Role Card */}
          {user && (
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-2 text-xs">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Security Clearance</div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{user.name}</div>
                <div className="text-slate-500 font-mono text-[11px] truncate">{user.department}</div>
                <div className="mt-1">{getClearanceBadge(user.clearanceLevel || 3)}</div>
              </div>
            </div>
          )}
        </aside>

        {/* Dynamic Outlet for Page Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Global Modals */}
      <UserSwitcherModal
        isOpen={isUserSwitcherOpen}
        onClose={() => setIsUserSwitcherOpen(false)}
      />

      <MFALoginModal
        isOpen={isMFAOpen}
        onClose={() => setIsMFAOpen(false)}
      />

      <BreakGlassModal
        isOpen={isBreakGlassOpen}
        onClose={() => setIsBreakGlassOpen(false)}
      />

      {/* Footer Status Bar */}
      <footer className="bg-white border-t border-[#E2E8F0] py-3 text-xs text-slate-500 font-mono mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
            <span className="text-slate-700 font-semibold">SākshyaChain System Status:</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">REST API ONLINE</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>Integrity: <strong className="text-emerald-600">100% Verified</strong></span>
            <span>•</span>
            <span>AES-256 Vault: <strong className="text-slate-700">Encrypted at Rest</strong></span>
            <span>•</span>
            <span>Last Ledger Sync: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
