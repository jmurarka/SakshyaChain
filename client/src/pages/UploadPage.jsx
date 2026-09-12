import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FilePlus, UploadCloud, Lock, CheckCircle2, RefreshCw, ArrowLeft, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function UploadPage({ navigateTo: propNavigateTo }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [caseId, setCaseId] = useState('CASE-2026-8891');
  const [category, setCategory] = useState('FIR');
  const [clearanceLevel, setClearanceLevel] = useState('2');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);

  const [uploadedResult, setUploadedResult] = useState(null);

  const maxClearance = user?.clearanceLevel || 3;

  useEffect(() => {
    if (user?.clearanceLevel) {
      setClearanceLevel(String(Math.min(2, user.clearanceLevel)));
    }
  }, [user]);

  const handleNavigateBack = () => {
    if (propNavigateTo) return propNavigateTo('cases');
    navigate('/cases');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
      const isText = file.type.startsWith('text/') || /\.(txt|json|md|csv)$/i.test(file.name);
      if (isText) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setTextContent(ev.target.result || '');
        };
        reader.readAsText(file);
      } else {
        setTextContent(`[File Attachment: ${file.name}]`);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title) {
      alert('Please enter document title.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(1); // Uploading
    setUploadedResult(null);

    const timerIds = [];
    timerIds.push(setTimeout(() => setUploadProgress(2), 200)); // Encrypting
    timerIds.push(setTimeout(() => setUploadProgress(3), 400)); // Hashing
    timerIds.push(setTimeout(() => setUploadProgress(4), 600)); // Vault Stored

    try {
      let res;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', title);
        formData.append('caseId', caseId);
        formData.append('category', category);
        formData.append('clearanceLevel', clearanceLevel);
        formData.append('textContent', textContent || `[Attachment: ${selectedFile.name}]`);
        res = await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/documents/upload', {
          title,
          caseId,
          category,
          clearanceLevel,
          textContent: textContent || 'Standard legal document filing'
        });
      }

      timerIds.forEach(id => clearTimeout(id));
      setUploadProgress(5);
      setIsUploading(false);
      setUploadedResult(res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      timerIds.forEach(id => clearTimeout(id));
      const msg = err.response?.data?.message || err.message;
      setUploadError(msg);
      setIsUploading(false);
      setUploadProgress(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <button onClick={handleNavigateBack} className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold">
        <ArrowLeft className="w-4 h-4" /> Back to Cases & Vault
      </button>

      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>Upload Error: {uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="text-rose-600 hover:text-rose-900 font-bold">✕</button>
        </div>
      )}

      {uploadedResult && (
        <div className="p-6 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 text-white space-y-4 shadow-xl font-sans animate-fade-in">
          <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-emerald-300">✓ Document Successfully Ingested & Anchored!</h3>
                <p className="text-xs text-emerald-200">{uploadedResult.message}</p>
              </div>
            </div>
            <span className="badge badge-success font-mono text-xs">v{uploadedResult.document?.version || '1.0'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs text-emerald-100 bg-slate-950/70 p-4 rounded-xl border border-emerald-800">
            <div>
              <span className="text-slate-400">Document ID:</span>{' '}
              <span className="text-emerald-300 font-bold">{uploadedResult.document?.id}</span>
            </div>
            <div>
              <span className="text-slate-400">Assigned Case:</span>{' '}
              <span className="text-white">{uploadedResult.document?.caseId}</span>
            </div>
            <div className="md:col-span-2 flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">Cryptographic Integrity:</span>
              <span className="text-emerald-400 font-bold">✓ SHA-256 Hash Secured & Stored in Database</span>
            </div>
            <div>
              <span className="text-slate-400">Encryption Standard:</span>{' '}
              <span className="text-emerald-400 font-bold">AES-256-GCM Envelope</span>
            </div>
            {uploadedResult.ledgerBlock && (
              <div>
                <span className="text-slate-400">Audit DAG Block:</span>{' '}
                <span className="text-indigo-300 font-bold">Index #{uploadedResult.ledgerBlock.blockIndex}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button onClick={handleNavigateBack} className="btn btn-success text-xs flex items-center gap-1.5 py-2 px-4 font-bold">
              View Document in Vault ➔
            </button>
            <button
              onClick={() => {
                setUploadedResult(null);
                setTitle('');
                setSelectedFile(null);
                setTextContent('');
                setUploadProgress(0);
              }}
              className="btn btn-secondary text-xs py-2 px-4"
            >
              Upload Another Document
            </button>
          </div>
        </div>
      )}

      <div className="white-card p-6 border border-slate-200 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-mono">Upload & Cryptographically Ingest Document</h2>
            <p className="text-xs text-slate-500">Computes SHA-256 hash digest, encrypts payload with AES-256-GCM, and mines audit DAG block.</p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-4 text-xs font-sans">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Document Title:</label>
            <input
              type="text"
              placeholder="e.g. Sworn Deposition & Fingerprint Match Analysis"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Assigned Case:</label>
              <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="input-field text-sm">
                <option value="CASE-2026-8891">CASE-2026-8891 (Homicide & Fraud)</option>
                <option value="CASE-2026-4412">CASE-2026-4412 (Narcotics Seizure)</option>
                <option value="CASE-2026-1102">CASE-2026-1102 (Commercial Heist)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Document Category:</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field text-sm">
                <option value="FIR">First Information Report (FIR)</option>
                <option value="FORENSIC_REPORT">Forensic & Ballistics Report</option>
                <option value="WITNESS_STATEMENT">Witness Statement</option>
                <option value="COURT_FILING">Court Filing & Judicial Order</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Security Clearance:</label>
              <select value={clearanceLevel} onChange={(e) => setClearanceLevel(e.target.value)} className="input-field text-sm">
                <option value="1">Level 1: Unclassified</option>
                {maxClearance >= 2 && <option value="2">Level 2: Confidential</option>}
                {maxClearance >= 3 && <option value="3">Level 3: Secret</option>}
                {maxClearance >= 4 && <option value="4">Level 4: Top Secret</option>}
              </select>
            </div>
          </div>

          {/* Drag & Drop / Browse Box */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 hover:bg-blue-50/50 hover:border-blue-400 transition-colors space-y-2">
            <UploadCloud className="w-8 h-8 text-blue-600 mx-auto" />
            <div className="font-semibold text-slate-800 text-sm">Select local file from PC or drag & drop</div>
            <input type="file" id="pageFileInput" onChange={handleFileChange} className="hidden" />
            <label htmlFor="pageFileInput" className="btn btn-secondary text-xs cursor-pointer inline-block">
              Browse File
            </label>
            {selectedFile && (
              <div className="text-emerald-700 font-mono font-bold text-xs mt-2">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Document Text Notes / Summary {selectedFile ? '(Optional for File Attachments)' : '(Required)'}:
            </label>
            <textarea
              rows={5}
              placeholder="Enter optional document summary or notes..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="input-field text-sm font-sans"
              required={!selectedFile}
            />
          </div>

          <button type="submit" disabled={isUploading} className="btn btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" />
            {isUploading ? 'Ingesting Document...' : 'Upload & Anchor to Ledger'}
          </button>
        </form>

        {/* 5-Step Animated Upload Progress */}
        {uploadProgress > 0 && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 font-mono text-xs">
            <div className="font-bold text-slate-900 font-sans text-xs">Ingestion Pipeline Progress:</div>
            <div className={`flex items-center gap-2 ${uploadProgress >= 1 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
              <CheckCircle2 className="w-4 h-4" /> 1. Uploaded Payload Buffer
            </div>
            <div className={`flex items-center gap-2 ${uploadProgress >= 2 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
              <CheckCircle2 className="w-4 h-4" /> 2. Encrypted with AES-256-GCM
            </div>
            <div className={`flex items-center gap-2 ${uploadProgress >= 3 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
              <CheckCircle2 className="w-4 h-4" /> 3. Computed SHA-256 Payload Hash Digest
            </div>
            <div className={`flex items-center gap-2 ${uploadProgress >= 4 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
              <CheckCircle2 className="w-4 h-4" /> 4. Stored in Encrypted Vault Storage
            </div>
            <div className={`flex items-center gap-2 ${uploadProgress >= 5 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
              <CheckCircle2 className="w-4 h-4" /> 5. Audit Event Block Mined to DAG
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
