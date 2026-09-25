import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, Search, Bell, BellRing, Lock, Database, Cpu, ShieldAlert,
  SlidersHorizontal, Users, Smartphone, User, FileText, CheckCircle2, Menu, X, LogOut, ChevronRight, HardDrive, Key, GitFork,
  Briefcase, Settings, Building
} from 'lucide-react';
import UserSwitcherModal from './UserSwitcherModal';
import MFALoginModal from './MFALoginModal';
import BreakGlassModal from './BreakGlassModal';
import NetworkContextBanner from './NetworkContextBanner';
import api from '../services/api';

export default function Layout() {
  const { user, isBoss, isSupervisor, isITAdmin, logout, error: authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingAccessRequests, setPendingAccessRequests] = useState(0);
  const [accessNotice, setAccessNotice] = useState(null);
  const [tamperAlert, setTamperAlert] = useState(null);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const seenTamperAlerts = useRef(new Set());
  const seenApprovalSteps = useRef(new Set());

  const playTamperAlarm = async () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      await context.resume();
      [880, 660, 880].forEach((frequency, index) => {
        const startAt = context.currentTime + index * 0.28;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'square';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(0.16, startAt + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(startAt);
        oscillator.stop(startAt + 0.23);
      });
      window.setTimeout(() => context.close(), 1200);
    } catch (error) {
      console.warn('Browser blocked the tamper alarm sound:', error);
    }
  };

  useEffect(() => {
    if (!isITAdmin) return undefined;
    let mounted = true;
    const showTamperAlert = alert => {
      if (!alert || alert.category !== 'EVIDENCE_TAMPERING') return;
      setTamperAlert(alert);
      if (!seenTamperAlerts.current.has(alert.id)) {
        seenTamperAlerts.current.add(alert.id);
        playTamperAlarm();
      }
    };
    const handleIncidentBroadcast = event => {
      if (!event.newValue) return;
      try {
        const alert = JSON.parse(event.newValue);
        if (Date.now() - Number(alert.emittedAt || 0) < 60_000) showTamperAlert(alert);
      } catch { /* Ignore malformed cross-tab notifications. */ }
    };
    window.addEventListener('storage', handleIncidentBroadcast);
    const pollTamperAlerts = async () => {
      try {
        const response = await api.get('/audit/alerts');
        if (!mounted) return;
        const active = (response.data.alerts || []).find(alert => alert.category === 'EVIDENCE_TAMPERING' && alert.status === 'OPEN');
        setTamperAlert(active || null);
        if (active) showTamperAlert(active);
      } catch { /* Preserve the portal if the alert feed is temporarily unavailable. */ }
    };
    pollTamperAlerts();
    const timer = window.setInterval(pollTamperAlerts, 3000);
    return () => { mounted = false; window.clearInterval(timer); window.removeEventListener('storage', handleIncidentBroadcast); };
  }, [isITAdmin, alarmEnabled]);

  useEffect(() => {
    if (!user) return undefined;
    seenApprovalSteps.current = new Set();
    let mounted = true;
    const pollAccessRequests = async () => {
      try {
        const response = await api.get('/access-requests');
        if (!mounted) return;
        const requests = response.data.requests || [];
        const needingApproval = requests.flatMap(request => {
          const steps = [];
          if (request.ownerId === user.id && request.ownerDecision === 'PENDING') steps.push({ request, role: 'file owner' });
          if (request.supervisorId === user.id && request.ownerDecision === 'APPROVED' && request.supervisorDecision === 'PENDING') steps.push({ request, role: 'supervisor' });
          return steps;
        });
        setPendingAccessRequests(needingApproval.length);
        const unseen = needingApproval.find(({ request, role }) => {
          const key = `${request.id}:${role}`;
          if (seenApprovalSteps.current.has(key)) return false;
          seenApprovalSteps.current.add(key);
          return true;
        });
        if (unseen) setAccessNotice(unseen);
      } catch {
        // Keep the rest of the portal usable while the approval queue is offline.
      }
    };
    pollAccessRequests();
    const timer = setInterval(pollAccessRequests, 4000);
    return () => { mounted = false; clearInterval(timer); };
  }, [user?.id]);

  // Modals state
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [isMFAOpen, setIsMFAOpen] = useState(false);
  const [isBreakGlassOpen, setIsBreakGlassOpen] = useState(false);

  // Redirect to login if user is unauthenticated
  if (!user) {
    return <Navigate to="/login" replace state={{ lockoutMessage: authError }} />;
  }

  // Route Guard: If an Employee attempts to access Boss-only pages directly via URL bar
  const bossOnlyPaths = ['/audit', '/break-glass', '/admin/users', '/admin/devices', '/admin/device-registry'];
  const isTargetingBossPage = bossOnlyPaths.some(p => location.pathname.startsWith(p));
  if (isTargetingBossPage && !(isSupervisor || isITAdmin)) {
    return <Navigate to="/dashboard" replace />;
  }
  if (isITAdmin && ['/break-glass', '/admin/devices'].some(p => location.pathname.startsWith(p))) return <Navigate to="/dashboard" replace />;
  if (location.pathname.startsWith('/admin/users') && !isITAdmin) return <Navigate to="/dashboard" replace />;
  if (location.pathname.startsWith('/admin/device-registry') && !isITAdmin) return <Navigate to="/dashboard" replace />;
  if (location.pathname.startsWith('/system/documents') && !isITAdmin) return <Navigate to="/dashboard" replace />;

  // Organized sidebar navigation grouped by operational area
  const getSidebarSections = () => {
    const dashboardItem = { id: 'dashboard', label: 'Dashboard', icon: SlidersHorizontal, path: '/dashboard' };
    const casesItem = { id: 'cases', label: 'Cases & Evidence', icon: Briefcase, path: '/cases' };
    const uploadItem = { id: 'upload', label: 'Upload & Ingest', icon: FileText, path: '/upload' };
    const accessItem = { id: 'access', label: 'Request Access', icon: Key, path: '/access-requests' };

    const graphItem = { id: 'graph', label: 'Knowledge Graph', icon: GitFork, path: '/graph' };
    const ragItem = { id: 'rag', label: 'AI Evidence Assistant', icon: Cpu, path: '/rag' };
    const searchItem = { id: 'search', label: 'Evidence Search', icon: Search, path: '/cases' };
    const orgHierarchyItem = { id: 'org-hierarchy', label: 'Org Hierarchy', icon: Building, path: '/org-hierarchy' };

    const integrityItem = { id: 'integrity', label: 'Integrity Scanner', icon: ShieldCheck, path: '/integrity' };
    const auditItem = { id: 'audit', label: 'Audit Trail', icon: Lock, path: '/audit' };
    const alertsItem = { id: 'alerts', label: 'Security Alerts', icon: Bell, path: '/alerts' };
    const breakGlassItem = { id: 'break-glass', label: 'Break-Glass Access', icon: ShieldAlert, path: '/break-glass' };

    const usersItem = { id: 'admin-users', label: 'Users & Roles', icon: Users, path: '/admin/users' };
    const deviceRegistryItem = { id: 'device-registry', label: 'Device Registry', icon: HardDrive, path: '/admin/device-registry' };
    const devicesItem = { id: 'admin-devices', label: 'Device Approvals', icon: Smartphone, path: '/admin/devices' };
    const policiesItem = { id: 'admin-policies', label: 'System Policies', icon: Settings, path: '/admin' };

    // Employee interface — limited to core workflow + investigation
    if (isITAdmin) return [
      { title: 'SYSTEM', items: [dashboardItem, casesItem, { id: 'users', label: 'Users & Roles', icon: Users, path: '/admin/users' }, deviceRegistryItem, { id: 'org', label: 'Organization', icon: Building, path: '/org-hierarchy' }, { id: 'documents', label: 'Documents', icon: FileText, path: '/system/documents' }, graphItem, { id: 'integrity', label: 'Integrity Monitor', icon: ShieldCheck, path: '/integrity' }, accessItem, auditItem, alertsItem] }
    ];
    if (isSupervisor) {
      return [
        { title: 'OVERSIGHT', items: [dashboardItem, casesItem, { id: 'access', label: 'Access Requests & Approval Queue', icon: FileText, path: '/access-requests' }, alertsItem, auditItem, orgHierarchyItem] },
      ];
    }
    return [
      { title: 'CORE', items: [dashboardItem, casesItem, accessItem, { id: 'shared', label: 'Shared With Me', icon: Lock, path: '/cases' }, orgHierarchyItem] },
      { title: 'WORK', items: [uploadItem, graphItem, ragItem, searchItem] },
      { title: 'SECURITY', items: [integrityItem, alertsItem] },
    ];
  };

  const sidebarSections = getSidebarSections();

  const getClearanceBadge = (level) => {
    switch (level) {
      case 5: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Level 5 • Top Secret</span>;
      case 4: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Level 4 • Restricted</span>;
      case 3: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Level 3 • Field Officer</span>;
      case 2: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Level 2 • Field Staff</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Level 1 • Standard</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#334155] flex flex-col font-sans">
      {/* Network Security Context Bar */}
      <NetworkContextBanner />

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
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold border bg-blue-50 text-blue-700 border-blue-200">
                    {isITAdmin ? 'IT ADMIN — ACCESS CUSTODIAN' : isSupervisor ? 'SUPERVISOR OVERSIGHT' : 'EMPLOYEE PORTAL'}
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
            <Link
              to={`/access-requests?tab=${isSupervisor ? 'supervisor' : 'owner'}`}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              title="Access requests needing your approval"
              aria-label={`Access approval queue, ${pendingAccessRequests} pending`}
            >
              <Bell className="w-4 h-4" />
              {pendingAccessRequests > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">{pendingAccessRequests}</span>}
            </Link>
            {/* Boss-Only Header Controls: Break Glass Emergency & Security Alerts */}
            {isBoss && (
              <>
                <button
                  onClick={() => setIsBreakGlassOpen(true)}
                  className="px-3 py-1.5 bg-[#1e293b] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  title="Request Break-Glass Emergency Access"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Break Glass</span>
                </button>

                <Link
                  to="/alerts"
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  title="Live Security Alerts"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    3
                  </span>
                </Link>
              </>
            )}

            <button
              onClick={() => setIsMFAOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              title="2-Factor MFA Verification"
            >
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">MFA Re-Auth</span>
            </button>

            {/* User Profile Pill */}
            {user && (
              <div className="flex items-center gap-2">
                <div
                  onClick={() => isBoss && setIsUserSwitcherOpen(true)}
                  className={`flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1 px-2.5 transition-colors ${
                    isBoss ? 'hover:bg-slate-100 cursor-pointer' : 'cursor-default'
                  }`}
                  title={isBoss ? "Supervisor profile" : "Employee profile"}
                >
                  <div className="w-7 h-7 rounded-md font-bold flex items-center justify-center text-xs text-white bg-blue-600">
                    {user.name ? user.name[0] : 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-semibold text-slate-900 leading-tight">{user.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{user.role}</div>
                  </div>
                </div>

                {/* Direct Logout Button */}
                <button
                  onClick={logout}
                  className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Sign out & return to Login Page"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {isITAdmin && tamperAlert && (
        <div role="alert" className="sticky top-[64px] z-30 flex flex-wrap items-center justify-between gap-3 bg-rose-700 px-4 py-3 text-white shadow-lg animate-pulse">
          <div className="flex items-center gap-3"><BellRing className="h-5 w-5" /><div><b>SECURITY ALARM — EVIDENCE TAMPERING</b><div className="text-xs">{tamperAlert.userName || tamperAlert.actor} · {tamperAlert.docId} · Account and evidence temporarily locked.</div></div></div>
          <div className="flex items-center gap-2"><button onClick={() => { setAlarmEnabled(true); playTamperAlarm(); }} className="rounded border border-white/60 px-3 py-1.5 text-xs font-bold">{alarmEnabled ? 'Play alarm' : 'Enable / play alarm'}</button><Link to={`/alerts?incident=${encodeURIComponent(tamperAlert.id)}`} onClick={() => { setAlarmEnabled(true); playTamperAlarm(); setTamperAlert(null); }} className="rounded bg-white px-3 py-1.5 text-xs font-bold text-rose-800">View incident</Link></div>
        </div>
      )}

      {accessNotice && (
        <div role="status" className="fixed top-20 right-4 z-50 max-w-sm rounded-xl border border-blue-200 bg-white p-4 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900">Access approval needed</p>
              <p className="mt-1 text-sm text-slate-700">{accessNotice.request.requester?.name || 'An employee'} requested access to {accessNotice.request.document?.title || 'a document'}.</p>
              <p className="mt-1 text-xs text-slate-500">You are the {accessNotice.role}. The queue refreshes every few seconds.</p>
              <button onClick={() => { setAccessNotice(null); navigate(`/access-requests?tab=${accessNotice.role === 'supervisor' ? 'supervisor' : 'owner'}`); }} className="mt-3 btn btn-primary text-xs">Review request</button>
            </div>
            <button onClick={() => setAccessNotice(null)} aria-label="Dismiss notification" className="text-slate-400 hover:text-slate-700">×</button>
          </div>
        </div>
      )}

      {/* Main Container — sidebar is edge-aligned (no floating offset) */}
      <div className="relative flex min-h-[calc(100vh-53px)] w-full">

        {/* Navigation Sidebar — sticky, edge-aligned, no floating offset */}
        <aside className={`w-60 flex-shrink-0 bg-white border-r border-[#E2E8F0] h-[calc(100vh-53px)] sticky top-[53px] z-30 overflow-y-auto py-5 ${
          mobileMenuOpen ? 'fixed top-[53px] left-0 z-40 shadow-2xl' : 'hidden lg:block'
        }`}>
          <div className="px-3 mb-4 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Navigation</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
              isBoss ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {isITAdmin ? 'READ ONLY' : isSupervisor ? 'OVERSIGHT' : 'EMPLOYEE'}
            </span>
          </div>

          <nav className="space-y-5">
            {sidebarSections.map((section) => (
              <div key={section.title}>
                <div className="px-3 mb-1.5 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{section.title}</span>
                  <span className="flex-1 h-px bg-slate-100" />
                </div>
                <div className="space-y-0.5">
                  {section.items.map(item => {
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
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-mono text-[10px] font-bold flex-shrink-0">{item.badge}</span>
                        ) : (
                          isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Role Card */}
          {user && (
            <div className="mt-6 pt-4 border-t border-slate-200 space-y-2 text-xs">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{isITAdmin ? 'System Access' : 'Security Clearance'}</div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{user.name}</div>
                <div className="text-slate-500 font-mono text-[11px] truncate">{user.department}</div>
                <div className="mt-1">{isITAdmin ? <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">IT ADMIN — READ ONLY</span> : getClearanceBadge(user.clearanceLevel || 3)}</div>
              </div>
            </div>
          )}
        </aside>

        {/* Dynamic Outlet for Page Content */}
        <main className="flex-1 min-w-0 px-6 py-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Global Modals (User Switcher only for Boss) */}
      {isBoss && (
        <UserSwitcherModal
          isOpen={isUserSwitcherOpen}
          onClose={() => setIsUserSwitcherOpen(false)}
        />
      )}

      <MFALoginModal
        isOpen={isMFAOpen}
        onClose={() => setIsMFAOpen(false)}
      />

      {isBoss && (
        <BreakGlassModal
          isOpen={isBreakGlassOpen}
          onClose={() => setIsBreakGlassOpen(false)}
        />
      )}

      {/* Footer Status Bar */}
      <footer className="bg-white border-t border-[#E2E8F0] py-3 text-xs text-slate-500 font-mono mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
            <span className="text-slate-700 font-semibold">SākshyaChain System Status:</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">REST API ONLINE</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <Link to="/privacy" className="hover:text-blue-600 transition-colors font-medium underline underline-offset-2">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-blue-600 transition-colors font-medium underline underline-offset-2">Terms of Service</Link>
            <span>•</span>
            <span>Role Isolation: <strong className={isITAdmin ? "text-blue-700" : isBoss ? "text-rose-600" : "text-blue-600"}>{isITAdmin ? "System Read-Only" : isBoss ? "Supervisor Oversight" : "Employee Operations"}</strong></span>
            <span>•</span>
            <span>AES-256 Vault: <strong className="text-slate-700">Encrypted at Rest</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
