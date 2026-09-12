import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, FilePlus, Lock, UploadCloud, FileText } from 'lucide-react';

export default function UploadModal({ isOpen, onClose, onUploaded }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [caseId, setCaseId] = useState('CASE-2026-8891');
  const [category, setCategory] = useState('FIR');
  const [clearanceLevel, setClearanceLevel] = useState(user?.clearanceLevel ? String(Math.min(2, user.clearanceLevel)) : '1');
  const [uploadMode, setUploadMode] = useState('text'); // 'text' | 'file'
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setTextContent(event.target.result || `File payload: ${file.name}`);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || (!textContent && !selectedFile)) {
      alert('Please provide document title and file or text content.');
      return;
    }

    setSubmitting(true);
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', title);
        formData.append('caseId', caseId);
        formData.append('category', category);
        formData.append('clearanceLevel', clearanceLevel);
        formData.append('textContent', textContent || `[File Attachment: ${selectedFile.name}]`);
        await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/documents/upload', {
          title,
          caseId,
          category,
          clearanceLevel,
          textContent
        });
      }

      alert('Document successfully uploaded, AES-256 encrypted, and anchored to Blockchain Ledger!');
      setTitle('');
      setTextContent('');
      setSelectedFile(null);
      onUploaded();
      onClose();
    } catch (err) {
      alert(`Upload failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content p-6 border border-[#24324d] bg-[#111827] max-w-xl">
        <div className="flex items-center justify-between pb-4 border-b border-[#24324d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <FilePlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Dynamic AES-256 Document Storage Vault</h2>
              <p className="text-xs text-slate-400">Upload real files or dynamic text payloads with envelope encryption & blockchain ledger anchoring.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs font-sans">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2 p-1 bg-[#0b0f19] rounded-lg border border-[#24324d]">
            <button
              type="button"
              onClick={() => setUploadMode('text')}
              className={`flex-1 py-1.5 rounded-md font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                uploadMode === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Text Payload Input
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              className={`flex-1 py-1.5 rounded-md font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                uploadMode === 'file' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" /> Select Local File
            </button>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Document Title:</label>
            <input
              type="text"
              placeholder="e.g. Ballistics Laboratory Match Analysis Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Case Number:</label>
              <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="input-field text-sm">
                <option value="CASE-2026-8891">CASE-2026-8891 (Homicide & Fraud)</option>
                <option value="CASE-2026-4412">CASE-2026-4412 (Narcotics Seizure)</option>
                <option value="CASE-2026-1102">CASE-2026-1102 (Commercial Heist)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category:</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field text-sm">
                <option value="FIR">First Information Report (FIR)</option>
                <option value="FORENSIC_REPORT">Forensic & Ballistics Report</option>
                <option value="WITNESS_STATEMENT">Witness Statement</option>
                <option value="COURT_FILING">Court Filing & Judicial Order</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">ABAC Clearance Level:</label>
              <select value={clearanceLevel} onChange={(e) => setClearanceLevel(e.target.value)} className="input-field text-sm">
                <option value="1">Level 1: Unclassified</option>
                <option value="2">Level 2: Confidential</option>
                <option value="3">Level 3: Secret</option>
                <option value="4">Level 4: Top Secret</option>
              </select>
            </div>
          </div>

          {uploadMode === 'file' ? (
            <div className="space-y-2">
              <label className="block text-slate-300 font-semibold mb-1">Select File from Computer:</label>
              <div className="border-2 border-dashed border-[#24324d] rounded-xl p-6 text-center hover:border-blue-500 transition-colors bg-[#0b0f19]">
                <UploadCloud className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <input
                  type="file"
                  id="fileUploadInput"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="fileUploadInput" className="btn btn-secondary text-xs cursor-pointer inline-block">
                  Browse File
                </label>
                {selectedFile && (
                  <div className="mt-3 text-emerald-400 font-mono text-xs">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Document Text Content:</label>
              <textarea
                rows={5}
                placeholder="Type or paste legal document text content dynamically here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="input-field font-mono text-xs"
                required
              />
            </div>
          )}

          <div className="pt-4 border-t border-[#24324d] flex justify-end gap-3 font-sans">
            <button type="button" onClick={onClose} className="btn btn-secondary text-xs">Cancel</button>
            <button type="submit" disabled={submitting} className="btn btn-primary text-xs flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {submitting ? 'Encrypting & Storing...' : 'AES-256 Encrypt & Anchor Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
