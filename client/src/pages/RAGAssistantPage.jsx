import React, { useState } from 'react';
import {
  Cpu,
  Search,
  ShieldCheck,
  Lock,
  FileText,
  FileImage,
  FileAudio,
  FileVideo,
  FileSpreadsheet,
  Tag,
  SearchCheck,
  FileStack,
  AlertCircle,
  XCircle,
  ExternalLink,
  Database,
  FileClock,
  FileQuestion
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Prototype data model for the frontend-only RAG experience.
 *
 * CASE_INDEX represents the case database. EVIDENCE_INDEX represents the file/media
 * database. Each evidence record has a caseId foreign key that joins it to CASE_INDEX.
 * No API, LLM, or backend service is used by this page.
 */
export const CASE_INDEX = [
  {
    id: 'CASE-2026-8891',
    type: 'Criminal',
    title: 'State vs. Cyber Syndicate (Financial Fraud & Homicide)',
    firNumber: 'FIR-2026-00492',
    status: 'UNDER_TRIAL',
    clearanceLevel: 3,
    description: 'Cyber fraud, homicide, digital evidence, and judicial orders.'
  },
  {
    id: 'CASE-2026-4412',
    type: 'Criminal',
    title: 'State Narcotics Operation - Seizure & Ballistics Case',
    firNumber: 'FIR-2026-00311',
    status: 'INVESTIGATION_IN_PROGRESS',
    clearanceLevel: 3,
    description: 'Narcotics seizure, prohibited firearms, and dock investigation.'
  },
  {
    id: 'CASE-2026-1102',
    type: 'Criminal',
    title: 'Commercial Complex Armed Robbery & Heist',
    firNumber: 'FIR-2026-00108',
    status: 'CHARGE_SHEET_FILED',
    clearanceLevel: 2,
    description: 'Armed robbery, forensic recovery, and evidence preservation.'
  },
  {
    id: 'CASE-CIVIL-2026-0204',
    type: 'Civil',
    title: 'Civil Property Dispute - Evidence Review',
    firNumber: 'CIV-2026-0204',
    status: 'EVIDENCE_REVIEW',
    clearanceLevel: 2,
    description: 'Civil property filing, witness material, orders, and site media.'
  }
];

/**
 * Prototype file/media index. The caseId property is the foreign key to CASE_INDEX.
 */
export const EVIDENCE_INDEX = [
  {
    id: 'EVD-8891-001',
    caseId: 'CASE-2026-8891',
    title: 'FIR & Crime Scene Inspection Report',
    category: 'FIR',
    contentType: 'Document',
    fileFormat: 'PDF',
    fileName: 'FIR-2026-00492-crime-scene.pdf',
    sourceRef: 'DOC-8891-001',
    clearanceLevel: 2,
    tag: 'public',
    description: 'Initial FIR and crime scene inspection record for the cyber syndicate case.',
    queryTerms: ['fir', 'crime', 'scene', 'inspection', 'report']
  },
  {
    id: 'EVD-8891-002',
    caseId: 'CASE-2026-8891',
    title: 'Forensic Ballistics & DNA Fingerprint Analysis',
    category: 'Forensic Report',
    contentType: 'Document',
    fileFormat: 'PDF',
    fileName: 'ballistics-dna-analysis-8891.pdf',
    sourceRef: 'DOC-8891-002',
    clearanceLevel: 3,
    tag: 'case_team',
    description: 'Ballistics and DNA analysis connecting recovered evidence to the suspect.',
    queryTerms: ['ballistics', 'dna', 'forensic', 'weapon', 'suspect']
  },
  {
    id: 'EVD-8891-003',
    caseId: 'CASE-2026-8891',
    title: 'Eyewitness Sworn Statement - Security Guard',
    category: 'Witness Statement',
    contentType: 'Document',
    fileFormat: 'PDF',
    fileName: 'witness-statement-security-guard.pdf',
    sourceRef: 'DOC-8891-003',
    clearanceLevel: 2,
    tag: 'public',
    description: 'Sworn witness statement describing the fleeing vehicle and scene observations.',
    queryTerms: ['witness', 'statement', 'security', 'vehicle', 'sedan']
  },
  {
    id: 'EVD-8891-004',
    caseId: 'CASE-2026-8891',
    title: 'CCTV Footage - Facility Gate and Server Room',
    category: 'Evidence Media',
    contentType: 'Video',
    fileFormat: 'MP4',
    fileName: 'cctv-facility-gate-server-room.mp4',
    sourceRef: 'MEDIA-8891-004',
    clearanceLevel: 3,
    tag: 'case_team',
    description: 'CCTV footage used to establish movement around the facility and server room.',
    queryTerms: ['cctv', 'footage', 'video', 'camera', 'facility', 'server']
  },
  {
    id: 'EVD-8891-005',
    caseId: 'CASE-2026-8891',
    title: 'Police Investigation Report - Digital Forensics',
    category: 'Police Investigation Report',
    contentType: 'Document',
    fileFormat: 'PDF',
    fileName: 'police-digital-forensics-investigation.pdf',
    sourceRef: 'DOC-8891-005',
    clearanceLevel: 3,
    tag: 'case_team',
    description: 'Police investigation report covering digital traces, wallet movement, and IP logs.',
    queryTerms: ['police', 'investigation', 'digital', 'forensics', 'wallet', 'ip']
  },
  {
    id: 'EVD-8891-006',
    caseId: 'CASE-2026-8891',
    title: 'Aadhaar Card - Suspect Identity Copy',
    category: 'Aadhaar / Identity Evidence',
    contentType: 'Document',
    fileFormat: 'PDF',
    fileName: 'aadhaar-suspect-sameer-verma.pdf',
    sourceRef: 'EVD-8891-006',
    clearanceLevel: 2,
    tag: 'public',
    description: 'Recovered identity document presented as evidence in the criminal case.',
    queryTerms: ['aadhaar', 'adhar', 'identity', 'suspect', 'id', 'card']
  },
  {
    id: 'EVD-8891-007',
    caseId: 'CASE-2026-8891',
    title: 'Aadhaar Verification Printout - Address Match',
    category: 'Aadhaar / Identity Evidence',
    contentType: 'Document',
    fileFormat: 'PDF',
    fileName: 'aadhaar-verification-address-match.pdf',
    sourceRef: 'EVD-8891-007',
    clearanceLevel: 2,
    tag: 'public',
    description: 'Verification printout showing the address match recorded during evidence review.',
    queryTerms: ['aadhaar', 'adhar', 'verification', 'address', 'identity', 'match']
  },
  {
    id: 'EVD-8891-008',
    caseId: 'CASE-2026-8891',
    title: 'Restricted Judicial Interception Order',
    category: 'Legal Order',
    contentType: 'Document',
    fileFormat: 'PDF',
    fileName: 'judicial-interception-order-8891.pdf',
    sourceRef: 'DOC-8891-004',
    clearanceLevel: 4,
    tag: 'sealed',
    description: 'Restricted judicial order governing confidential communications evidence.',
    queryTerms: ['legal', 'order', 'judicial', 'interception', 'warrant', 'court']
  },
  {
    id: 'EVD-8891-009',
    caseId: 'CASE-2026-8891',
    title: 'Audio Interview Recording - Investigative Interview',
    category: 'Evidence Media',
    contentType: 'Audio',
    fileFormat: 'WAV',
    fileName: 'investigative-interview-recording.wav',
    sourceRef: 'MEDIA-8891-009',
    clearanceLevel: 3,
    tag: 'case_team',
    description: 'Audio recording of the investigative interview associated with the case.',
    queryTerms: ['audio', 'recording', 'interview', 'voice', 'media']
  },
  {
    id: 'EVD-4412-001',
    caseId: 'CASE-2026-4412',
    title: 'Narcotics Seizure Inventory & Ballistics Report',
    category: 'FIR / Seizure Report',
    contentType: 'Document',
    fileFormat: 'PDF',
    fileName: 'narcotics-seizure-ballistics-report.pdf',
    sourceRef: 'DOC-4412-001',
    clearanceLevel: 3,
    tag: 'case_team',
    description: 'Seizure inventory and ballistics findings from the narcotics operation.',
    queryTerms: ['narcotics', 'seizure', 'ballistics', 'firearms', 'report']
  },
  {
    id: 'EVD-4412-002',
    caseId: 'CASE-2026-4412',
    title: 'Witness Statement - Dock Security Officer',
    category: 'Witness Statement',
    contentType: 'Document',
    fileFormat: 'PDF',
    fileName: 'witness-statement-dock-security.pdf',
    sourceRef: 'EVD-4412-002',
    clearanceLevel: 2,
    tag: 'public',
    description: 'Witness statement from the dock security officer documenting the seizure.',
    queryTerms: ['witness', 'statement', 'dock', 'security', 'officer']
  },
  {
    id: 'EVD-4412-003',
    caseId: 'CASE-2026-4412',
    title: 'Police Investigation Report - Firearms Trace',
    category: 'Police Investigation Report',
    contentType: 'Document',
    fileFormat: 'PDF',
    fileName: 'police-firearms-trace-investigation.pdf',
    sourceRef: 'DOC-4412-003',
    clearanceLevel: 3,
    tag: 'case_team',
    description: 'Police investigation report documenting the firearms trace and seizure chain.',
    queryTerms: ['police', 'investigation', 'firearms', 'trace', 'seizure']
  },
  {
    id: 'EVD-4412-004',
    caseId: 'CASE-2026-4412',
    title: 'CCTV Footage - Docking Terminal 3',
    category: 'Evidence Media',
    contentType: 'Video',
    fileFormat: 'MP4',
    fileName: 'cctv-docking-terminal-3.mp4',
    sourceRef: 'MEDIA-4412-004',
    clearanceLevel: 3,
    tag: 'case_team',
    description: 'Terminal footage used to review the seizure and movement of seized items.',
    queryTerms: ['cctv', 'footage', 'video', 'dock', 'terminal', 'media']
  },
  {
    id: 'EVD-1102-001',
    caseId: 'CASE-2026-1102',
    title: 'FIR - Commercial Complex Armed Robbery',
    category: 'FIR',
    contentType: 'Document',
    fileFormat: 'PDF',
    fileName: 'fir-commercial-complex-robbery.pdf',
    sourceRef: 'DOC-1102-001',
    clearanceLevel: 2,
    tag: 'public',
    description: 'First Information Report for the commercial complex armed robbery.',
    queryTerms: ['fir', 'robbery', 'heist', 'armed', 'commercial']
  },
  {
    id: 'EVD-1102-002',
    caseId: 'CASE-2026-1102',
    title: 'Eyewitness Statement - Vault Employee',
    category: 'Witness Statement',
    contentType: 'Document',
    fileFormat: 'PDF',
    fileName: 'eyewitness-statement-vault-employee.pdf',
    sourceRef: 'EVD-1102-002',
    clearanceLevel: 2,
    tag: 'public',
    description: 'Eyewitness statement from a vault employee involved in the heist timeline.',
    queryTerms: ['eyewitness', 'witness', 'statement', 'vault', 'employee']
  },
  {
    id: 'EVD-1102-003',
    caseId: 'CASE-2026-1102',
    title: 'Police Investigation Report - Heist Timeline',
    category: 'Police Investigation Report',
    contentType: 'Document',
    fileFormat: 'PDF',
    fileName: 'police-heist-timeline-investigation.pdf',
    sourceRef: 'DOC-1102-003',
    clearanceLevel: 2,
    tag: 'case_team',
    description: 'Police investigation report reconstructing the armed robbery timeline.',
    queryTerms: ['police', 'investigation', 'heist', 'timeline', 'robbery']
  },
  {
    id: 'EVD-1102-004',
    caseId: 'CASE-2026-1102',
    title: 'Legal Order - Evidence Preservation',
    category: 'Legal Order',
    contentType: 'Document',
    fileFormat: 'PDF',
    fileName: 'legal-order-evidence-preservation.pdf',
    sourceRef: 'DOC-1102-004',
    clearanceLevel: 3,
    tag: 'case_team',
    description: 'Legal order directing preservation of evidence from the commercial complex.',
    queryTerms: ['legal', 'order', 'evidence', 'preservation', 'court']
  },
  {
    id: 'EVD-CIV-0204-001',
    caseId: 'CASE-CIVIL-2026-0204',
    title: 'Civil Property Dispute Filing',
    category: 'Civil Filing',
    contentType: 'Document',
    fileFormat: 'PDF',
    fileName: 'civil-property-dispute-filing.pdf',
    sourceRef: 'DOC-CIV-0204-001',
    clearanceLevel: 2,
    tag: 'public',
    description: 'Initial civil filing for the property dispute evidence review.',
    queryTerms: ['civil', 'property', 'filing', 'dispute']
  },
  {
    id: 'EVD-CIV-0204-002',
    caseId: 'CASE-CIVIL-2026-0204',
    title: 'Witness Statement - Property Surveyor',
    category: 'Witness Statement',
    contentType: 'Document',
    fileFormat: 'PDF',
    fileName: 'witness-statement-property-surveyor.pdf',
    sourceRef: 'EVD-CIV-0204-002',
    clearanceLevel: 2,
    tag: 'public',
    description: 'Witness statement from the property surveyor supporting the civil review.',
    queryTerms: ['witness', 'statement', 'property', 'surveyor', 'civil']
  },
  {
    id: 'EVD-CIV-0204-003',
    caseId: 'CASE-CIVIL-2026-0204',
    title: 'Legal Order - Interim Injunction',
    category: 'Legal Order',
    contentType: 'Document',
    fileFormat: 'PDF',
    fileName: 'legal-order-interim-injunction.pdf',
    sourceRef: 'DOC-CIV-0204-003',
    clearanceLevel: 3,
    tag: 'case_team',
    description: 'Interim judicial order governing preservation of the disputed property.',
    queryTerms: ['legal', 'order', 'interim', 'injunction', 'court']
  },
  {
    id: 'EVD-CIV-0204-004',
    caseId: 'CASE-CIVIL-2026-0204',
    title: 'Site Photographs - Property Condition',
    category: 'Evidence Media',
    contentType: 'Image',
    fileFormat: 'JPEG',
    fileName: 'site-photographs-property-condition.jpg',
    sourceRef: 'MEDIA-CIV-0204-004',
    clearanceLevel: 2,
    tag: 'public',
    description: 'Site photographs documenting the property condition at the time of review.',
    queryTerms: ['site', 'photographs', 'images', 'media', 'property']
  }
];

const CATEGORY_RULES = [
  { label: 'Aadhaar / Identity Evidence', patterns: ['aadhaar', 'adhar', 'identity', 'id card'] },
  { label: 'FIR / Seizure Report', patterns: ['fir', 'first information', 'seizure', 'report'] },
  { label: 'Witness Statement', patterns: ['witness', 'statement', 'deposition', 'eyewitness'] },
  { label: 'Police Investigation Report', patterns: ['police', 'investigation', 'investigative', 'trace'] },
  { label: 'Legal Order', patterns: ['legal', 'order', 'judicial', 'court', 'warrant', 'injunction'] },
  { label: 'Evidence Media', patterns: ['media', 'cctv', 'footage', 'video', 'audio', 'photo', 'image'] }
];

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'be', 'by', 'for', 'from', 'in', 'is', 'it',
  'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'were', 'with', 'all',
  'found', 'show', 'list', 'retrieve', 'query', 'search', 'what', 'who', 'how'
]);

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveCase(caseNumber) {
  const normalized = normalizeText(caseNumber);
  return CASE_INDEX.find((item) => (
    normalizeText(item.id) === normalized ||
    normalizeText(item.firNumber) === normalized
  ));
}

function parseQuery(query) {
  const normalized = normalizeText(query);
  const tokens = normalized.split(' ').filter((token) => (
    token.length > 1 && !STOP_WORDS.has(token)
  ));
  const hasAllIntent = /\b(all|every|list|show|retrieve|find)\b/.test(normalized);
  const hasAadhaarIntent = /\baadhaar\b|\badhar\b/.test(normalized);
  const categories = CATEGORY_RULES.filter((rule) => (
    rule.patterns.some((pattern) => normalized.includes(pattern))
  ));

  return {
    normalized,
    tokens,
    hasAllIntent,
    hasAadhaarIntent,
    categories
  };
}

function scoreEvidence(evidence, signals) {
  const haystack = normalizeText([
    evidence.title,
    evidence.category,
    evidence.description,
    evidence.fileName,
    evidence.contentType,
    evidence.queryTerms.join(' ')
  ].join(' '));
  let score = 0;

  signals.tokens.forEach((token) => {
    if (haystack.includes(token)) score += 3;
  });

  if (signals.hasAadhaarIntent && /aadhaar|adhar/.test(haystack)) score += 12;
  signals.categories.forEach((category) => {
    if (normalizeText(evidence.category).includes(normalizeText(category.label))) {
      score += 8;
    }
    category.patterns.forEach((pattern) => {
      if (haystack.includes(pattern)) score += 4;
    });
  });

  if (signals.hasAllIntent) score += 1;
  return score;
}

/**
 * Deterministic frontend retrieval. This is intentionally not semantic-vector search:
 * it joins the case and evidence indexes locally, scores evidence, and returns files.
 */
export function retrieveEvidence(query, caseNumber) {
  const caseRecord = resolveCase(caseNumber);
  const signals = parseQuery(query);
  const caseEvidence = EVIDENCE_INDEX.filter((evidence) => evidence.caseId === caseRecord?.id);
  const scoredEvidence = caseEvidence.map((evidence) => ({
    evidence,
    score: scoreEvidence(evidence, signals)
  }));
  const matches = scoredEvidence
    .filter(({ score }) => score > 0 || signals.tokens.length === 0)
    .sort((a, b) => b.score - a.score || a.evidence.id.localeCompare(b.evidence.id))
    .map(({ evidence }) => evidence);

  return {
    case: caseRecord,
    query,
    signals,
    matches,
    totalCaseEvidence: caseEvidence.length,
    matchedCount: matches.length
  };
}

/**
 * Compatibility wrapper for the existing prototype component. It remains local and
 * never invokes the real RAG API.
 */
export function performHardcodedRAGSearch(user, query, caseId = 'CASE-2026-8891') {
  const result = retrieveEvidence(query, caseId);
  const accessibleCount = result.matches.length;

  return {
    query,
    answer: '',
    citations: result.matches,
    chunksEvaluated: result.totalCaseEvidence,
    accessibleCount,
    securityFilteredCount: result.totalCaseEvidence - accessibleCount,
    evaluatedChunks: result.matches,
    evidence: result.matches,
    case: result.case,
    error: result.case ? null : 'Case number not found. Choose a case from the list.'
  };
}

function getEvidenceIcon(evidence) {
  if (evidence.contentType === 'Video') return <FileVideo className="w-5 h-5 text-violet-600" />;
  if (evidence.contentType === 'Audio') return <FileAudio className="w-5 h-5 text-fuchsia-600" />;
  if (evidence.contentType === 'Image') return <FileImage className="w-5 h-5 text-emerald-600" />;
  if (evidence.contentType === 'Document' && evidence.fileFormat === 'XLSX') {
    return <FileSpreadsheet className="w-5 h-5 text-sky-600" />;
  }
  return <FileText className="w-5 h-5 text-blue-600" />;
}

function EvidenceCard({ evidence }) {
  return (
    <article className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
            {getEvidenceIcon(evidence)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                {evidence.category}
              </span>
              <span className="text-[10px] font-mono text-slate-500">{evidence.contentType} / {evidence.fileFormat}</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm mt-2 leading-snug">{evidence.title}</h4>
          </div>
        </div>
        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5 flex-shrink-0">
          L{evidence.clearanceLevel}
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">{evidence.description}</p>

      <div className="border-t border-slate-100 pt-3 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">File:</span>
          <span className="font-mono text-slate-700">{evidence.fileName}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">Evidence ID:</span>
          <span className="font-mono text-slate-700">{evidence.id}</span>
          <span className="font-semibold text-slate-700 ml-1">Source:</span>
          <span className="font-mono text-slate-700">{evidence.sourceRef}</span>
        </div>
      </div>
    </article>
  );
}

export default function RAGAssistantPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('all the aadhaar found as evidence');
  const [caseId, setCaseId] = useState('CASE-2026-8891');
  const [ragResult, setRagResult] = useState(null);
  const [searchError, setSearchError] = useState(null);

  const handleSearch = (event) => {
    event.preventDefault();
    const result = retrieveEvidence(query, caseId);
    setRagResult(result);
    setSearchError(result.case ? null : 'Case number not found. Choose a case from the list.');
  };

  const runSampleQuery = (sampleQuery) => {
    setQuery(sampleQuery);
    setRagResult(retrieveEvidence(sampleQuery, caseId));
    setSearchError(null);
  };

  const sampleQueries = [
    'all the aadhaar found as evidence',
    'witness statements',
    'FIRs and reports',
    'police investigation reports',
    'legal orders',
    'all media evidence'
  ];

  const result = ragResult;
  const activeCase = result?.case;
  const categories = [...new Set(result?.matches.map((item) => item.category) || [])];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1">
            <Database className="w-4 h-4" />
            Frontend-only evidence retrieval prototype
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Case Evidence Search</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-3xl">
            Enter a natural-language query and case number. The prototype joins the local case index
            to the local file/media index through caseId, then returns the matching evidence set.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            No backend call
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
            <Lock className="w-3.5 h-3.5" />
            Deterministic local matching
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_15rem] gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="e.g. all the aadhaar found as evidence"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="case-number" className="block text-xs font-semibold text-slate-600 mb-1">
                Case number
              </label>
              <select
                id="case-number"
                value={caseId}
                onChange={(event) => setCaseId(event.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CASE_INDEX.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id} · {item.type} · {item.firNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Search className="w-4 h-4" />
            Search Local Evidence
          </button>
        </form>

        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="text-[11px] font-semibold text-slate-500">Try a query:</div>
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sampleQuery) => (
              <button
                key={sampleQuery}
                type="button"
                onClick={() => runSampleQuery(sampleQuery)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition"
              >
                {sampleQuery}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-600" />
              Case foreign key: evidence.caseId → case.id
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-blue-600" />
              Results are files and media records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>Logged-in persona:</span>
            <strong className="text-blue-700 font-bold">{user?.name || 'Officer'}</strong>
            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold">
              {user?.role || 'POLICE_INVESTIGATOR'} (L{user?.clearanceLevel || 3})
            </span>
          </div>
        </div>
      </div>

      {searchError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{searchError}</span>
        </div>
      )}

      {result && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] text-slate-500">Case</div>
              <div className="font-bold text-slate-900 text-sm mt-1 truncate">{activeCase?.id || '—'}</div>
              <div className="text-[11px] text-slate-500 mt-1 truncate">{activeCase?.type} · {activeCase?.firNumber}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] text-slate-500">Query</div>
              <div className="font-bold text-slate-900 text-sm mt-1 line-clamp-2">{result.query}</div>
              <div className="text-[11px] text-slate-500 mt-1">Local matcher</div>
            </div>
            <div className="bg-white border border-emerald-200 rounded-xl p-4 bg-emerald-50/50">
              <div className="text-[11px] text-emerald-700">Matching evidence</div>
              <div className="font-bold text-emerald-800 text-2xl mt-1">{result.matchedCount}</div>
              <div className="text-[11px] text-emerald-700 mt-1">file / media records</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="text-[11px] text-slate-500">Categories returned</div>
              <div className="font-bold text-slate-900 text-sm mt-1 line-clamp-2">
                {categories.length ? categories.join(', ') : 'None'}
              </div>
            </div>
          </div>

          {result.case && result.matches.length > 0 && (
            <section>
              <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <SearchCheck className="w-4 h-4 text-blue-600" />
                    Matching evidence files
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Returned from the local evidence index for {activeCase?.id}. No AI summary is generated.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {result.totalCaseEvidence} records in case · {result.matchedCount} matched
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {result.matches.map((evidence) => (
                  <EvidenceCard key={evidence.id} evidence={evidence} />
                ))}
              </div>
            </section>
          )}

          {result.case && result.matches.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
              <FileQuestion className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-900 text-sm mt-3">No evidence matched this query</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try a broader query such as “all evidence”, “witness statements”, or “legal orders”.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
