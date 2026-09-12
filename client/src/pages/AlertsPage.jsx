import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Lock, 
  UserX, 
  Clock, 
  Filter, 
  Download,
  Eye,
  FileText
} from 'lucide-react';

export default function AlertsPage() {
  const [filter, setFilter] = useState('all');
  const [alerts, setAlerts] = useState([
    {
      id: 'ALT-1092',
      title: 'Unencrypted Export Attempt Blocked',
      severity: 'HIGH',
      category: 'DATA_LEAK_PREVENTION',
      actor: 'officer_42 (Inspector Vikram)',
      docId: 'DOC-8891-002',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      details: 'Server blocked an unencrypted raw binary payload download request for classified forensic report without break-glass privilege.',
      status: 'OPEN'
    },
    {
      id: 'ALT-1091',
      title: 'Break-Glass Emergency Protocol Triggered',
      severity: 'HIGH',
      category: 'EMERGENCY_ACCESS',
      actor: 'prosecutor_1 (Senior Advocate Sharma)',
      docId: 'DOC-8891-001',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      details: '30-minute Emergency Access granted under Justification Code: COURT_ORDER_CRIM_882. Supervisor notified.',
      status: 'OPEN'
    },
    {
      id: 'ALT-1090',
      title: 'MFA OTP Lockout Triggered',
      severity: 'MEDIUM',
      category: 'AUTHENTICATION',
      actor: 'forensic_8 (Dr. Anita Roy)',
      docId: 'N/A',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      details: '3 consecutive invalid OTP submissions within 120 seconds. Account temporarily locked for 15 minutes.',
      status: 'RESOLVED'
    },
    {
      id: 'ALT-1089',
      title: 'Automated Disk Hash Integrity Scan Passed',
      severity: 'LOW',
      category: 'SYSTEM_AUDIT',
      actor: 'SYSTEM_CRON',
      docId: 'ALL_DOCUMENTS',
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      details: 'All 8 vault file SHA-256 digests matched database records and blockchain DAG blocks exactly.',
      status: 'RESOLVED'
    }
  ]);

  const handleResolveAlert = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'RESOLVED' } : a));
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'open') return a.status === 'OPEN';
    if (filter === 'high') return a.severity === 'HIGH';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            Security & Audit Alerts Center
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Security Incident Logs</h1>
          <p className="text-slate-500 text-sm mt-1">
            Real-time audit log of access clearance violations, MFA lockouts, and cryptographic tamper events.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-xl shadow-sm text-xs font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${filter === 'all' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-3 py-1.5 rounded-lg transition ${filter === 'open' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Open ({alerts.filter(a => a.status === 'OPEN').length})
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-3 py-1.5 rounded-lg transition ${filter === 'high' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            High Severity
          </button>
        </div>
      </div>

      {/* Alert Feed List */}
      <div className="space-y-4">
        {filteredAlerts.map(alert => {
          const isHigh = alert.severity === 'HIGH';
          const isResolved = alert.status === 'RESOLVED';

          return (
            <div
              key={alert.id}
              className={`p-5 rounded-xl border transition bg-white shadow-sm flex flex-col md:flex-row items-start justify-between gap-4 ${
                isResolved 
                  ? 'border-slate-200 opacity-80' 
                  : isHigh 
                  ? 'border-rose-200 bg-rose-50/20' 
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isHigh ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {isHigh ? <AlertTriangle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 text-base">{alert.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      isHigh ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {alert.severity} SEVERITY
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">ID: {alert.id}</span>
                  </div>

                  <p className="text-xs text-slate-600">{alert.details}</p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-2 font-mono">
                    <span>Actor: <strong className="text-slate-800">{alert.actor}</strong></span>
                    <span>•</span>
                    <span>Doc: <strong className="text-slate-800">{alert.docId}</strong></span>
                    <span>•</span>
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                {isResolved ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" /> RESOLVED
                  </span>
                ) : (
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Acknowledge & Resolve
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
