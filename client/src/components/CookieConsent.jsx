import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, Check, X, Lock } from 'lucide-react';
import { Link } from 'react-router-dom'; // Note: react-router-dom

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('sakshya_cookie_consent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('sakshya_cookie_consent', JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString()
    }));
    setShowConsent(false);
  };

  const handleDecline = () => {
    localStorage.setItem('sakshya_cookie_consent', JSON.stringify({
      accepted: false,
      timestamp: new Date().toISOString()
    }));
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md bg-slate-900/95 backdrop-blur-md border border-slate-700 text-slate-100 p-4 rounded-2xl shadow-2xl z-50 font-sans transition-all duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl mt-0.5 flex-shrink-0">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <div className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
            Security &amp; Privacy Telemetry
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            SākshyaChain uses essential security cookies and privacy-preserving local telemetry to enforce JWT session authentication and audit DAG integrity. No 3rd-party tracking cookies are used.
          </p>
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleAccept}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" /> Accept Essential Cookies
            </button>
            <button
              onClick={handleDecline}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-xs transition-colors"
            >
              Decline Optional
            </button>
          </div>
        </div>
        <button
          onClick={handleDecline}
          aria-label="Close cookie consent modal"
          className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
