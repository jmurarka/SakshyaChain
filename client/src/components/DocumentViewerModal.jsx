import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Key, ShieldCheck, FileText, Clock, CheckCircle2, AlertTriangle, Download, GitCommit, FilePlus, ExternalLink, ShieldAlert, Cpu } from 'lucide-react';

export default function DocumentViewerModal({ doc, isOpen, onClose }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('preview');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [publicKeyPem, setPublicKeyPem] = useState('');
  const [loadingPubKey, setLoadingPubKey] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  // Version creation state
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [newVersionText, setNewVersionText] = useState(doc ? doc.extractedText || '' : '');
  const [changeNotes, setChangeNotes] = useState('');
  const [isMajorVersion, setIsMajorVersion] = useState(false);
  const [submittingVersion, setSubmittingVersion] = useState(false);

  if (!isOpen || !doc) return null;

  const handleVerifySignature = async () => {
    setVerifying(true);
    try {
      const res = await api.post('/signature/verify', { docId: doc.id });
      setVerifyResult(res.data);
    } catch (err) {
      setVerifyResult({ valid: false, status: 'VERIFICATION_ERROR', reasons: [err.response?.data?.message || err.message] });
    } finally {
      setVerifying(false);
    }
  };

  const handleFetchPublicKey = async () => {
    const signerId = doc.signature?.manifest?.signerId || 'USR-POL-101';
    setLoadingPubKey(true);
    try {
      // Unauthenticated endpoint call
      const res = await fetch(`http://localhost:5000/api/signature/signers/${signerId}/public-key`);
      const text = await res.text();
      setPublicKeyPem(text);
    } catch (err) {
      alert(`Failed to fetch public key: ${err.message}`);
    } finally {
      setLoadingPubKey(false);
    }
  };

  const handleRevokeSignature = async (e) => {
    e.preventDefault();
    const sigId = doc.signature?.signatureId || doc.signature?.manifestId;
    if (!sigId || !revokeReason.trim()) {
      alert('Please provide a reason for revocation.');
      return;
    }
    setRevoking(true);
    try {
      await api.delete(`/signature/signatures/${sigId}`, { data: { reason: revokeReason } });
      alert('Signature successfully revoked and anchored to audit ledger.');
      setShowRevokeModal(false);
      handleVerifySignature();
    } catch (err) {
      alert(`Revocation failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setRevoking(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/documents/${doc.id}/download`, { responseType: 'blob' });
      const type = response.headers['content-type'] || doc.mimeType || 'application/pdf';
      const blob = new Blob([response.data], { type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      let filename = doc.originalFileName || (doc.title ? `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf` : `${doc.id}.pdf`);
      if (!/\.(pdf|txt|docx|json)$/i.test(filename)) {
        filename += '.pdf';
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Download restricted: ${err.response?.data?.message || 'Unauthorized clearance'}`);
    }
  };

  const handleCreateVersion = async (e) => {
    e.preventDefault();
    if (!newVersionText.trim() || !changeNotes.trim()) {
      alert('Please provide revised text content and change description notes.');
      return;
    }

    setSubmittingVersion(true);
    try {
      await api.post(`/documents/${doc.id}/versions`, {
        textContent: newVersionText,
        changeNotes,
        isMajorVersion
      });
      alert('New version created successfully!');
      setShowVersionForm(false);
      onClose();
    } catch (err) {
      alert(`Version creation failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmittingVersion(false);
    }
  };

  const isAuditorOrAdmin = user && (user.role === 'COMPLIANCE_AUDITOR' || user.role === 'ADMIN' || user.clearanceLevel >= 4);

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl p-6 border border-[#24324d] bg-[#111827] text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#24324d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{doc.title}</h2>
                <span className="badge badge-blue">v{doc.version || '1.0'}</span>
                <span className="badge badge-purple">{doc.category}</span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Doc ID: {doc.id} | Case ID: {doc.caseId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-4 border-b border-[#24324d] pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'preview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Decrypted Content
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'versions' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" /> Version History ({(doc.versions || []).length})
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'security' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> AES-256 Envelope Metadata
          </button>
          <button
            onClick={() => setActiveTab('pki')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'pki' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-indigo-400" /> KMS Signature & Manifest
          </button>
          <button
            onClick={() => setActiveTab('custody')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'custody' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Chain of Custody
          </button>
        </div>

        {/* Tab Contents */}
        <div className="mt-4">
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-[#24324d] font-mono text-xs max-h-[300px] overflow-y-auto whitespace-pre-wrap text-blue-200">
                {(doc.extractedText || '').trim().startsWith('%PDF-') || doc.mimeType === 'application/pdf' ? (
                  <div className="text-center py-4 space-y-2">
                    <div className="text-emerald-400 font-bold text-sm">PDF Binary Document Attachment</div>
                    <div className="text-slate-400 text-xs font-sans">
                      Stored with AES-256-GCM envelope encryption and secured in database.
                    </div>
                  </div>
                ) : (
                  doc.extractedText || 'Decrypted text unavailable or missing.'
                )}
              </div>
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setShowVersionForm(!showVersionForm)}
                  className="btn btn-secondary text-xs flex items-center gap-1.5"
                >
                  <FilePlus className="w-4 h-4 text-emerald-400" />
                  {showVersionForm ? 'Cancel New Version' : 'Upload Revised Version'}
                </button>
                <button onClick={handleDownload} className="btn btn-primary text-xs flex items-center gap-1.5">
                  <Download className="w-4 h-4" /> Download Decrypted Copy
                </button>
              </div>

              {showVersionForm && (
                <form onSubmit={handleCreateVersion} className="bg-[#0d1424] p-4 rounded-xl border border-emerald-500/40 space-y-3 text-xs">
                  <h4 className="font-bold text-emerald-400 text-sm">Create New Document Version (git4docs style)</h4>
                  <div>
                    <label className="block text-slate-300 mb-1">Revised Document Text:</label>
                    <textarea
                      value={newVersionText}
                      onChange={(e) => setNewVersionText(e.target.value)}
                      rows={5}
                      className="w-full bg-[#0b0f19] border border-slate-700 rounded-lg p-2 font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">Change Notes / Commit Message:</label>
                    <input
                      type="text"
                      value={changeNotes}
                      onChange={(e) => setChangeNotes(e.target.value)}
                      placeholder="e.g. Added ballistics analysis section"
                      className="w-full bg-[#0b0f19] border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="majorVersion"
                      checked={isMajorVersion}
                      onChange={(e) => setIsMajorVersion(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="majorVersion" className="text-slate-300">Bump Major Version (e.g. v1.0 -&gt; v2.0)</label>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={submittingVersion} className="btn btn-success text-xs">
                      {submittingVersion ? 'Committing New Version...' : 'Commit Version to Ledger'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {(doc.versions || []).map((ver, idx) => (
                <div key={idx} className="bg-[#0d1424] p-3 rounded-lg border border-[#24324d] flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span className="badge badge-blue">v{ver.version}</span>
                      <span>{ver.changeNotes || 'Initial Upload'}</span>
                    </div>
                    <div className="text-slate-400 font-mono text-[11px] mt-1">
                      Payload Hash: {ver.payloadHash?.slice(0, 24)}...
                    </div>
                  </div>
                  <div className="text-right text-slate-400 text-[11px]">
                    <div>{ver.createdByName}</div>
                    <div className="font-mono">{ver.createdAt}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="bg-[#0d1424] p-4 rounded-xl border border-[#24324d] space-y-2">
                <div className="text-slate-400">Payload SHA-256 Digest:</div>
                <div className="text-emerald-400 font-bold break-all bg-slate-950 p-2 rounded text-[11px]">{doc.payloadHash}</div>
                <div className="text-slate-400">Wrapped DEK (Envelope Encryption):</div>
                <div className="text-blue-300 break-all bg-slate-950 p-2 rounded text-[11px]">{doc.wrappedDek}</div>
              </div>
              {doc.encryptionMetadata && (
                <div className="bg-[#0d1424] p-4 rounded-xl border border-[#24324d] space-y-1 text-slate-300">
                  <div>Algorithm: <span className="text-white">{doc.encryptionMetadata.algorithm}</span></div>
                  <div>DEK Auth Tag: <span className="text-slate-400">{doc.encryptionMetadata.dekAuthTag}</span></div>
                  <div>Payload IV: <span className="text-slate-400">{doc.encryptionMetadata.payloadIv}</span></div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'custody' && (
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {(doc.chainOfCustody || []).map((step, idx) => (
                <div key={idx} className="bg-[#0d1424] p-3 rounded-lg border border-[#24324d] flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-white">{step.action}</div>
                    <div className="text-slate-400">Actor: <span className="text-emerald-400">{step.actorName}</span> ({step.department})</div>
                    <div className="text-slate-500 text-[11px] font-mono">{step.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'pki' && (
            <div className="space-y-4 font-mono text-xs">
              {doc.signature ? (
                <div className="bg-[#0d1424] p-4 rounded-xl border border-[#24324d] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" /> KMS RSA-2048 PKI Digital Signature Attached
                    </span>
                    <span className="text-slate-400 text-xs">{doc.signature.dateSigned}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>Signed By: <span className="text-white font-bold">{doc.signature.signedBy}</span> ({doc.signature.signerRole})</div>
                    <div>KMS Provider: <span className="text-indigo-400 font-bold">{doc.signature.signatureProvider || 'LocalKmsProvider (local-dev-v1)'}</span></div>
                    {doc.signature.manifestId && (
                      <div>Manifest ID: <span className="text-blue-300 font-mono">{doc.signature.manifestId}</span></div>
                    )}
                    {doc.signature.signatureId && (
                      <div>Signature ID: <span className="text-blue-300 font-mono">{doc.signature.signatureId}</span></div>
                    )}
                  </div>

                  <div>Signature Base64 Digest:</div>
                  <div className="bg-slate-950 p-2 rounded text-slate-400 overflow-x-auto text-[10px] break-all max-h-20">
                    {doc.signature.signatureBase64}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button onClick={handleVerifySignature} disabled={verifying} className="btn btn-primary text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      {verifying ? 'Running Cryptographic Verification...' : 'Execute 3-State Signature Verification'}
                    </button>
                    <button onClick={handleFetchPublicKey} disabled={loadingPubKey} className="btn btn-secondary text-xs flex items-center gap-1.5">
                      <ExternalLink className="w-4 h-4 text-cyan-400" />
                      {loadingPubKey ? 'Fetching Key...' : 'Fetch 3rd-Party Public Key'}
                    </button>
                    {isAuditorOrAdmin && (
                      <button onClick={() => setShowRevokeModal(true)} className="btn btn-danger text-xs flex items-center gap-1.5 ml-auto">
                        <ShieldAlert className="w-4 h-4" /> Revoke Signature
                      </button>
                    )}
                  </div>

                  {publicKeyPem && (
                    <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                      <div className="text-cyan-400 font-bold flex items-center justify-between text-[11px]">
                        <span>3rd-Party Unauthenticated Public Key Endpoint (GET /api/signature/signers/:signerId/public-key):</span>
                        <button onClick={() => setPublicKeyPem('')} className="text-slate-500 hover:text-white">Close</button>
                      </div>
                      <pre className="text-[10px] text-slate-300 overflow-x-auto p-1 font-mono">{publicKeyPem}</pre>
                    </div>
                  )}

                  {verifyResult && (
                    <div className={`p-4 rounded-xl border font-sans text-xs space-y-2 ${
                      verifyResult.valid ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-red-950/40 border-red-500/40 text-red-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${verifyResult.valid ? 'bg-emerald-400' : 'bg-red-500'}`} />
                          Verification Status: {verifyResult.status}
                        </div>
                        <span className="text-slate-400 text-[11px] font-mono">Target: {doc.signature.manifestId || doc.id}</span>
                      </div>
                      {verifyResult.reasons && verifyResult.reasons.length > 0 && (
                        <div className="space-y-1 text-slate-300 text-[11px]">
                          <div className="font-bold text-slate-200">Diagnostic Findings:</div>
                          <ul className="list-disc list-inside space-y-0.5">
                            {verifyResult.reasons.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {verifyResult.manifest && (
                        <div className="text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-700/50">
                          <div>Manifest Version: {verifyResult.manifest.versionId}</div>
                          <div>Recorded Hash: {verifyResult.manifest.sha256}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {showRevokeModal && (
                    <form onSubmit={handleRevokeSignature} className="mt-4 p-4 bg-red-950/50 border border-red-500/50 rounded-xl space-y-3 text-xs">
                      <h4 className="font-bold text-red-300 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-red-400" /> Revoke Signature (Auditor Action)
                      </h4>
                      <p className="text-slate-300">Revocation appends an immutable revocation event to the audit ledger without deleting historical signature records.</p>
                      <div>
                        <label className="block text-slate-300 mb-1">Reason for Revocation:</label>
                        <input
                          type="text"
                          value={revokeReason}
                          onChange={(e) => setRevokeReason(e.target.value)}
                          placeholder="e.g. Signer private key compromised or issued in error"
                          className="w-full bg-[#0b0f19] border border-red-900 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowRevokeModal(false)} className="btn btn-secondary text-xs">Cancel</button>
                        <button type="submit" disabled={revoking} className="btn btn-danger text-xs">
                          {revoking ? 'Revoking Signature...' : 'Confirm Revocation'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="bg-[#0d1424] p-6 text-center text-slate-400 space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                  <p>No PKI Digital Signature attached to this document yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
