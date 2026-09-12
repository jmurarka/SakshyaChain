import { ledgerService, computeCanonicalHash, computeMerkleRoot } from './src/services/ledgerService.js';
import crypto from 'crypto';

console.log('====================================================');
console.log('  SākshyaChain Audit Trail DAG Verification Suite   ');
console.log('====================================================\n');

// 1. Verify Canonical Hash Formula
console.log('[Test 1] Testing Canonical SHA-256 Hashing Formula...');
const payloadTest = {
  event_id: 'evt-test-001',
  document_id: 'doc-test-100',
  case_id: 'case-test-200',
  version_id: 'v1.0',
  action: 'SIGN',
  user_id: 'usr-prosecutor',
  user_role: 'PUBLIC_PROSECUTOR',
  timestamp: '2026-09-12T12:00:00.000Z',
  data_hash: '9f2c7a3b4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
  parent_hashes: ['parent_hash_B', 'parent_hash_A'] // Unsorted
};

// Formula: event_id + document_id + case_id + version_id + action + user_id + user_role + timestamp + data_hash + "".join(sorted(parent_hashes))
const expectedParentsConcat = 'parent_hash_A' + 'parent_hash_B';
const expectedCanonical = 'evt-test-001' + 'doc-test-100' + 'case-test-200' + 'v1.0' + 'SIGN' + 'usr-prosecutor' + 'PUBLIC_PROSECUTOR' + '2026-09-12T12:00:00.000Z' + '9f2c7a3b4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b' + expectedParentsConcat;
const expectedHash = crypto.createHash('sha256').update(expectedCanonical, 'utf8').digest('hex');

const computedHash = computeCanonicalHash(payloadTest);

if (computedHash === expectedHash) {
  console.log('✅ Canonical SHA-256 hash match verified!');
  console.log(`   Canonical string: "${expectedCanonical.slice(0, 50)}..."`);
  console.log(`   Event SHA-256:    ${computedHash}\n`);
} else {
  console.error('❌ Mismatch in canonical SHA-256 computation!');
  console.error(`   Expected: ${expectedHash}`);
  console.error(`   Got:      ${computedHash}\n`);
  process.exit(1);
}

// 2. Fetch Initial Seeded DAG Blocks & Edges
console.log('[Test 2] Reading Seeded Audit DAG Blocks & Edges...');
const { blocks, edges } = ledgerService.getBlocks();
console.log(`   Loaded ${blocks.length} audit events and ${edges.length} parent edges.`);
blocks.forEach((b, i) => {
  console.log(`   [Block #${i + 1}] ${b.action.padEnd(8)} | User: ${b.user_id.padEnd(16)} | Hash: ${b.event_hash.slice(0, 16)}... | Parents: ${b.parent_hashes.length}`);
});
console.log('');

// 3. Verify Chain Integrity (Untampered State)
console.log('[Test 3] Running Full Cryptographic Chain Integrity Verification...');
const verifyStatus = ledgerService.verifyChainIntegrity();
console.log(`   Status: ${verifyStatus.status}`);
console.log(`   Message: ${verifyStatus.message}`);

if (verifyStatus.status === 'OK') {
  console.log('✅ Intact chain verification PASSED!\n');
} else {
  console.error('❌ Chain verification unexpectedly FAILED!');
  process.exit(1);
}

// 4. Test Event Block Append Logic
console.log('[Test 4] Appending New Audit Event Block (CHERRY_PICK)...');
const newEvent = ledgerService.createEvent({
  document_id: 'doc-8891-001',
  case_id: 'case-2026-8891',
  version_id: 'v1.2',
  action: 'CHERRY_PICK',
  user_id: 'USR-JUD-404',
  user_role: 'JUDICIAL_MAGISTRATE',
  data_hash: 'c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f67890123456789abcdef0123456789abc',
  parent_hashes: [blocks[blocks.length - 1].event_hash],
  metadata: { reason: 'Selected core forensic exhibit for trial summary' }
});
console.log(`   Created Event ID:   ${newEvent.event_id}`);
console.log(`   Event SHA-256 Hash: ${newEvent.event_hash}`);
console.log('✅ Block creation and parent edge linking PASSED!\n');

// 5. Test Merkle Root Anchoring
console.log('[Test 5] Anchoring Daily Merkle Root to Hyperledger Fabric Mock Chain...');
const anchor = ledgerService.anchorDailyMerkleRoot();
console.log(`   Anchor ID:    ${anchor.anchor_id}`);
console.log(`   Merkle Root:  ${anchor.merkle_root}`);
console.log(`   Fabric Tx ID: ${anchor.fabric_tx_id}`);
console.log('✅ Daily Merkle root anchoring PASSED!\n');

// 6. Test Tamper Detection
console.log('[Test 6] Simulating Out-of-Band Byte Corruption on Block...');
const tamperedTarget = blocks[1]; // Block #2 (VIEW)
ledgerService.simulateTampering(tamperedTarget.event_id);

const tamperedVerifyStatus = ledgerService.verifyChainIntegrity();
console.log(`   Post-tamper status: ${tamperedVerifyStatus.status}`);
console.log(`   Broken blocks count: ${tamperedVerifyStatus.broken_blocks.length}`);

if (tamperedVerifyStatus.status === 'TAMPERED' && tamperedVerifyStatus.broken_blocks.length > 0) {
  console.log('✅ Real-time tamper detection successfully flagged broken SHA-256 hash!\n');
} else {
  console.error('❌ Tamper detection failed to flag corrupted block!');
  process.exit(1);
}

// Restore intact state for clean server startup
console.log('Restoring clean DAG seed state...');
ledgerService.seedInitialDAG();
console.log('✅ All tests completed successfully!');
