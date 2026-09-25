import React, { useState } from 'react';
import {
  Building2, ShieldCheck, Network, ArrowRight, RadioTower,
  Microscope, Landmark, Gavel, CalendarDays, ExternalLink,
  Info, Eye, LockKeyhole, History, ChevronDown
} from 'lucide-react';

const pillars = [
  {
    name: 'Police',
    system: 'CCTNS',
    icon: ShieldCheck,
    color: 'blue',
    summary: 'Supports police records and case workflows, including investigation tracking.'
  },
  {
    name: 'Forensic laboratories',
    system: 'e-Forensics',
    icon: Microscope,
    color: 'violet',
    summary: 'Supports digital handling of forensic casework and reports.'
  },
  {
    name: 'Prosecution',
    system: 'e-Prosecution',
    icon: Gavel,
    color: 'emerald',
    summary: 'Supports structured coordination between police and prosecution.'
  },
  {
    name: 'Courts',
    system: 'e-Courts',
    icon: Landmark,
    color: 'amber',
    summary: 'Supports court workflows and exchange of relevant case records.'
  },
  {
    name: 'Prisons',
    system: 'e-Prisons',
    icon: Building2,
    color: 'rose',
    summary: 'Supports prison administration and relevant information exchange.'
  }
];

const demoRoles = [
  { role: 'Employees', access: 'Work with assigned cases and files; request additional access when needed.' },
  { role: 'Owners and supervisors', access: 'Review access requests within their assigned responsibilities.' },
  { role: 'IT Admin', access: 'View system information and grant or revoke employee access; cannot edit evidence.' }
];

const updates = [
  {
    date: '29 July 2026',
    label: 'Latest public overview',
    text: 'The Ministry of Home Affairs described ICJS as enabling exchange across police, courts, prisons, forensics and prosecution, and noted related digital services including e-Sakshya and e-Summons.',
    href: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2291038&lang=2&reg=48',
    source: 'Ministry of Home Affairs · Press Information Bureau'
  },
  {
    date: '30 July 2024',
    label: 'Phase II objectives',
    text: 'A public update described Phase II goals including better integration, improved data quality, timelier investigation and trials, and reduced dependence on paper records.',
    href: 'https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=2039059&lang=2&reg=48',
    source: 'Ministry of Home Affairs · Press Information Bureau'
  }
];

const colorClasses = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200'
};

export default function OrgHierarchyPage() {
  const [showUpdateNotes, setShowUpdateNotes] = useState(false);

  return (
    <main className="space-y-6">
      <section className="white-card overflow-hidden border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-white">
        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-800">
                <Info className="h-3.5 w-3.5" /> Public information overview
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">How ICJS connects justice services</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                The Inter-operable Criminal Justice System (ICJS) supports information exchange between key criminal justice systems. This page gives a brief, high-level introduction for SākshyaChain users.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-xs text-slate-600 shadow-sm">
              <Eye className="h-5 w-5 flex-shrink-0 text-blue-600" />
              <span><strong className="block text-slate-900">General overview</strong>No operational or restricted details</span>
            </div>
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p><strong>For clarity:</strong> ICJS is a national programme. The employee, supervisor and IT Admin roles described below are SākshyaChain demo roles; they are not an official ICJS role hierarchy. This prototype does not connect to government ICJS systems.</p>
          </div>
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="pillars-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-700">Static architecture</p>
            <h2 id="pillars-heading" className="mt-1 text-lg font-bold text-slate-900">ICJS connected systems</h2>
          </div>
          <span className="text-xs text-slate-500">High-level view</span>
        </div>
        <div className="white-card border border-slate-200 px-4 py-4 md:px-6">
          <div className="mx-auto flex w-fit items-center gap-3 rounded-xl bg-slate-900 px-5 py-3 text-white shadow-sm">
            <Network className="h-5 w-5 text-blue-300" />
            <div><p className="text-[10px] font-bold uppercase tracking-widest text-blue-200">ICJS</p><p className="text-sm font-semibold">Interoperability layer</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-3 md:grid-cols-5">
            {pillars.map(({ name, system, icon: Icon, color }) => (
              <div key={system} className="flex flex-col items-center text-center">
                <ArrowRight className="my-2 h-4 w-4 rotate-90 text-slate-600" strokeWidth={2.5} aria-hidden="true" />
                <article className="flex min-h-[76px] w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left">
                  <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border ${colorClasses[color]}`}><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0"><span className="block truncate text-[9px] font-bold uppercase tracking-wider text-slate-500">{name}</span><span className="block truncate text-xs font-bold text-slate-900">{system}</span></span>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="white-card border border-slate-200 p-5 md:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Network className="h-5 w-5" /></div>
          <div><h2 className="font-bold text-slate-900">High-level information flow</h2><p className="text-xs text-slate-500">Systems exchange relevant records so information need not be re-entered at every step.</p></div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ['1', 'Record', 'The responsible service creates or updates its record.'],
            ['2', 'Exchange', 'Relevant information can move between connected systems.'],
            ['3', 'Use', 'Authorized personnel use records for their assigned work.'],
            ['4', 'Continue', 'Casework proceeds through the appropriate justice service.']
          ].map(([number, title, description], index) => (
            <div key={number} className="relative rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{number}</span>
                {index < 3 && <ArrowRight className="hidden h-4 w-4 text-slate-400 md:block" />}
              </div>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] leading-5 text-slate-500">This is an illustrative summary, not a prescribed case sequence. Information access remains subject to applicable law, authorization and the procedures of the responsible agency.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <div className="white-card border border-slate-200 p-5 md:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><LockKeyhole className="h-5 w-5" /></div>
            <div><h2 className="font-bold text-slate-900">SākshyaChain demo access</h2><p className="text-xs text-slate-500">Local prototype rules at a glance</p></div>
          </div>
          <div className="divide-y divide-slate-100">
            {demoRoles.map(item => (
              <div key={item.role} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-3">
                <h3 className="text-xs font-bold text-slate-800">{item.role}</h3>
                <p className="text-xs leading-5 text-slate-600">{item.access}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-[11px] leading-5 text-slate-600">Access is limited to assigned work. Employees can request document access; approvals follow the demo workflow shown in the portal.</div>
        </div>

        <div className="white-card border border-slate-200 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><History className="h-5 w-5" /></div>
              <div><h2 className="font-bold text-slate-900">Information updates</h2><p className="text-xs text-slate-500">Public-source change notes</p></div>
            </div>
            <button type="button" onClick={() => setShowUpdateNotes(value => !value)} aria-expanded={showUpdateNotes} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              {showUpdateNotes ? 'Hide update notes' : 'Show update notes'}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${showUpdateNotes ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {updates.slice(0, showUpdateNotes ? updates.length : 1).map(update => (
              <article key={update.date} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-blue-700"><CalendarDays className="h-3.5 w-3.5" />{update.date}<span className="rounded-full bg-white px-2 py-0.5 text-slate-600">{update.label}</span></div>
                <p className="mt-2 text-xs leading-5 text-slate-700">{update.text}</p>
                <a href={update.href} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900">{update.source}<ExternalLink className="h-3 w-3" /></a>
              </article>
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-4 text-slate-500">Update notes summarize the linked public releases; they are not a live ICJS feed.</p>
        </div>
      </section>

      <footer className="flex flex-wrap items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11px] leading-5 text-slate-500">
        <RadioTower className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
        <p>For official and current programme information, consult the Ministry of Home Affairs releases linked above. This page is an educational summary and does not provide legal advice or operational instructions.</p>
      </footer>
    </main>
  );
}
