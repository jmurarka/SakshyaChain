# Implementation Plan: SākshyaChain — Secure Digital Document Management System (Legal & Investigation DMS)

An enterprise-grade, full-stack, server-enforced, tamper-evident Digital Document Management System (DMS) for law enforcement agencies, judiciary, prosecutors, and forensic teams.

---

## 1. Architecture Overview: Full-Stack Server-Side Security

To fulfill the strict requirements of data integrity, non-repudiation, zero-trust authorization, and legal compliance, SākshyaChain uses a **Node.js Express REST API backend** coupled with a **React + Vite Frontend**. 

All security guarantees (access control, cryptographic hashing, file encryption, digital signatures, audit logs, and AI RAG searches) are **enforced server-side**. The frontend communicates via authenticated JSON APIs and Bearer JWT tokens.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 REACT + VITE FRONTEND                                  │
│  - Multi-User Login & Auth Context (JWT Session)                                       │
│  - Vault Dashboard & Document Manager                                                  │
│  - Live RAG AI Search Interface with Evidence Citations                                │
│  - PKI Digital Signing & Verification Center                                           │
│  - Interactive Blockchain / Immutable Audit Ledger Explorer                            │
│  - Visual PII Redactor & Evidence Chain of Custody Timeline                            │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ REST API / JWT Authentication
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                              NODE.JS EXPRESS BACKEND SERVER                            │
│                                                                                        │
│ ┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐  │
│ │   RBAC / ABAC Authorization Guard    │     │  Cryptographic Engine & KMS (Crypto) │  │
│ │ - Checks JWT Role, Clearance, Dept   │     │ - AES-256-GCM DEK/KEK Encryption     │  │
│ │ - Case-Level Assignment Matrix       │     │ - RSA-2048 PKI Signature Verification│  │
│ └──────────────────────────────────────┘     └──────────────────────────────────────┘  │
│ ┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐  │
│ │  Append-Only Cryptographic Ledger    │     │   Permission-Aware RAG AI Engine    │  │
│ │ - Chained SHA-256 Block Hashing      │     │ - Vector/TF-IDF Chunk Indexing       │  │
│ │ - Server-Side Integrity Verifier     │     │ - Clearance-Filtered RAG Citations   │  │
│ └──────────────────────────────────────┘     └──────────────────────────────────────┘  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
        ┌───────────────────────────────────┴───────────────────────────────────┐
        │                                                                       │
┌───────▼──────────────────────────┐                         ┌──────────────────▼───────────────┐
│     ENCRYPTED FILE VAULT         │                         │   METADATA & LEDGER DATABASE     │
│ - AES-256-GCM Ciphertext Storage │                         │ - SQLite / JSON File DB           │
│ - Verified SHA-256 Hash Digests  │                         │ - Cryptographic Audit Chaining   │
└──────────────────────────────────┘                         └──────────────────────────────────┘
```

---

## 2. Server-Enforced Security & Core System Specifications

### A. Real Server-Side RBAC & ABAC Engine
- **Auth Middleware**: `authenticateToken` parses JWTs containing user ID, role, clearance level, and assigned department.
- **ABAC Policy Matrix**:
  - `Clearance Levels`: Unclassified (1), Confidential (2), Secret (3), Top Secret (4).
  - `Departments`: Police / Law Enforcement (LEO), Prosecution (PROS), Judiciary (JUD), Forensics (FOR), System Audit (AUD).
  - `Case-Level Access`: Strict verification if the user belongs to the assigned department or is an assigned magistrate/investigator for the target `caseId`.
- Server denies request with HTTP 403 Forbidden **before any document payload or metadata is read from disk/DB**.

### B. AES-256-GCM Envelope Encryption at Rest
- **KMS / Master Key (KEK)**: Server maintains a Key Encryption Key stored in server environment configuration.
- **Per-Document DEK (Data Encryption Key)**: Random 256-bit key generated per file via `crypto.randomBytes(32)`.
- **GCM Authentication Tag**: Prevents bit-flipping and payload tampering at rest.
- **Server Vault Storage**: Raw files are written to server storage only in AES-256-GCM encrypted format (`.enc`). Server decrypts stream only for authorized HTTP downloads.

### C. Cryptographically Chained Append-Only Ledger & Tamper Audit API
- **Block Chaining Math**: Each audit block contains:
  ```json
  {
    "blockHeight": 104,
    "timestamp": "2026-09-11T12:25:00.000Z",
    "action": "DOCUMENT_SIGNED",
    "actorId": "USER-102",
    "caseId": "CASE-2026-8891",
    "docId": "DOC-7721",
    "docHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "previousBlockHash": "0000a4f3...92b1",
    "blockHash": "00007b89...11c4"
  }
  ```
- **Integrity Verification API (`GET /api/audit/verify`)**: Server iterates through the entire chain from Genesis block, re-computes `blockHash` for each block, and computes the actual disk file SHA-256 hash vs recorded `docHash`. If any block or file on disk was modified out-of-band, it returns a detailed diagnostic break report (`{ status: "TAMPER_DETECTED", brokenBlock: 104, details: "SHA-256 mismatch" }`).

### D. Server-Side PKI Digital Signature Module
- **RSA-2048 / ECDSA Key Pairs**: Server generates or receives public/private keys for legal actors (Magistrates, Forensic Officers, Police Chiefs).
- **Canonical Manifest Signing**: Creates a deterministic canonical JSON manifest of the document (Doc ID, Title, Case ID, Payload SHA-256, Timestamp, Author ID) and signs it using the private key.
- **Verification Endpoint (`POST /api/documents/:id/verify-signature`)**: Server checks the detached `.sig` file against the public key and manifest hash.

### E. Permission-Aware RAG AI Engine with Evidence Citations
- **Document Chunking & Indexing**: Server splits authorized document text into semantic chunks tagged with `caseId`, `docId`, `docTitle`, `pageNumber`, `paragraphIndex`, and required `clearanceLevel`.
- **RAG Query Endpoint (`POST /api/ai/rag-search`)**:
  1. Filters vector/text index by requester's JWT clearance level & department **first**.
  2. Computes semantic relevance / cosine similarity against query.
  3. Returns synthesized answer with exact **Evidence Citations**:
     > *"Forensic report confirms 9mm ballistics match with weapon recovered at site [Doc #FOR-2026-09, Page 2, Para 3]. Witness statement contradicts suspect timeline [Doc #WIT-2026-12, Page 1, Para 4]."*

### F. Multi-User Collaboration & Chain of Custody
- Pre-seeded realistic users representing different entities:
  - `Inspector Sharma` (Police / LEO - Clearance Level 3)
  - `Dr. Sunita Rao` (Forensic Lab Chief - Clearance Level 3)
  - `Prosecutor Rajesh Verma` (Public Prosecutor - Clearance Level 3)
  - `Justice P. K. Mukherjee` (Judicial Magistrate - Clearance Level 4)
  - `Auditor Anil Gupta` (Security & Compliance Auditor - Clearance Level 4)
- **Chain of Custody Timeline**: Tracks every transfer, access request, sign-off, and view event chronologically.

---

## 3. Technology Stack & Repository Structure

```
c:\Users\jhanv\Desktop\hh
├── package.json               # Root scripts (starts concurrent backend + frontend)
├── server/                    # Node.js Express REST API Backend
│   ├── package.json
│   ├── src/
│   │   ├── server.js          # Express app entry point & server setup
│   │   ├── config.js          # KMS Keys, JWT secret, server paths
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT verification, RBAC/ABAC authorization middleware
│   │   ├── services/
│   │   │   ├── cryptoService.js   # AES-256-GCM, SHA-256, RSA PKI signatures
│   │   │   ├── ledgerService.js   # Cryptographic append-only chain builder & validator
│   │   │   ├── storageService.js  # Server vault file store (encrypted at rest)
│   │   │   ├── ragEngine.js       # Permission-aware chunk indexer & citation search
│   │   │   └── dbService.js       # Persistent JSON/SQLite metadata store
│   │   └── routes/
│   │       ├── authRoutes.js      # Login, session status, user profile
│   │       ├── documentRoutes.js  # Upload, download (decrypted stream), list, versioning
│   │       ├── signatureRoutes.js # PKI signature creation & verification
│   │       ├── auditRoutes.js     # Blockchain explorer & 1-click integrity scanner API
│   │       ├── aiRoutes.js        # RAG search with citations, auto-summary, NER, redaction
│   │       └── caseRoutes.js      # Case management, department transfer requests
│   └── data/                  # Storage directories created at startup
│       ├── db.json            # Database store
│       ├── ledger.json        # Cryptographic chain blocks
│       └── vault/             # Encrypted AES-256-GCM files (.enc)
└── client/                    # Vite + React Frontend
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css          # Premium Dark Mode Security System CSS
        ├── context/
        │   └── AuthContext.jsx # Manages active JWT token & user session state
        ├── services/
        │   └── api.js         # Axios / Fetch client calling http://localhost:5000/api
        └── components/
            ├── Navbar.jsx              # Navigation, user profile status, API connection indicator
            ├── UserSwitcherModal.jsx   # Switch real backend user credentials (JWT re-authentication)
            ├── DocumentVault.jsx       # Document list, upload modal, version history
            ├── DocumentViewerModal.jsx # Preview, metadata, chain of custody, digital signature status
            ├── RAGAssistant.jsx        # Permission-aware AI Search & Evidence Citation engine
            ├── BlockchainLedger.jsx    # Interactive audit ledger & 1-click server tamper audit
            ├── DigitalSignerModal.jsx  # PKI signing interface & manifest inspector
            ├── RedactorModal.jsx       # Interactive PII visual redaction tool
            └── AuditDashboard.jsx      # System compliance metrics & transfer request manager
```

---

## 4. Implementation Steps

### Phase 1: Full-Stack Project Setup & Dependencies Ingestion
1. Initialize root `package.json` with scripts (`npm run dev:all`, `npm run dev:server`, `npm run dev:client`).
2. Create `server/` with `express`, `cors`, `jsonwebtoken`, `multer`, `dotenv`, `uuid`.
3. Create `client/` using Vite + React with `lucide-react`.

### Phase 2: Express Backend Core Services Implementation
1. **`cryptoService.js`**:
   - `encryptFile(buffer, dek)` -> returns `{ ciphertext, iv, authTag }` using `crypto.createCipheriv('aes-256-gcm', dek, iv)`.
   - `decryptFile(ciphertext, dek, iv, authTag)` -> returns decrypted buffer.
   - `computeSHA256(buffer)` -> returns hex string.
   - `generateKeyPair()` -> returns RSA 2048 public & private PEM strings.
   - `signManifest(manifestJson, privateKey)` -> returns base64 signature.
   - `verifySignature(manifestJson, signature, publicKey)` -> returns boolean.
2. **`ledgerService.js`**:
   - Maintains append-only list of blocks in `ledger.json`.
   - Computes `blockHash = SHA256(height + prevHash + timestamp + payloadHash + action + actorId)`.
   - `verifyChainIntegrity()` checks every link + compares disk file hashes against ledger hashes.
3. **`dbService.js`**:
   - Pre-seeds users (Police, Prosecutor, Judge, Forensic, Auditor) with hashed passwords & JWT tokens.
   - Seeds mock legal cases (`CASE-2026-8891`: Armed Robbery & Homicide, `CASE-2026-4412`: Cyber Forensic Fraud).
   - Seeds initial sample documents (FIR, Ballistics Report, Witness Statement, Charge Sheet).

### Phase 3: Express API Routes & Auth Enforcement
1. `auth.js` middleware: Parses `Authorization: Bearer <token>`, rejects invalid JWTs, enforces route permissions.
2. `documentRoutes.js`:
   - `GET /api/documents`: Applies RBAC clearance filter & case access matrix.
   - `POST /api/documents/upload`: Computes hash, encrypts AES-256-GCM, saves to server `vault/`, appends block to ledger.
   - `GET /api/documents/:id/download`: Verifies clearance, decrypts file, streams download.
3. `auditRoutes.js`:
   - `GET /api/audit/blocks`: Returns block chain.
   - `POST /api/audit/tamper-test`: Simulates out-of-band byte alteration on disk file for demo/verification.
   - `GET /api/audit/verify`: Runs server-side cryptographic audit.
4. `aiRoutes.js`:
   - `POST /api/ai/rag-search`: Performs clearance-scoped RAG search returning chunks with citations `[Doc ID, Page, Para]`.

### Phase 4: React + Vite Frontend Development
1. **Design System & Styling (`index.css`)**:
   - Deep slate & navy background (`#0b0f19`, `#111827`).
   - Glowing indicators for Cryptographic Integrity (Emerald Green = Verified, Amber = Pending, Crimson = Tampered/Alert).
   - Micro-animations for block mining, key pair generation, and RAG search loading.
2. **Components Integration**:
   - Real authentication flow with standard user profiles switcher (forces real JWT token re-issue from backend).
   - Document Vault with real server file upload and encrypted streaming download.
   - Live RAG search tab showing cited evidence cards linked to actual vault files.
   - Blockchain Explorer showing block hashes with 1-click "Run Cryptographic Integrity Check" button that calls `/api/audit/verify`.
   - PKI Digital Signer calling `/api/documents/:id/sign`.

---

## 5. Verification & Testing Plan

### Automated Verification
1. **Express Backend API Test Suite**:
   - Test unauthorized request without Bearer token -> expect `401 Unauthorized`.
   - Test low clearance user (Clearance 1) requesting Top Secret document (Clearance 4) -> expect `403 Forbidden`.
   - Test file upload -> verify disk file in `server/data/vault/` is encrypted AES-256-GCM binary.
   - Test PKI signature -> verify signature validator returns `true` for valid signature and `false` if manifest payload is tampered.
   - Test `npm run build` in client directory -> verify clean compilation.

### Manual & Interactive Verification
1. **Multi-Persona Access Control Test**:
   - Log in as `Inspector Sharma` (Police). Confirm access to FIRs and police reports.
   - Attempt to access Restricted Judicial Notes -> Server denies access with explicit error.
   - Switch to `Justice P. K. Mukherjee` (Judge). Confirm full top-secret access.
2. **RAG AI Search with Citations Test**:
   - Query "What evidence connects the suspect to the crime scene?"
   - Verify the AI RAG engine searches authorized files and presents explicit document citations (`[Doc #FOR-2026-09, Page 2, Para 3]`).
3. **Cryptographic Tamper Audit Test**:
   - Click "Run Cryptographic Audit" -> System reports 100% Chain Integrity Verified.
   - Click "Simulate Server Storage Tampering" (calls API to modify 1 byte in an encrypted storage file).
   - Re-run "Cryptographic Audit" -> Server audit scanner catches hash mismatch on Block #X and flags the tampered file immediately with a crimson warning badge.
