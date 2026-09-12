import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-200">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="text-4xl font-extrabold text-slate-900 font-mono">404</h1>
      <h2 className="text-xl font-bold text-slate-800">Resource Path Not Found</h2>
      <p className="text-slate-500 text-sm max-w-md">
        The requested digital record, page route, or audit node does not exist or has been archived under strict security protocols.
      </p>

      <div className="pt-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Vault Dashboard
        </Link>
      </div>
    </div>
  );
}
