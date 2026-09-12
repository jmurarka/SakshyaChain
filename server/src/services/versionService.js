import { dbService } from './dbService.js';
import { storageService } from './storageService.js';
import { ledgerService } from './ledgerService.js';
import { ragEngine } from './ragEngine.js';

class VersionService {
  /**
   * Adds a new revision/version to an existing legal document
   */
  addDocumentVersion({ docId, newTextContent, changeNotes, isMajorVersion = false, authorUser }) {
    const doc = dbService.getDocumentById(docId);
    if (!doc) throw new Error('Document not found');

    const previousVersion = doc.version || '1.0';
    const previousPayloadHash = doc.payloadHash;

    // Calculate new version string (e.g. 1.0 -> 1.1 or 2.0)
    const parts = previousVersion.split('.').map(Number);
    let newVersionStr = '';
    if (isMajorVersion) {
      newVersionStr = `${parts[0] + 1}.0`;
    } else {
      newVersionStr = `${parts[0]}.${parts[1] + 1}`;
    }

    const versionFileId = `${docId}_v${newVersionStr.replace('.', '_')}`;
    const newBuffer = Buffer.from(newTextContent, 'utf8');

    // AES-256-GCM Envelope Encryption for new version payload
    const storageRes = storageService.saveFileToVault(versionFileId, newBuffer);

    const versionRecord = {
      version: newVersionStr,
      fileId: versionFileId,
      parentVersion: previousVersion,
      parentPayloadHash: previousPayloadHash,
      payloadHash: storageRes.payloadHash,
      fileSize: storageRes.fileSize,
      authorId: authorUser.id,
      authorName: authorUser.name,
      department: authorUser.department,
      dateCreated: new Date().toISOString(),
      changeNotes: changeNotes || 'Document revised and updated.',
      encryptionMetadata: storageRes.encryptionMetadata
    };

    if (!doc.versionHistory) {
      doc.versionHistory = [
        {
          version: previousVersion,
          fileId: doc.id,
          parentVersion: 'GENESIS',
          parentPayloadHash: '0'.repeat(64),
          payloadHash: previousPayloadHash,
          fileSize: doc.fileSize,
          authorId: doc.authorId,
          authorName: doc.authorName,
          department: doc.department,
          dateCreated: doc.dateCreated,
          changeNotes: 'Initial document filing (v1.0)'
        }
      ];
    }

    doc.versionHistory.push(versionRecord);
    doc.version = newVersionStr;
    doc.currentFileId = versionFileId; // Links exact encrypted file on disk
    doc.payloadHash = storageRes.payloadHash;
    doc.extractedText = newTextContent;
    doc.encryptionMetadata = storageRes.encryptionMetadata;

    doc.chainOfCustody.push({
      action: `REVISION_ADDED (${previousVersion} -> ${newVersionStr})`,
      actorName: authorUser.name,
      department: authorUser.department,
      timestamp: versionRecord.dateCreated
    });

    // Save to Database
    dbService.saveDocumentMetadata(doc);

    // Update RAG Engine
    ragEngine.addChunksFromDocument(doc);

    // Record on Blockchain Audit DAG
    const block = ledgerService.addBlock({
      action: 'DOCUMENT_VERSION_CREATED',
      actorId: authorUser.id,
      actorName: authorUser.name,
      caseId: doc.caseId,
      docId: doc.id,
      docHash: storageRes.payloadHash,
      details: {
        previousVersion,
        newVersion: newVersionStr,
        fileId: versionFileId,
        parentHash: previousPayloadHash,
        changeNotes
      }
    });

    return { document: doc, versionRecord, ledgerBlock: block };
  }
}

export const versionService = new VersionService();
