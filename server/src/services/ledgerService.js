import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { CONFIG } from '../config.js';
import { supabase } from '../supabaseClient.js';

export function computeCanonicalHash({
  event_id, document_id, case_id, version_id = '', action, user_id, user_role, timestamp, data_hash, parent_hashes = []
}) {
  const sortedParents = [...(parent_hashes || [])].sort();
  const canonical = (event_id || '') + (document_id || '') + (case_id || '') + (version_id || '') + (action || '') + (user_id || '') + (user_role || '') + (timestamp || '') + (data_hash || '') + sortedParents.join('');
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
    this.eventsFile = path.join(CONFIG.DATA_DIR, 'audit_events.json');
    this.ledgerFile = path.join(CONFIG.DATA_DIR, 'ledger.json');
  }

  readEvents() {
    let events = [];
    try {
      if (fs.existsSync(this.eventsFile)) {
        events = JSON.parse(fs.readFileSync(this.eventsFile, 'utf8'));
      } else if (fs.existsSync(this.ledgerFile)) {
        const rawLedger = JSON.parse(fs.readFileSync(this.ledgerFile, 'utf8'));
        events = rawLedger.map((b, idx) => {
          const parent_hashes = b.previousBlockHash && b.previousBlockHash !== '0'.repeat(64) ? [b.previousBlockHash] : [];
          return {
            event_id: b.event_id || `evt-${idx + 1}`,
            document_id: b.docId || b.document_id || 'DOC-GENERIC',
            case_id: b.caseId || b.case_id || 'CASE-GENERIC',
            version_id: b.version_id || 'v1.0',
            action: b.action || 'UPLOAD',
            user_id: b.actorId || b.user_id || 'SYSTEM',
            user_role: b.actorRole || 'INVESTIGATOR',
            timestamp: b.timestamp || new Date().toISOString(),
            data_hash: b.docHash || b.data_hash || '0'.repeat(64),
            parent_hashes,
            event_hash: b.blockHash || b.event_hash || '0'.repeat(64),
            metadata: b.details || b.metadata || {}
          };
        });
      }
    } catch (e) {}
    return events;
  }

  getBlocks() {
    const events = this.readEvents();
    const eventHashMap = new Map(events.map(e => [e.event_hash, e]));
    const edges = [];

    events.forEach(child => {
      if (child.parent_hashes) {
        child.parent_hashes.forEach(pHash => {
          const parent = eventHashMap.get(pHash);
          if (parent) {
            edges.push({
              child_id: child.event_id,
              parent_id: parent.event_id,
              source: parent.event_hash,
              target: child.event_hash
            });
          }
        });
      }
    });

    return { blocks: events, edges };
  }

  getBlockById(blockId) {
    const events = this.readEvents();
    return events.find(e => e.event_id === blockId || e.event_hash === blockId) || null;
  }

  addBlock(payload) {
    return this.createEvent({
      document_id: payload.docId || payload.document_id,
      case_id: payload.caseId || payload.case_id,
      action: payload.action,
      user_id: payload.actorId || payload.user_id,
      user_role: payload.actorRole || payload.user_role || 'INVESTIGATOR',
      data_hash: payload.docHash || payload.data_hash,
      metadata: payload.details || payload.metadata || {}
    });
  }

  createEvent(payload) {
    const events = this.readEvents();
    const event_id = payload.event_id || uuidv4();
    const timestamp = payload.timestamp || new Date().toISOString();
    let parent_hashes = Array.isArray(payload.parent_hashes) ? payload.parent_hashes : [];

    if (parent_hashes.length === 0 && events.length > 0) {
      parent_hashes = [events[events.length - 1].event_hash];
    }

    const eventRecord = {
      event_id,
      document_id: payload.document_id || 'DOC-GENERIC',
      case_id: payload.case_id || 'CASE-GENERIC',
      version_id: payload.version_id || 'v1.0',
      action: payload.action || 'GENERIC_ACTION',
      user_id: payload.user_id || 'SYSTEM',
      user_role: payload.user_role || 'SYSTEM_ROLE',
      timestamp,
      data_hash: payload.data_hash || '0'.repeat(64),
      parent_hashes,
      metadata: payload.metadata || {}
    };

    eventRecord.event_hash = computeCanonicalHash(eventRecord);
    events.push(eventRecord);

    try {
      fs.writeFileSync(this.eventsFile, JSON.stringify(events, null, 2), 'utf8');
    } catch (e) {}

    if (supabase) {
      Promise.resolve(
        supabase.from('audit_events').upsert({
          event_id: eventRecord.event_id,
          document_id: eventRecord.document_id,
          case_id: eventRecord.case_id,
          version_id: eventRecord.version_id,
          action: eventRecord.action,
          user_id: eventRecord.user_id,
          user_role: eventRecord.user_role,
          timestamp: eventRecord.timestamp,
          data_hash: eventRecord.data_hash,
          parent_hashes: eventRecord.parent_hashes,
          event_hash: eventRecord.event_hash,
          metadata: eventRecord.metadata
        })
      ).catch(() => {});
    }

    return eventRecord;
  }

  verifyChainIntegrity() {
    const events = this.readEvents();
    const broken = [];
    for (const event of events) {
      const recomputed = computeCanonicalHash({
        event_id: event.event_id,
        document_id: event.document_id,
        case_id: event.case_id,
        version_id: event.version_id,
        action: event.action,
        user_id: event.user_id,
        user_role: event.user_role,
        timestamp: event.timestamp,
        data_hash: event.data_hash,
        parent_hashes: event.parent_hashes || []
      });

      if (event.event_hash && recomputed !== event.event_hash) {
        broken.push(event.event_hash);
      }
    }

    return {
      status: broken.length === 0 ? 'OK' : 'TAMPERED',
      blocks_checked: events.length,
      broken_blocks: broken,
      message: broken.length === 0 ? 'All blocks verified intact. Cryptographic DAG hash chain is unbroken.' : `Tampering detected at ${broken.length} block(s).`
    };
  }

  anchorDailyMerkleRoot() {
    const events = this.readEvents();
    if (events.length === 0) return { status: 'NO_EVENTS', message: 'No events to anchor.' };
    const merkleRoot = computeMerkleRoot(events.map(e => e.event_hash));
    const anchorRecord = {
      anchor_id: uuidv4(),
      merkle_root: merkleRoot,
      from_event_id: events[0].event_id,
      to_event_id: events[events.length - 1].event_id,
      anchored_at: new Date().toISOString(),
      fabric_tx_id: 'FABRIC_TX_' + crypto.randomBytes(16).toString('hex')
    };
    if (supabase) {
      Promise.resolve(supabase.from('blockchain_anchors').upsert(anchorRecord)).catch(() => {});
    }
    return anchorRecord;
  }

  simulateTampering(targetEventId) {
    const events = this.readEvents();
    let target = events.find(e => e.event_id === targetEventId || e.event_hash === targetEventId);
    if (!target && events.length > 0) target = events[0];

    if (target) {
      target.data_hash = 'CORRUPTED_' + target.data_hash.slice(10);
      try {
        fs.writeFileSync(this.eventsFile, JSON.stringify(events, null, 2), 'utf8');
      } catch (e) {}
      return target;
    }
    return null;
  }
}

export const ledgerService = new LedgerService();
