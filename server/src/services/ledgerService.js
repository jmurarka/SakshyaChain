import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { CONFIG } from '../config.js';
import { computeSHA256 } from './cryptoService.js';
import { dbService } from './dbService.js';
import { storageService } from './storageService.js';
import { gitLedgerService } from './gitLedgerService.js';

export function computeCanonicalHash({
  blockHeight, timestamp, action, actorId, caseId, docId, docHash, previousBlockHash, parent_hashes = [], details = {}
}) {
  const sortedParents = [...(parent_hashes || [])].sort();
  const canonical = `${blockHeight}|${timestamp}|${action}|${actorId}|${caseId}|${docId}|${docHash}|${previousBlockHash}|${sortedParents.join('')}|${JSON.stringify(details)}`;
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export function computeMerkleRoot(hashes) {
  if (!hashes || hashes.length === 0) return '0'.repeat(64);
  let currentLevel = [...hashes];
  while (currentLevel.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const combined = i + 1 < currentLevel.length ? currentLevel[i] + currentLevel[i + 1] : currentLevel[i] + currentLevel[i];
      nextLevel.push(crypto.createHash('sha256').update(combined, 'utf8').digest('hex'));
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0];
}

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
        index: 0,
        blockHeight: 0,
        timestamp: '2026-08-01T00:00:00.000Z',
        action: 'GENESIS_BLOCK_MINED',
        actorId: 'SYSTEM',
        actorName: 'SākshyaChain Root Security Kernel',
        caseId: 'SYSTEM-ROOT',
        docId: 'DOC-GENESIS',
        docHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        details: { note: 'Initial cryptographic genesis state initialized with SHA-256 chain protection.' },
        previousBlockHash: '0000000000000000000000000000000000000000000000000000000000000000',
        parent_hashes: [],
        blockHash: ''
      };
      genesisBlock.blockHash = this.calculateBlockHash(genesisBlock);
      genesisBlock.event_hash = genesisBlock.blockHash;
      genesisBlock.payload = {
        action: genesisBlock.action,
        actorId: genesisBlock.actorId,
        actorName: genesisBlock.actorName,
        caseId: genesisBlock.caseId,
        docId: genesisBlock.docId,
        docHash: genesisBlock.docHash,
        details: genesisBlock.details
      };
      fs.writeFileSync(this.ledgerPath, JSON.stringify([genesisBlock], null, 2), 'utf8');
    }
  }

  readBlocksFromDisk() {
    try {
      const data = fs.readFileSync(this.ledgerPath, 'utf8');
      const rawBlocks = JSON.parse(data);
      return rawBlocks.map((b, idx) => {
        const index = b.index !== undefined ? b.index : b.blockHeight !== undefined ? b.blockHeight : idx;
        const blockHash = b.blockHash || b.event_hash || this.calculateBlockHash(b);
        const parent_hashes = b.parent_hashes || (b.previousBlockHash && b.previousBlockHash !== '0'.repeat(64) ? [b.previousBlockHash] : []);
        const payload = b.payload || {
          action: b.action,
          actorId: b.actorId || b.user_id,
          actorName: b.actorName || b.actorId,
          caseId: b.caseId || b.case_id,
          docId: b.docId || b.document_id,
          docHash: b.docHash || b.data_hash,
          details: b.details || b.metadata || {}
        };
        return {
          ...b,
          index,
          blockHeight: index,
          blockHash,
          event_hash: blockHash,
          parent_hashes,
          payload
        };
      });
    } catch (err) {
      return [];
    }
  }

  getBlocks() {
    const blocks = this.readBlocksFromDisk();
    const eventHashMap = new Map(blocks.map(b => [b.blockHash, b]));
    const edges = [];

    blocks.forEach(child => {
      const parents = child.parent_hashes || (child.previousBlockHash && child.previousBlockHash !== '0'.repeat(64) ? [child.previousBlockHash] : []);
      parents.forEach(pHash => {
        const parent = eventHashMap.get(pHash);
        if (parent) {
          edges.push({
            child_id: child.index,
            parent_id: parent.index,
            source: parent.blockHash,
            target: child.blockHash
          });
        }
      });
    });

    return { chain: blocks, blocks, edges };
  }

  calculateBlockHash(block) {
    const parent_hashes = block.parent_hashes || (block.previousBlockHash && block.previousBlockHash !== '0'.repeat(64) ? [block.previousBlockHash] : []);
    return computeCanonicalHash({
      blockHeight: block.blockHeight || block.index || 0,
      timestamp: block.timestamp,
      action: block.action || block.payload?.action,
      actorId: block.actorId || block.payload?.actorId,
      caseId: block.caseId || block.payload?.caseId,
      docId: block.docId || block.payload?.docId,
      docHash: block.docHash || block.payload?.docHash,
      previousBlockHash: block.previousBlockHash || '0'.repeat(64),
      parent_hashes,
      details: block.details || block.payload?.details || {}
    });
  }

  addBlock({ action, actorId, actorName, caseId, docId, docHash, details }) {
    const blocks = this.readBlocksFromDisk();
    const lastBlock = blocks[blocks.length - 1];
    const index = lastBlock ? lastBlock.index + 1 : 0;

    const previousBlockHash = lastBlock ? lastBlock.blockHash : '0'.repeat(64);
    const parent_hashes = lastBlock ? [lastBlock.blockHash] : [];

    const newBlock = {
      index,
      blockHeight: index,
      timestamp: new Date().toISOString(),
      action,
      actorId,
      actorName: actorName || actorId,
      caseId: caseId || 'N/A',
      docId: docId || 'N/A',
      docHash: docHash || 'N/A',
      details: details || {},
      previousBlockHash,
      parent_hashes,
      payload: {
        action,
        actorId,
        actorName: actorName || actorId,
        caseId: caseId || 'N/A',
        docId: docId || 'N/A',
        docHash: docHash || 'N/A',
        details: details || {}
      },
      blockHash: ''
    };

    newBlock.blockHash = this.calculateBlockHash(newBlock);
    newBlock.event_hash = newBlock.blockHash;
    
    // Git Commit Hash Integration
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

  createEvent(payload) {
    return this.addBlock({
      action: payload.action,
      actorId: payload.user_id || payload.actorId,
      actorName: payload.user_role || payload.actorName,
      caseId: payload.case_id || payload.caseId,
      docId: payload.document_id || payload.docId,
      docHash: payload.data_hash || payload.docHash,
      details: payload.metadata || payload.details || {}
    });
  }

  verifyChainIntegrity() {
    const blocks = this.readBlocksFromDisk();
    const verificationResults = {
      timestamp: new Date().toISOString(),
      totalBlocksChecked: blocks.length,
      chainIntact: true,
      vaultFilesIntegrityOK: true,
      tamperDetected: false,
      blockErrors: [],
      fileErrors: []
    };

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const recalculatedHash = this.calculateBlockHash(block);

      if (recalculatedHash !== block.blockHash) {
        verificationResults.chainIntact = false;
        verificationResults.tamperDetected = true;
        verificationResults.blockErrors.push({
          blockHeight: block.index,
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
            blockHeight: block.index,
            issue: 'Previous Block Hash Pointer Invalid - Chain broken',
            recordedPrevHash: block.previousBlockHash,
            actualPrevHash: prevBlock.blockHash
          });
        }
      }
    }

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
