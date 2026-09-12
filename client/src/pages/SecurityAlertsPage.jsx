import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, RefreshCw, Lock, Cpu, Server, UserCheck, ShieldAlert } from 'lucide-react';
import api from '../services/api';

export default function SecurityAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/manager/security-alerts');
      setAlerts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch security alerts:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAlerts();
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            Real-Time Unauthorized Access Monitoring
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Security Alerts & Intrusion Log</h1>
          <p className="text-slate-500 text-sm mt-1">
            Live audit of unauthorized resource access attempts, blocked network requests, and device/role violations.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing Events...' : 'Refresh Alerts'}
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Active Security Events ({alerts.length})
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Simulated Network Subnet & Role Access Enforcer
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading security alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No security alert events logged.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">User / Officer ID</th>
                  <th className="py-3 px-4">Network Subnet</th>
                  <th className="py-3 px-4">Device ID</th>
                  <th className="py-3 px-4">Requested Resource</th>
                  <th className="py-3 px-4">Status / Action</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {alerts.map((item, idx) => {
                  const isBlocked = item.action === 'BLOCKED';
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                        {item.userName || item.userId}
                        <div className="text-[10px] text-slate-400 font-mono">{item.userId}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {item.network}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-cyan-700">
                        {item.device}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-semibold truncate max-w-xs">
                        {item.resource}
                      </td>
                      <td className="py-3 px-4">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> BLOCKED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> GRANTED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
