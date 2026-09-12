import fs from 'fs';
import { CONFIG } from '../config.js';
import { computeSHA256 } from './cryptoService.js';
import { dbService } from './dbService.js';
import { storageService } from './storageService.js';
import { gitLedgerService } from './gitLedgerService.js';

class LedgerService {
  constructor() {
    this.ledgerPath = CONFIG.LEDGER_FILE;
    this.init();
  }

  init() {
    if (!fs.existsSync(CONFIG.DATA_DIR)) {
      fs.mkdirSync(CONFIG.DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(this.ledgerPath)) {
      const genesisBlock = {
        blockHeight: 0,
        timestamp: '2026-08-01T00:00:00.000Z',
        action: 'GENESIS_BLOCK_MINED',
        actorId: 'SYSTEM',
        actorName: 'SākshyaChain Root Security Kernel',
        caseId: 'SYSTEM-ROOT',
        docId: 'DOC-GENESIS',
        docHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        details: 'Initial cryptographic genesis state initialized with SHA-256 chain protection.',
        previousBlockHash: '0000000000000000000000000000000000000000000000000000000000000000',
        blockHash: ''
      };
      genesisBlock.blockHash = this.calculateBlockHash(genesisBlock);
      fs.writeFileSync(this.ledgerPath, JSON.stringify([genesisBlock], null, 2), 'utf8');
    }
  }

  getBlocks() {
    try {
      const data = fs.readFileSync(this.ledgerPath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return [];
    }
  }

  calculateBlockHash(block) {
    const stringToHash = `${block.blockHeight}|${block.timestamp}|${block.action}|${block.actorId}|${block.caseId}|${block.docId}|${block.docHash}|${block.previousBlockHash}|${JSON.stringify(block.details || {})}`;
    return computeSHA256(stringToHash);
  }

  addBlock({ action, actorId, actorName, caseId, docId, docHash, details }) {
    const blocks = this.getBlocks();
    const lastBlock = blocks[blocks.length - 1];

    const newBlock = {
      blockHeight: lastBlock ? lastBlock.blockHeight + 1 : 0,
      timestamp: new Date().toISOString(),
      action,
      actorId,
      actorName: actorName || actorId,
      caseId: caseId || 'N/A',
      docId: docId || 'N/A',
      docHash: docHash || 'N/A',
      details: details || {},
      previousBlockHash: lastBlock ? lastBlock.blockHash : '0'.repeat(64),
      blockHash: ''
    };

    newBlock.blockHash = this.calculateBlockHash(newBlock);
    
    // Git Commit Hash Integration (inspired by git4docs)
    const gitHash = gitLedgerService.recordGitCommit({
      action,
      actorName: newBlock.actorName,
      caseId: newBlock.caseId,
      docId: newBlock.docId,
      docHash: newBlock.docHash
    });
    newBlock.gitCommitHash = gitHash;

    blocks.push(newBlock);

    fs.writeFileSync(this.ledgerPath, JSON.stringify(blocks, null, 2), 'utf8');
    return newBlock;
  }

  /**
   * Complete Cryptographic Audit of Blockchain Chaining AND Vault Disk Files
   */
  verifyChainIntegrity() {
    const blocks = this.getBlocks();
    const verificationResults = {
      timestamp: new Date().toISOString(),
      totalBlocksChecked: blocks.length,
      chainIntact: true,
      vaultFilesIntegrityOK: true,
      tamperDetected: false,
      blockErrors: [],
      fileErrors: []
    };

    // 1. Verify Block Chaining & SHA-256 hashes
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const recalculatedHash = this.calculateBlockHash(block);

      if (recalculatedHash !== block.blockHash) {
        verificationResults.chainIntact = false;
        verificationResults.tamperDetected = true;
        verificationResults.blockErrors.push({
          blockHeight: block.blockHeight,
          issue: 'Block Hash Mismatch - Content altered in block ledger',
          recordedHash: block.blockHash,
          computedHash: recalculatedHash
        });
      }

      if (i > 0) {
        const prevBlock = blocks[i - 1];
        if (block.previousBlockHash !== prevBlock.blockHash) {
          verificationResults.chainIntact = false;
          verificationResults.tamperDetected = true;
          verificationResults.blockErrors.push({
            blockHeight: block.blockHeight,
            issue: 'Previous Block Hash Pointer Invalid - Chain broken',
            recordedPrevHash: block.previousBlockHash,
            actualPrevHash: prevBlock.blockHash
          });
        }
      }
    }

    // 2. Verify Physical Disk Storage Files against recorded ledger hashes
    const dbDocs = dbService.readDB().documents || [];
    for (const doc of dbDocs) {
      const fileStatus = storageService.verifyVaultFileHash(doc.id, doc.payloadHash);
      if (!fileStatus.valid) {
        verificationResults.vaultFilesIntegrityOK = false;
        verificationResults.tamperDetected = true;
        verificationResults.fileErrors.push({
          docId: doc.id,
          docTitle: doc.title,
          caseId: doc.caseId,
          issue: fileStatus.reason,
          recordedHash: doc.payloadHash,
          actualDiskHash: fileStatus.currentHash || 'FILE_UNREADABLE'
        });
      }
    }

    return verificationResults;
  }
}

export const ledgerService = new LedgerService();
