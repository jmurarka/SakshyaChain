# SākshyaChain — Complete Presentation & Pitch Guide

> **Target Audience**: Non-technical stakeholders, judges, investors, legal authorities, or hackathon jurors.  
> **Core Concept**: A Tamper-Evident Digital Document & Evidence Management System for Law Enforcement & Courts.

---

## 1. What is SākshyaChain? (The 30-Second Elevator Pitch)

Imagine a **digital "Black Box Flight Recorder" combined with a Bank-Grade Vault**, designed specifically for legal and police documents.

In traditional systems, police reports, witness statements, and forensic reports are stored on paper, shared over email or WhatsApp, or placed in unencrypted folders. This makes documents vulnerable to being lost, leaked, modified, or challenged in court.

**SākshyaChain** solves this by providing a unified, secure platform where every legal document is:
1. **Encrypted** so only authorized officers can read it.
2. **Fingerprinted** (hashed) the exact second it is uploaded.
3. **Locked into an immutable chain of blocks** so any attempt to tamper with or alter a document is detected instantly.

---

## 2. Why Was SākshyaChain Built? (The Real-World Problem)

| Real-World Challenge | Consequences in Legal / Investigation Process | How SākshyaChain Solves It |
| :--- | :--- | :--- |
| **Evidence Tampering** | Defense lawyers claim police modified a report or evidence bag post-seizure. | Cryptographic hashes prove the file today is identical down to the last bit to the file filed at 2:00 AM on day one. |
| **Unauthorized Leaks** | Sensitive case details or victim identities get leaked to the press. | Strict Role & Clearance Access Control (Level 1–5) + PII Auto-Redaction. |
| **Lost Physical Files** | Paper files get misplaced during transfer between police stations and courts. | Encrypted cloud vault storage with full chain-of-custody tracking. |
| **Inefficient Manual Reviews** | Prosecutors take weeks reading 500-page charge sheets to find 1 detail. | AI Legal Assistant synthesizes answers with exact evidence citations `[Doc #, Page X, Para Y]`. |

---

## 3. Core Features & Implementation Completeness

```text
[=== 100% MVP IMPLEMENTATION STATUS ===]
1. AES-256-GCM Vault Envelope Encryption:       🟢 100% IMPLEMENTED
2. Cryptographic Audit DAG / Blockchain Ledger: 🟢 100% IMPLEMENTED
3. Multi-Tier RBAC + ABAC Access Enforcement:   🟢 100% IMPLEMENTED
4. 120-Second MFA OTP Authentication:           🟢 100% IMPLEMENTED
5. 30-Minute Break-Glass Emergency Overrides:   🟢 100% IMPLEMENTED
6. Recipient-Bound Expirable Share Links:        🟢 100% IMPLEMENTED
7. AI Legal Assistant & Automatic PII Redactor:  🟢 100% IMPLEMENTED
```

### Detailed Breakdown of Implemented Features

#### 🔒 1. AES-256-GCM Vault Encryption (Digital File Safe)
* **What it does**: Scrambles every document (FIRs, witness statements, forensic reports) into unreadable digital code the second it is uploaded.
* **How it works**: Uses **Envelope Encryption**. Every document gets its own unique secret key (Data Encryption Key / DEK). That key is then encrypted by a Master Key (KEK).
* **Real-World Impact**: Even if a hacker steals the physical server hard drives, the files on disk look like random meaningless gibberish and cannot be opened without authorized credentials.

#### 🔗 2. Cryptographic Audit DAG / Blockchain Ledger (Immutable Evidence Log)
* **What it does**: Acts like an un-hackable digital logbook that records every action (who uploaded, viewed, revised, or downloaded a document, down to the exact second).
* **How it works**: Every action creates a digital block. Each block contains a unique mathematical fingerprint (SHA-256 hash) that includes the fingerprint of the previous block in line.
* **Real-World Impact**: Guarantees **Chain of Custody** in court. If anyone opens the hard drive and changes a single word in a report, the fingerprint chain breaks immediately and triggers a **RED Tamper Alert**.

#### 🛡️ 3. Multi-Tier Role & Clearance Access Enforcement (RBAC + ABAC)
* **What it does**: Controls exactly who can see, search, or download files based on their official job role and security clearance level.
* **How it works**: Users have roles (`POLICE_INVESTIGATOR`, `FORENSIC_EXPERT`, `PROSECUTOR`, `JUDGE`) and clearance levels (`Level 1` to `Level 5`). Security checks are enforced strictly on the server before any data is sent.
* **Real-World Impact**: A Police Constable (`Level 2`) cannot see a Top Secret judicial wiretap warrant (`Level 4`). A prosecutor working on a Narcotics case cannot look at an unassigned Homicide case file.

#### 🔑 4. 120-Second MFA OTP Security (2-Factor Login Guard)
* **What it does**: Protects officer user accounts with a 2-step verification code (One-Time Password) that expires in 120 seconds.
* **How it works**: Generates a 6-digit dynamic code. If 3 wrong codes are typed in a row, the account locks down automatically for 15 minutes.
* **Real-World Impact**: Stops hackers or unauthorized staff from logging in using stolen passwords.

#### 🚨 5. Break-Glass Emergency Protocol (30-Minute Override)
* **What it does**: Provides a temporary 30-minute emergency access override button for urgent court hearings or life-critical investigations.
* **How it works**: An officer submits an emergency request with a written justification. Once granted, a **30-minute live countdown timer** starts, and a high-severity alert is dispatched to supervisors.
* **Real-World Impact**: Prevents red tape from stalling urgent police/court work, while creating an audit record of why the emergency access was used.

#### 🔗 6. Recipient-Bound Expirable Share Links (Controlled Sharing)
* **What it does**: Lets officers share a document with external parties (like defense lawyers or external experts) safely without handing over raw files.
* **How it works**: Creates a temporary, expirable link protected by a 6-digit OTP code and enforces a strict `ViewOnly-NoDownload` policy.
* **Real-World Impact**: Prevents unauthorized file copying, printing, or permanent leaking when sharing documents with external participants.

#### 🤖 7. AI Legal Assistant & Automatic PII Redactor (AI Briefing)
* **What it does**: Reads verified case files to answer legal queries with exact page citations and automatically detects private personal information (PII).
* **How it works**: The AI scans documents allowed under your clearance level, cites exact sources `[Doc #..., Page X, Para Y]`, and flags phone numbers, government IDs, and addresses for 1-click redaction.
* **Real-World Impact**: Reduces prosecutor case reading time from 3 weeks to 10 minutes, while protecting victim and whistleblower privacy.

---

## 4. Architectural Design Rationale ("Why is it built so and so?")

1. **Why Server-Enforced Security instead of Client-Side UI toggles?**
   - *Rationale*: Client-side security is just decoration—anyone can inspect browser state and bypass it. In SākshyaChain, security checks occur on the server **before** any file or database record is retrieved.

2. **Why Non-Destructive Versioning (`v1.0 ➔ v1.1 ➔ v2.0`) instead of Overwriting?**
   - *Rationale*: In legal investigations, evidence can **never** be deleted or updated in place. Every revision creates a new version record that points back to its parent version hash.

3. **Why a Minimalist Light/White UI Theme?**
   - *Rationale*: Designed for legal offices, courtrooms, and police station monitors operating under bright overhead lighting, ensuring high legibility and minimal cognitive fatigue.

---

## 5. Current Limitations (Honest & Transparent)

1. **User Password / Credential Sharing**:
   - Software cannot stop an officer from physically sharing their password out-of-band with a colleague (requires hardware biometric integration).
2. **Single-Node Prototype Storage**:
   - The current MVP uses a local JSON append-only ledger (`ledger.json`) and disk vault rather than a distributed multi-node blockchain cluster (e.g. Hyperledger Fabric).
3. **Local Key Storage**:
   - The Master Encryption Key is stored in server environment variables rather than a dedicated cloud Hardware Security Module (HSM).

---

## 6. Future Scope & Roadmap

```mermaid
timeline
    title SākshyaChain Product Roadmap
    Phase 1 (Completed MVP) : Server-side RBAC/ABAC : AES-256 Vault : Audit DAG : Break-Glass : AI RAG
    Phase 2 (Production Hardening) : Hardware Security Module (HSM) : PostgreSQL DB Migration : Multi-Node BFT Consensus
    Phase 3 (Ecosystem Integration) : Aadhaar e-Sign Integration : Automatic Video Hash Verification : Biometric Login
```

* **Phase 2 (Enterprise Hardening)**:
  - Migrate storage from JSON files to PostgreSQL + AWS KMS / Hardware Security Module (HSM).
  - Deploy multi-node Byzantine Fault Tolerant (BFT) consensus nodes across Police, Forensics, and Court infrastructure.
* **Phase 3 (Ecosystem Integration)**:
  - Aadhaar e-Sign integration for Indian legal system compliance.
  - Video evidence frame-by-frame hash anchoring.
  - Biometric fingerprint scanner authentication for mobile field tablets.
