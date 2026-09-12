import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';
import {
  generateDEK,
  encryptDEK,
  decryptDEK,
  encryptBufferAES256GCM,
  decryptBufferAES256GCM,
  computeSHA256
} from './cryptoService.js';
import { dbService } from './dbService.js';

class StorageService {
  constructor() {
    this.vaultDir = CONFIG.VAULT_DIR;
    this.init();
  }

  init() {
    if (!fs.existsSync(this.vaultDir)) {
      fs.mkdirSync(this.vaultDir, { recursive: true });
    }
  }

  getFilePath(fileId) {
    return path.join(this.vaultDir, `${fileId}.enc`);
  }

  /**
   * Encrypts and writes raw file buffer to disk at rest using AES-256-GCM Envelope Encryption
   */
  saveFileToVault(fileId, buffer) {
    const dek = generateDEK();
    const dekEncrypted = encryptDEK(dek, CONFIG.KMS_MASTER_KEY_HEX);
    const payloadEncrypted = encryptBufferAES256GCM(buffer, dek);

    const filePath = this.getFilePath(fileId);
    fs.writeFileSync(filePath, payloadEncrypted.ciphertext);

    return {
      payloadHash: payloadEncrypted.payloadHash,
      fileSize: buffer.length,
      encryptionMetadata: {
        algorithm: 'AES-256-GCM',
        kmsKeyId: 'KMS-MASTER-KEY-PROD-2026',
        encryptedDEK: dekEncrypted.encryptedDEK,
        dekIv: dekEncrypted.iv,
        dekAuthTag: dekEncrypted.authTag,
        payloadIv: payloadEncrypted.iv,
        payloadAuthTag: payloadEncrypted.authTag
      }
    };
  }

  /**
   * Reads and decrypts file buffer from vault for authorized user
   */
  readFileFromVault(docId, encryptionMetadata) {
    const doc = dbService.getDocumentById(docId);
    const targetFileId = (doc && doc.currentFileId) ? doc.currentFileId : docId;

    let filePath = this.getFilePath(targetFileId);
    if (!fs.existsSync(filePath)) {
      filePath = this.getFilePath(docId);
    }
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${docId} not found in vault storage.`);
    }

    const encryptedPayload = fs.readFileSync(filePath);

    // Decrypt DEK using Master KEK
    const dek = decryptDEK(
      encryptionMetadata.encryptedDEK,
      CONFIG.KMS_MASTER_KEY_HEX,
      encryptionMetadata.dekIv,
      encryptionMetadata.dekAuthTag
    );

    // Decrypt File Buffer using DEK
    const decryptedBuffer = decryptBufferAES256GCM(
      encryptedPayload,
      dek,
      encryptionMetadata.payloadIv,
      encryptionMetadata.payloadAuthTag
    );

    return decryptedBuffer;
  }

  /**
   * Verifies disk storage digest against recorded hash
   */
  verifyVaultFileHash(docId, expectedPayloadHash) {
    const doc = dbService.getDocumentById(docId);
    const targetFileId = (doc && doc.currentFileId) ? doc.currentFileId : docId;
    let filePath = this.getFilePath(targetFileId);
    if (!fs.existsSync(filePath)) {
      filePath = this.getFilePath(docId);
    }
    if (!fs.existsSync(filePath)) {
      return { valid: false, reason: 'File missing from storage vault' };
    }

    try {
      if (!doc || !doc.encryptionMetadata) {
        return { valid: false, reason: 'Missing encryption metadata' };
      }

      const decryptedBuffer = this.readFileFromVault(docId, doc.encryptionMetadata);
      const currentHash = computeSHA256(decryptedBuffer);

      if (currentHash !== expectedPayloadHash) {
        return {
          valid: false,
          reason: 'SHA-256 hash mismatch - disk file altered or tampered',
          currentHash
        };
      }

      return { valid: true, currentHash };
    } catch (err) {
      return { valid: false, reason: `Decryption or reading error: ${err.message}` };
    }
  }

  /**
   * Simulates unauthorized out-of-band disk file tampering for audit demonstration
   */
  simulateTamperOnDisk(docId) {
    const doc = dbService.getDocumentById(docId);
    const targetFileId = (doc && doc.currentFileId) ? doc.currentFileId : docId;
    let filePath = this.getFilePath(targetFileId);
    if (!fs.existsSync(filePath)) {
      filePath = this.getFilePath(docId);
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${docId} not found in vault.`);
    }

    const fileContent = fs.readFileSync(filePath);
    // Flip bytes in the ciphertext
    if (fileContent.length > 10) {
      fileContent[5] = fileContent[5] ^ 0xff;
      fileContent[6] = fileContent[6] ^ 0xaa;
    }
    fs.writeFileSync(filePath, fileContent);
    return true;
  }
}

export const storageService = new StorageService();
