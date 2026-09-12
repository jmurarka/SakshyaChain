import React, { useState } from 'react';
import { 
  Laptop, 
  ShieldCheck, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Wifi, 
  HardDrive,
  User,
  Key
} from 'lucide-react';

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState([
    { id: 'DEV-8819', officer: 'Inspector Vikram Singh', type: 'POLICE_WORKSTATION_DELL', ip: '10.24.192.42', mac: '00:1A:2B:3C:4D:5E', registered: '2026-08-10', status: 'APPROVED' },
    { id: 'DEV-8820', officer: 'Dr. Anita Roy', type: 'FORENSIC_MACBOOK_PRO', ip: '10.24.192.89', mac: '00:1A:2B:9F:8E:7D', registered: '2026-08-15', status: 'APPROVED' },
    { id: 'DEV-8821', officer: 'Officer Priya Patel', type: 'FIELD_TABLET_IPAD', ip: '10.24.193.12', mac: '00:1A:2B:11:22:33', registered: '2026-09-01', status: 'APPROVED' },
    { id: 'DEV-8822', officer: 'Senior Advocate Rajesh Sharma', type: 'COURT_WORKSTATION_HP', ip: '10.24.195.05', mac: '00:1A:2B:44:55:66', registered: '2026-09-10', status: 'PENDING' }
  ]);

  const handleApprove = (id) => {
    setDevices(devices.map(d => d.id === id ? { ...d, status: 'APPROVED' } : d));
  };

  const handleRevoke = (id) => {
    setDevices(devices.map(d => d.id === id ? { ...d, status: 'REVOKED' } : d));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Laptop className="w-4 h-4" />
            Hardware & Device Authorization Registry
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Approved Device Fingerprints</h1>
          <p className="text-slate-500 text-sm mt-1">
            Only pre-registered, encrypted hardware devices can establish zero-trust TLS connections to SākshyaChain vault nodes.
          </p>
        </div>
      </div>

      {/* Grid of Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {devices.map((dev) => {
          const isApproved = dev.status === 'APPROVED';
          const isPending = dev.status === 'PENDING';

          return (
            <div key={dev.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isApproved ? 'bg-emerald-50 text-emerald-600' : isPending ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{dev.type}</h3>
                    <div className="text-xs text-slate-500">Assigned Officer: <strong className="text-slate-800">{dev.officer}</strong></div>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                  isApproved ? 'bg-emerald-100 text-emerald-800' : isPending ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {dev.status}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs font-mono text-slate-600">
                <div className="flex justify-between">
                  <span>Device ID:</span>
                  <span className="font-bold text-slate-800">{dev.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bound IP Address:</span>
                  <span>{dev.ip}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hardware MAC Hash:</span>
                  <span>{dev.mac}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400 font-mono">Registered: {dev.registered}</span>
                <div className="flex items-center gap-2">
                  {isPending && (
                    <button
                      onClick={() => handleApprove(dev.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition"
                    >
                      Approve Fingerprint
                    </button>
                  )}
                  {isApproved && (
                    <button
                      onClick={() => handleRevoke(dev.id)}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-lg transition"
                    >
                      Revoke Trust
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
