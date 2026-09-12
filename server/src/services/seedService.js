import { dbService } from './dbService.js';
import { storageService } from './storageService.js';
import { ledgerService } from './ledgerService.js';
import { ragEngine } from './ragEngine.js';
import { signCanonicalManifest } from './cryptoService.js';

export function seedInitialData() {
  const currentDocs = dbService.readDB().documents || [];
  if (currentDocs.length > 0) {
    // Already seeded
    return;
  }

  console.log('[SeedService] Seeding initial legal documents into AES-256-GCM encrypted vault...');

  const initialDocuments = [
    {
      id: 'DOC-8891-001',
      title: 'First Information Report (FIR #00492/2026)',
      caseId: 'CASE-2026-8891',
      caseTitle: 'State vs. Cyber Syndicate (Financial Fraud & Homicide)',
      category: 'FIR',
      clearanceLevel: 2, // Confidential
      authorId: 'USR-POL-101',
      authorName: 'Inspector Vikram Sharma',
      authorRole: 'POLICE_INVESTIGATOR',
      department: 'LEO',
      dateCreated: '2026-08-14T02:45:00Z',
      version: '1.0',
      status: 'VERIFIED',
      extractedText: 'First Information Report under Section 154 CrPC.\n\nPolice received emergency call at 02:15 AM regarding armed intruders siphoning crypto keys at Tech Vault Facility, Cyber Park. Whistleblower Rajesh Kumar found deceased with gunshot wound near server room B4.\n\nAccused identified in preliminary CCTV as masked male suspect wearing tactical jacket, matching physical description of former sysadmin Sameer Verma (ID #SV-992). IPC Sections 302 (Murder), 392 (Robbery), and IT Act 66D applied.',
      chainOfCustody: [
        { action: 'CREATED_AND_FILED', actorName: 'Inspector Vikram Sharma', department: 'LEO', timestamp: '2026-08-14T02:45:00Z' },
        { action: 'SUBMITTED_TO_PROSECUTION', actorName: 'Inspector Vikram Sharma', department: 'PROS', timestamp: '2026-08-14T06:00:00Z' }
      ]
    },
    {
      id: 'DOC-8891-002',
      title: 'Forensic Ballistics & DNA Fingerprint Analysis',
      caseId: 'CASE-2026-8891',
      caseTitle: 'State vs. Cyber Syndicate (Financial Fraud & Homicide)',
      category: 'FORENSIC_REPORT',
      clearanceLevel: 3, // Secret
      authorId: 'USR-FOR-202',
      authorName: 'Dr. Sunita Rao',
      authorRole: 'FORENSIC_SPECIALIST',
      department: 'FOR',
      dateCreated: '2026-08-16T14:20:00Z',
      version: '1.0',
      status: 'SIGNED_PKI',
      extractedText: 'State Central Forensic Science Laboratory Report #FSL-9921/2026.\n\n9mm bullet casing recovered from crime scene matches test-firing profile of Glock-17 pistol (Serial #GL-88392) seized from suspect residence. Partial DNA profile on weapon safety catch matches suspect Sameer Verma with 99.98% probability.\n\nDigital forensics on seized hardware revealed encrypted cold wallet containing $4.2M siphoned funds transferred 18 minutes after incident. IP logs trace back to VPN server registered under suspect alias.',
      chainOfCustody: [
        { action: 'EXAMINED_AND_LOGGED', actorName: 'Dr. Sunita Rao', department: 'FOR', timestamp: '2026-08-16T14:20:00Z' },
        { action: 'PKI_SIGNATURE_STAMPED', actorName: 'Dr. Sunita Rao', department: 'FOR', timestamp: '2026-08-16T15:00:00Z' },
        { action: 'TRANSFERRED_TO_PROSECUTION', actorName: 'Dr. Sunita Rao', department: 'PROS', timestamp: '2026-09-01T11:30:00Z' }
      ]
    },
    {
      id: 'DOC-8891-003',
      title: 'Eyewitness Sworn Statement - Security Guard',
      caseId: 'CASE-2026-8891',
      caseTitle: 'State vs. Cyber Syndicate (Financial Fraud & Homicide)',
      category: 'WITNESS_STATEMENT',
      clearanceLevel: 2, // Confidential
      authorId: 'USR-POL-101',
      authorName: 'Inspector Vikram Sharma',
      authorRole: 'POLICE_INVESTIGATOR',
      department: 'LEO',
      dateCreated: '2026-08-15T09:10:00Z',
      version: '1.0',
      status: 'VERIFIED',
      extractedText: 'Sworn deposition taken at Special Crime Branch Station.\n\nWitness guard Ramesh Chand states he observed a black sedan fleeing facility gate at 02:22 AM. Driver had distinct scar on left cheek and was carrying a black pelican case.\n\nContact Details: Ramesh Chand, Phone: +91 98210-44910, Residing at House #42, Rosewood Lane, Green Park. Confidential Informant Ref: CI-9941-OMEGA.',
      chainOfCustody: [
        { action: 'DEPOSITION_RECORDED', actorName: 'Inspector Vikram Sharma', department: 'LEO', timestamp: '2026-08-15T09:10:00Z' }
      ]
    },
    {
      id: 'DOC-8891-004',
      title: 'Restricted Judicial Interception Order & Note',
      caseId: 'CASE-2026-8891',
      caseTitle: 'State vs. Cyber Syndicate (Financial Fraud & Homicide)',
      category: 'COURT_FILING',
      clearanceLevel: 4, // Top Secret
      authorId: 'USR-JUD-404',
      authorName: 'Justice P. K. Mukherjee',
      authorRole: 'JUDICIAL_MAGISTRATE',
      department: 'JUD',
      dateCreated: '2026-08-18T11:00:00Z',
      version: '1.0',
      status: 'SIGNED_PKI',
      extractedText: 'In the Special Sessions Court of Judicature.\n\nJudicial order authorizing confidential wiretap on secondary offshore communications of suspected accomplices. Disclosure strictly restricted to presiding Magistrate (Level 4) and Chief Auditor (Level 4). Any unauthorized access or leak will invoke contempt of court proceedings.',
      chainOfCustody: [
        { action: 'JUDICIAL_ORDER_ISSUED', actorName: 'Justice P. K. Mukherjee', department: 'JUD', timestamp: '2026-08-18T11:00:00Z' }
      ]
    }
  ];

  for (const docData of initialDocuments) {
    const rawBuffer = Buffer.from(docData.extractedText, 'utf8');
    
    // Save file to encrypted vault storage
    const storageRes = storageService.saveFileToVault(docData.id, rawBuffer);

    // Apply initial RSA PKI digital signature for Forensic Report & Court Order
    let signatureObj = null;
    if (docData.status === 'SIGNED_PKI') {
      const user = dbService.getUserWithPrivateKey(docData.authorId);
      if (user && user.privateKey) {
        const manifest = {
          docId: docData.id,
          title: docData.title,
          caseId: docData.caseId,
          payloadHash: storageRes.payloadHash,
          authorId: docData.authorId,
          timestamp: docData.dateCreated
        };
        const signatureBase64 = signCanonicalManifest(manifest, user.privateKey);
        signatureObj = {
          signedBy: user.name,
          signerRole: user.roleTitle,
          publicKeyPem: user.publicKey,
          signatureBase64,
          dateSigned: docData.dateCreated,
          manifest
        };
      }
    }

    const docRecord = {
      ...docData,
      payloadHash: storageRes.payloadHash,
      fileSize: storageRes.fileSize,
      encryptionMetadata: storageRes.encryptionMetadata,
      signature: signatureObj
    };

    // Save to Database
    dbService.saveDocumentMetadata(docRecord);

    // Register into RAG Engine
    ragEngine.addChunksFromDocument(docRecord);

    // Record Immutable Block on Ledger
    ledgerService.addBlock({
      action: 'DOCUMENT_UPLOADED',
      actorId: docData.authorId,
      actorName: docData.authorName,
      caseId: docData.caseId,
      docId: docData.id,
      docHash: storageRes.payloadHash,
      details: {
        title: docData.title,
        category: docData.category,
        clearanceLevel: docData.clearanceLevel,
        encryptionAlgorithm: storageRes.encryptionMetadata.algorithm
      }
    });
  }

  console.log('[SeedService] Successfully seeded 4 initial encrypted documents & blockchain blocks!');
}
