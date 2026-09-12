import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  UserPlus, 
  Search, 
  CheckCircle2, 
  Lock, 
  Key, 
  Briefcase,
  Building,
  MoreVertical
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([
    { id: 'usr_001', name: 'Inspector Vikram Singh', role: 'POLICE_INVESTIGATOR', department: 'Crime Branch - South Zone', clearance: 'LEVEL_3', mfa: true, status: 'ACTIVE' },
    { id: 'usr_002', name: 'Dr. Anita Roy', role: 'FORENSIC_EXPERT', department: 'Central Forensic Science Lab (CFSL)', clearance: 'LEVEL_4', mfa: true, status: 'ACTIVE' },
    { id: 'usr_003', name: 'Senior Advocate Rajesh Sharma', role: 'PROSECUTOR', department: 'Public Prosecutor Office', clearance: 'LEVEL_3', mfa: true, status: 'ACTIVE' },
    { id: 'usr_004', name: 'Hon. Justice Verma', role: 'JUDGE', department: 'High Court Bench 4', clearance: 'LEVEL_5', mfa: true, status: 'ACTIVE' },
    { id: 'usr_005', name: 'Officer Priya Patel', role: 'POLICE_INVESTIGATOR', department: 'Cyber Crime Unit', clearance: 'LEVEL_2', mfa: true, status: 'ACTIVE' },
    { id: 'usr_006', name: 'Admin Root Control', role: 'SYSTEM_ADMIN', department: 'IT & Security Infrastructure', clearance: 'LEVEL_5', mfa: true, status: 'ACTIVE' }
  ]);

  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            Identity & Access Management (IAM)
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Personnel & Role Management</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage multi-agency user profiles, security clearance tiers, and department assignments.
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition shadow-sm">
          <UserPlus className="w-4 h-4" />
          Provision New Officer Credentials
        </button>
      </div>

      {/* Directory Search & Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, role, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <span className="text-xs text-slate-500 font-mono">Total Provisioned Users: {users.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Officer Name & ID</th>
                <th className="py-3 px-4">Role & Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Clearance Tier</th>
                <th className="py-3 px-4">MFA Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{u.id}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded text-[11px]">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {u.department}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      u.clearance === 'LEVEL_5' ? 'bg-purple-100 text-purple-800' :
                      u.clearance === 'LEVEL_4' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {u.clearance}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> MFA Hardware Enabled
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
