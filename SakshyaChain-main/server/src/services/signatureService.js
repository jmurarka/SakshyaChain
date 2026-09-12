import crypto from 'crypto';
import kms from '../kms/index.js';
import { canonicalize } from '../utils/canonicalJson.js';
import { dbService } from './dbService.js';

function newId(prefix) {
  return `${prefix}-${crypto.randomBytes(8).toString('hex')}`;
}

/**
 * Build the canonical manifest object for a document version.
 */
export function buildManifest({ documentId, versionId, payloadHash, signerId, metadata = {} }) {
  if (!documentId || !versionId || !payloadHash || !signerId) {
    throw new Error('buildManifest requires documentId, versionId, payloadHash, signerId');
  }
  return {
    manifestId: newId('MANIFEST'),
    documentId,
    versionId,
    sha256: payloadHash,
    signerId,
    metadata,
    timestamp: new Date().toISOString(),
  };
}

/**
 * SHA-256 digest of the canonicalized manifest (excludes signature fields).
 */
export function computeManifestDigest(manifest) {
  const canonicalString = canonicalize(manifest);
  return crypto.createHash('sha256').update(canonicalString).digest();
}

/**
 * Sign a document version.
 */
export async function signManifest({ documentId, versionId, payloadHash, signerId, metadata = {} }) {
  await kms.provisionSigningKey(signerId).catch((err) => {
    throw err;
  });

  const manifest = buildManifest({ documentId, versionId, payloadHash, signerId, metadata });
  const digest = computeManifestDigest(manifest);
  const signResult = await kms.sign(signerId, digest);

  const record = {
    ...manifest,
    signatureId: newId('SIG'),
    signature: signResult.signature,
    signatureProvider: signResult.provider,
    signedAt: signResult.signedAt,
    status: 'ACTIVE',
  };

  dbService.saveManifest(record);

  // Update document record status and attached signature for UI backward compatibility
  const doc = dbService.getDocumentById(documentId);
  if (doc) {
    doc.status = 'SIGNED_PKI';
    doc.signature = {
      signedBy: metadata.signerName || signerId,
      signerRole: metadata.signerRole || 'OFFICER',
      signerDepartment: metadata.signerDepartment || 'LEO',
      signatureBase64: signResult.signature,
      dateSigned: signResult.signedAt,
      manifestId: record.manifestId,
      signatureId: record.signatureId,
      signatureProvider: signResult.provider,
      manifest,
    };
    if (!doc.chainOfCustody) doc.chainOfCustody = [];
    doc.chainOfCustody.push({
      action: 'PKI_DIGITAL_SIGNATURE_APPLIED',
      actorName: metadata.signerName || signerId,
      department: metadata.signerDepartment || 'LEO',
      timestamp: signResult.signedAt,
      details: { manifestId: record.manifestId, signatureId: record.signatureId, provider: signResult.provider }
    });
    dbService.saveDocumentMetadata(doc);
  }

  return record;
}

/**
 * Verify a stored signature.
 * Distinguishes TAMPER_DETECTED, SIGNATURE_INVALID, SIGNATURE_REVOKED.
 */
export async function verifyManifest(manifestId, currentPayloadHash) {
  const record = dbService.getManifest(manifestId);
  if (!record) {
    return { valid: false, status: 'NOT_FOUND', reasons: ['No manifest with this id exists'] };
  }

  const reasons = [];

  // 1. Check Revocation
  const revocation = dbService.getRevocation(record.signatureId);
  if (revocation) {
    reasons.push(`Signature revoked at ${revocation.revokedAt}: ${revocation.reason}`);
  }

  // 2. Check File Tampering
  let documentTampered = false;
  if (currentPayloadHash && currentPayloadHash !== record.sha256) {
    documentTampered = true;
    reasons.push(
      `Document content hash mismatch: signed=${record.sha256}, current=${currentPayloadHash}`
    );
  }

  // 3. Cryptographic Verification
  const { signatureId, signature, signatureProvider, signedAt, status, ...signedManifest } = record;
  const digest = computeManifestDigest(signedManifest);
  let signatureCryptoValid = false;
  try {
    signatureCryptoValid = await kms.verify(record.signerId, digest, signature);
  } catch (err) {
    reasons.push(`Verification error: ${err.message}`);
  }
  if (!signatureCryptoValid) {
    reasons.push('Cryptographic signature verification failed — manifest or signature may be corrupted/forged');
  }

  let overallStatus = 'VERIFIED';
  if (documentTampered) overallStatus = 'TAMPER_DETECTED';
  else if (!signatureCryptoValid) overallStatus = 'SIGNATURE_INVALID';
  else if (revocation) overallStatus = 'SIGNATURE_REVOKED';

  return {
    valid: overallStatus === 'VERIFIED',
    status: overallStatus,
    reasons,
    manifest: {
      manifestId: record.manifestId,
      documentId: record.documentId,
      versionId: record.versionId,
      signerId: record.signerId,
      signatureId: record.signatureId,
      signedAt: record.signedAt,
      provider: record.signatureProvider,
      sha256: record.sha256,
      metadata: record.metadata
    },
  };
}

export async function listSignaturesForDocument(documentId) {
  return dbService.getManifestsForDocument(documentId);
}

export async function getManifest(manifestId) {
  return dbService.getManifest(manifestId);
}

/**
 * Revoke a signature.
 */
export async function revokeSignature(signatureId, { reason, revokedBy }) {
  if (!reason || !revokedBy) {
    throw new Error('revokeSignature requires { reason, revokedBy }');
  }
  const manifests = dbService.readDB().manifests || [];
  const targetManifest = manifests.find(m => m.signatureId === signatureId);
  if (!targetManifest) {
    throw new Error(`No signature found with id "${signatureId}"`);
  }

  const revocation = { signatureId, reason, revokedBy, revokedAt: new Date().toISOString() };
  dbService.saveRevocation(revocation);

  targetManifest.status = 'REVOKED';
  dbService.saveManifest(targetManifest);

  // Update doc status if attached
  const doc = dbService.getDocumentById(targetManifest.documentId);
  if (doc && doc.signature && doc.signature.signatureId === signatureId) {
    doc.status = 'SIGNATURE_REVOKED';
    doc.chainOfCustody.push({
      action: 'PKI_SIGNATURE_REVOKED',
      actorName: revokedBy,
      timestamp: revocation.revokedAt,
      details: { signatureId, reason }
    });
    dbService.saveDocumentMetadata(doc);
  }

  return revocation;
}

export default {
  buildManifest,
  computeManifestDigest,
  signManifest,
  verifyManifest,
  listSignaturesForDocument,
  getManifest,
  revokeSignature,
};
