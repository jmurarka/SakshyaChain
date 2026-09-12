import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';
import { generateRSAKeyPair } from './cryptoService.js';

// Pre-generated RSA Key Pairs for Demo Users
const inspectorKeyPair = generateRSAKeyPair();
const prosecutorKeyPair = generateRSAKeyPair();
const judgeKeyPair = generateRSAKeyPair();
const forensicKeyPair = generateRSAKeyPair();
const auditorKeyPair = generateRSAKeyPair();

const INITIAL_DB = {
  users: [
    {
      id: 'USR-POL-101',
      name: 'Inspector Vikram Sharma',
      username: 'sharma_leo',
      role: 'POLICE_INVESTIGATOR',
      roleTitle: 'Chief Investigating Officer',
      department: 'LEO', // Law Enforcement Organization
      departmentName: 'Special Crime Branch - Central Police',
      clearanceLevel: 3, // 1: Unclassified, 2: Confidential, 3: Secret, 4: Top Secret
      publicKey: inspectorKeyPair.publicKey,
      privateKey: inspectorKeyPair.privateKey, // Encrypted/managed in server key store
      assignedCases: ['CASE-2026-8891', 'CASE-2026-4412', 'CASE-2026-1102']
    },
    {
      id: 'USR-FOR-202',
      name: 'Dr. Sunita Rao',
      username: 'drao_forensic',
      role: 'FORENSIC_SPECIALIST',
      roleTitle: 'Senior Forensic Analyst & Ballistics Expert',
      department: 'FOR',
      departmentName: 'State Central Forensic Science Laboratory',
      clearanceLevel: 3,
      publicKey: forensicKeyPair.publicKey,
      privateKey: forensicKeyPair.privateKey,
      assignedCases: ['CASE-2026-8891', 'CASE-2026-4412']
    },
    {
      id: 'USR-PRO-303',
      name: 'Advocate Rajesh Verma',
      username: 'verma_prosecutor',
      role: 'PUBLIC_PROSECUTOR',
      roleTitle: 'Senior Public Prosecutor',
      department: 'PROS',
      departmentName: 'Directorate of Prosecution - High Court Division',
      clearanceLevel: 3,
      publicKey: prosecutorKeyPair.publicKey,
      privateKey: prosecutorKeyPair.privateKey,
      assignedCases: ['CASE-2026-8891', 'CASE-2026-1102']
    },
    {
      id: 'USR-JUD-404',
      name: 'Justice P. K. Mukherjee',
      username: 'mukherjee_magistrate',
      role: 'JUDICIAL_MAGISTRATE',
      roleTitle: 'Special Sessions Court Magistrate',
      department: 'JUD',
      departmentName: 'High Court of Judicature / Sessions Court',
      clearanceLevel: 4,
      publicKey: judgeKeyPair.publicKey,
      privateKey: judgeKeyPair.privateKey,
      assignedCases: ['CASE-2026-8891', 'CASE-2026-4412', 'CASE-2026-1102']
    },
    {
      id: 'USR-AUD-505',
      name: 'Anil Gupta',
      username: 'gupta_auditor',
      role: 'COMPLIANCE_AUDITOR',
      roleTitle: 'Principal Information Security Auditor',
      department: 'AUD',
      departmentName: 'National Digital Evidence & Judicial Oversight Board',
      clearanceLevel: 4,
      publicKey: auditorKeyPair.publicKey,
      privateKey: auditorKeyPair.privateKey,
      assignedCases: ['CASE-2026-8891', 'CASE-2026-4412', 'CASE-2026-1102']
    }
  ],
  cases: [
    {
      id: 'CASE-2026-8891',
      title: 'State vs. Cyber Syndicate (Financial Fraud & Homicide)',
      firNumber: 'FIR-2026-00492',
      status: 'UNDER_TRIAL',
      leadInvestigator: 'Inspector Vikram Sharma',
      prosecutor: 'Advocate Rajesh Verma',
      presidingJudge: 'Justice P. K. Mukherjee',
      dateFiled: '2026-08-14',
      description: 'Multi-million financial crypto siphoning with linked homicide of key whistleblower witness.',
      clearanceRequired: 3,
      departmentsAccess: ['LEO', 'FOR', 'PROS', 'JUD', 'AUD']
    },
    {
      id: 'CASE-2026-4412',
      title: 'State Narcotics Operation - Seizure & Ballistics Case',
      firNumber: 'FIR-2026-00311',
      status: 'INVESTIGATION_IN_PROGRESS',
      leadInvestigator: 'Inspector Vikram Sharma',
      prosecutor: 'Advocate Rajesh Verma',
      presidingJudge: 'Justice P. K. Mukherjee',
      dateFiled: '2026-07-22',
      description: 'Illegal firearms trafficking ring and seizure of prohibited contraband.',
      clearanceRequired: 3,
      departmentsAccess: ['LEO', 'FOR', 'PROS', 'JUD', 'AUD']
    },
    {
      id: 'CASE-2026-1102',
      title: 'Commercial Complex Armed Robbery & Heist',
      firNumber: 'FIR-2026-00108',
      status: 'CHARGE_SHEET_FILED',
      leadInvestigator: 'Inspector Vikram Sharma',
      prosecutor: 'Advocate Rajesh Verma',
      presidingJudge: 'Justice P. K. Mukherjee',
      dateFiled: '2026-05-10',
      description: 'Armed burglary at Central Tech Vault, recovery of forensic fingerprints and stolen bonds.',
      clearanceRequired: 2,
      departmentsAccess: ['LEO', 'PROS', 'JUD', 'AUD']
    }
  ],
  documents: [], // Managed by storageService + dbService
  transferRequests: [
    {
      id: 'TRF-9001',
      caseId: 'CASE-2026-8891',
      documentId: 'DOC-8891-002',
      documentTitle: 'Forensic Ballistics & DNA Fingerprint Analysis',
      requestedBy: 'USR-PRO-303',
      requestedByName: 'Advocate Rajesh Verma',
      fromDepartment: 'FOR',
      toDepartment: 'PROS',
      status: 'APPROVED',
      dateRequested: '2026-09-01T10:15:00Z',
      dateApproved: '2026-09-01T11:30:00Z',
      approvedBy: 'USR-FOR-202'
    }
  ]
};

class DBService {
  constructor() {
    this.dbPath = CONFIG.DB_FILE;
    this.init();
  }

  init() {
    if (!fs.existsSync(CONFIG.DATA_DIR)) {
      fs.mkdirSync(CONFIG.DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CONFIG.VAULT_DIR)) {
      fs.mkdirSync(CONFIG.VAULT_DIR, { recursive: true });
    }
    if (!fs.existsSync(this.dbPath)) {
      this.writeDB(INITIAL_DB);
    }
  }

  readDB() {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf8');
      const db = JSON.parse(data);
      if (!db.manifests) db.manifests = [];
      if (!db.revocations) db.revocations = [];
      if (!db.transferRequests) db.transferRequests = [];
      return db;
    } catch (err) {
      return INITIAL_DB;
    }
  }

  writeDB(data) {
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf8');
  }

  getUserById(userId) {
    const db = this.readDB();
    return db.users.find(u => u.id === userId);
  }

  getUserByUsername(username) {
    const db = this.readDB();
    return db.users.find(u => u.username === username);
  }

  getAllUsers() {
    const db = this.readDB();
    // Exclude private keys from listing endpoints
    return db.users.map(({ privateKey, ...rest }) => rest);
  }

  getUserWithPrivateKey(userId) {
    const db = this.readDB();
    return db.users.find(u => u.id === userId);
  }

  getCasesForUser(user) {
    const db = this.readDB();
    return db.cases.filter(c => {
      // Must satisfy clearance and department or case assignment
      const clearanceOK = user.clearanceLevel >= c.clearanceRequired;
      const deptOK = c.departmentsAccess.includes(user.department);
      const assignedOK = user.assignedCases.includes(c.id);
      return clearanceOK && (deptOK || assignedOK);
    });
  }

  getDocumentsForUser(user, filters = {}) {
    const db = this.readDB();
    let docs = db.documents;

    // Server-Side Clearance Level Filtering (Strict ABAC enforcement)
    docs = docs.filter(d => user.clearanceLevel >= d.clearanceLevel);

    // Case access check
    docs = docs.filter(d => {
      const parentCase = db.cases.find(c => c.id === d.caseId);
      if (!parentCase) return false;
      return parentCase.departmentsAccess.includes(user.department) || user.assignedCases.includes(d.caseId);
    });

    if (filters.caseId) {
      docs = docs.filter(d => d.caseId === filters.caseId);
    }
    if (filters.category) {
      docs = docs.filter(d => d.category === filters.category);
    }

    return docs;
  }

  getDocumentById(docId) {
    const db = this.readDB();
    return db.documents.find(d => d.id === docId);
  }

  saveDocumentMetadata(docObj) {
    const db = this.readDB();
    const existingIndex = db.documents.findIndex(d => d.id === docObj.id);
    if (existingIndex >= 0) {
      db.documents[existingIndex] = docObj;
    } else {
      db.documents.push(docObj);
    }
    this.writeDB(db);
  }

  getTransferRequests() {
    const db = this.readDB();
    return db.transferRequests;
  }

  createTransferRequest(requestObj) {
    const db = this.readDB();
    db.transferRequests.push(requestObj);
    this.writeDB(db);
    return requestObj;
  }

  // ---- Digital Signature Manifest & Revocation Storage ----

  getManifest(manifestId) {
    const db = this.readDB();
    return (db.manifests || []).find(m => m.manifestId === manifestId) || null;
  }

  getManifestsForDocument(documentId) {
    const db = this.readDB();
    return (db.manifests || []).filter(m => m.documentId === documentId);
  }

  saveManifest(manifestRecord) {
    const db = this.readDB();
    if (!db.manifests) db.manifests = [];
    const idx = db.manifests.findIndex(m => m.manifestId === manifestRecord.manifestId);
    if (idx >= 0) {
      db.manifests[idx] = manifestRecord;
    } else {
      db.manifests.push(manifestRecord);
    }
    this.writeDB(db);
    return manifestRecord;
  }

  getRevocation(signatureId) {
    const db = this.readDB();
    return (db.revocations || []).find(r => r.signatureId === signatureId) || null;
  }

  saveRevocation(revocationObj) {
    const db = this.readDB();
    if (!db.revocations) db.revocations = [];
    const idx = db.revocations.findIndex(r => r.signatureId === revocationObj.signatureId);
    if (idx >= 0) {
      db.revocations[idx] = revocationObj;
    } else {
      db.revocations.push(revocationObj);
    }
    this.writeDB(db);
    return revocationObj;
  }
}

export const dbService = new DBService();
