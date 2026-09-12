import crypto from 'crypto';
import { dbService } from './dbService.js';
import { storageService } from './storageService.js';
import { ledgerService } from './ledgerService.js';

// In-Memory store for controlled share links (shareToken -> shareRecord)
const shareLinksStore = new Map();

class SharingService {
  createControlledShareLink({ docId, recipientEmail, expiresAtHours = 24, createdByUser }) {
    const doc = dbService.getDocumentById(docId);
    if (!doc) throw new Error('Document not found');

    const shareToken = `SHARE-${crypto.randomBytes(16).toString('hex')}`;
    const accessOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAtMs = Date.now() + expiresAtHours * 60 * 60 * 1000;

    const shareRecord = {
      shareToken,
      docId,
      docTitle: doc.title,
      caseId: doc.caseId,
      recipientEmail,
      accessOTP, // Provided to caller to copy/send
      createdById: createdByUser.id,
      createdByName: createdByUser.name,
      policy: 'VIEW_ONLY_NO_DOWNLOAD',
      expiresAt: new Date(expiresAtMs).toISOString(),
      expiresAtMs,
      accessedCount: 0
    };

    shareLinksStore.set(shareToken, shareRecord);

    // Audit Logging
    ledgerService.addBlock({
      action: 'CONTROLLED_LINK_CREATED',
      actorId: createdByUser.id,
      actorName: createdByUser.name,
      caseId: doc.caseId,
      docId: doc.id,
      docHash: doc.payloadHash,
      details: { recipientEmail, policy: 'VIEW_ONLY_NO_DOWNLOAD', expiresAtHours }
    });

    return shareRecord;
  }

  verifyShareOTPAndGetContent({ shareToken, otp }) {
    const shareRecord = shareLinksStore.get(shareToken);
    if (!shareRecord) throw new Error('Share link invalid or expired');

    if (Date.now() > shareRecord.expiresAtMs) {
      shareLinksStore.delete(shareToken);
      throw new Error('Share link has expired');
    }

    if (shareRecord.accessOTP !== otp.toString().trim()) {
      throw new Error('Invalid OTP security code');
    }

    shareRecord.accessedCount += 1;
    shareLinksStore.set(shareToken, shareRecord);

    const doc = dbService.getDocumentById(shareRecord.docId);
    const decryptedBuffer = storageService.readFileFromVault(doc.id, doc.encryptionMetadata);

    // Audit Logging
    ledgerService.addBlock({
      action: 'CONTROLLED_LINK_ACCESSED',
      actorId: 'RECIPIENT_GUEST',
      actorName: shareRecord.recipientEmail,
      caseId: doc.caseId,
      docId: doc.id,
      docHash: doc.payloadHash,
      details: { shareToken, policy: shareRecord.policy }
    });

    return {
      docTitle: doc.title,
      caseId: doc.caseId,
      policy: shareRecord.policy,
      content: decryptedBuffer.toString('utf8')
    };
  }

  getShareRecord(shareToken) {
    return shareLinksStore.get(shareToken);
  }
}

export const sharingService = new SharingService();
