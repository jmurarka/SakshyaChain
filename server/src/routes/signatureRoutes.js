import express from 'express';
import kms from '../kms/index.js';
import signatureService from '../services/signatureService.js';
import { dbService } from '../services/dbService.js';
import { ledgerService } from '../services/ledgerService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const SIGNER_ROLES = ['POLICE_INVESTIGATOR', 'FORENSIC_SPECIALIST', 'PUBLIC_PROSECUTOR', 'JUDICIAL_MAGISTRATE', 'OFFICER'];
const REVOKER_ROLES = ['COMPLIANCE_AUDITOR', 'ADMIN', 'JUDICIAL_MAGISTRATE'];

/**
 * GET /api/signature/signers/:signerId/public-key
 * Unauthenticated public key endpoint for independent 3rd-party court verification.
 */
router.get('/signers/:signerId/public-key', async (req, res) => {
  try {
    const { signerId } = req.params;
    let publicKey;
    try {
      publicKey = await kms.getPublicKey(signerId);
    } catch (err) {
      // Provision on demand if local dev
      await kms.provisionSigningKey(signerId);
      publicKey = await kms.getPublicKey(signerId);
    }
    res.type('text/plain').send(publicKey);
  } catch (err) {
    res.status(404).json({ error: 'PUBLIC_KEY_NOT_FOUND', message: err.message });
  }
});

// All routes below require authentication
router.use(authenticateToken);

/**
 * POST /api/signature/documents/:documentId/versions/:versionId/sign
 */
router.post('/documents/:documentId/versions/:versionId/sign', async (req, res) => {
  const { documentId, versionId } = req.params;
  const { payloadHash, metadata } = req.body || {};

  const doc = dbService.getDocumentById(documentId);
  if (!doc) {
    return res.status(404).json({ error: 'DOC_NOT_FOUND', message: 'Document not found' });
  }

  if (req.user.clearanceLevel < doc.clearanceLevel) {
    return res.status(403).json({ error: 'FORBIDDEN_CLEARANCE', message: 'Insufficient clearance to sign document' });
  }

  const effectivePayloadHash = payloadHash || doc.payloadHash;
  if (!effectivePayloadHash) {
    return res.status(400).json({ error: 'MISSING_PAYLOAD_HASH', message: 'payloadHash is required' });
  }

  try {
    const record = await signatureService.signManifest({
      documentId,
      versionId,
      payloadHash: effectivePayloadHash,
      signerId: req.user.id,
      metadata: {
        ...metadata,
        docTitle: doc.title,
        caseId: doc.caseId,
        signerName: req.user.name,
        signerRole: req.user.roleTitle || req.user.role,
        signerDepartment: req.user.departmentName || req.user.department
      },
    });

    // Anchor to Blockchain Ledger
    const block = ledgerService.addBlock({
      action: 'PKI_SIGNATURE_APPLIED',
      actorId: req.user.id,
      actorName: req.user.name,
      caseId: doc.caseId,
      docId: doc.id,
      docHash: effectivePayloadHash,
      details: {
        manifestId: record.manifestId,
        signatureId: record.signatureId,
        provider: record.signatureProvider,
        versionId
      }
    });

    return res.status(201).json({
      message: 'RSA Cryptographic Signature successfully generated and anchored to Ledger.',
      manifestId: record.manifestId,
      signatureId: record.signatureId,
      documentId: record.documentId,
      versionId: record.versionId,
      signerId: record.signerId,
      provider: record.signatureProvider,
      signedAt: record.signedAt,
      ledgerBlock: block
    });
  } catch (err) {
    return res.status(500).json({ error: 'SIGNATURE_FAILED', message: err.message });
  }
});

/**
 * POST /api/signature/sign (Compatibility endpoint for legacy client calls)
 */
router.post('/sign', async (req, res) => {
  const { docId } = req.body;
  if (!docId) {
    return res.status(400).json({ error: 'MISSING_DOC_ID', message: 'docId is required' });
  }

  const doc = dbService.getDocumentById(docId);
  if (!doc) {
    return res.status(404).json({ error: 'DOC_NOT_FOUND', message: 'Document not found' });
  }

  if (req.user.clearanceLevel < doc.clearanceLevel) {
    return res.status(403).json({ error: 'FORBIDDEN_CLEARANCE', message: 'Insufficient clearance to sign document' });
  }

  try {
    const record = await signatureService.signManifest({
      documentId: doc.id,
      versionId: `v${doc.version || 1}.0`,
      payloadHash: doc.payloadHash,
      signerId: req.user.id,
      metadata: {
        docTitle: doc.title,
        caseId: doc.caseId,
        signerName: req.user.name,
        signerRole: req.user.roleTitle || req.user.role,
        signerDepartment: req.user.departmentName || req.user.department
      }
    });

    // Anchor to Blockchain Ledger
    const block = ledgerService.addBlock({
      action: 'PKI_SIGNATURE_APPLIED',
      actorId: req.user.id,
      actorName: req.user.name,
      caseId: doc.caseId,
      docId: doc.id,
      docHash: doc.payloadHash,
      details: {
        manifestId: record.manifestId,
        signatureId: record.signatureId,
        provider: record.signatureProvider
      }
    });

    res.json({
      message: 'RSA-2048 PKI Digital Signature successfully applied and anchored to Ledger.',
      signature: doc.signature,
      manifestId: record.manifestId,
      signatureId: record.signatureId,
      ledgerBlock: block
    });
  } catch (err) {
    res.status(500).json({ error: 'SIGNATURE_FAILED', message: err.message });
  }
});

/**
 * GET /api/signature/documents/:documentId/signatures
 */
router.get('/documents/:documentId/signatures', async (req, res) => {
  const records = await signatureService.listSignaturesForDocument(req.params.documentId);
  res.json(records);
});

/**
 * POST /api/signature/signatures/manifests/:manifestId/verify
 */
router.post('/signatures/manifests/:manifestId/verify', async (req, res) => {
  const { currentPayloadHash } = req.body || {};
  const result = await signatureService.verifyManifest(req.params.manifestId, currentPayloadHash);
  const httpStatus = result.status === 'NOT_FOUND' ? 404 : 200;
  res.status(httpStatus).json(result);
});

/**
 * POST /api/signature/verify (Compatibility verification endpoint)
 */
router.post('/verify', async (req, res) => {
  const { docId, manifestId } = req.body;
  const doc = dbService.getDocumentById(docId);

  let targetManifestId = manifestId;
  if (!targetManifestId && doc && doc.signature && doc.signature.manifestId) {
    targetManifestId = doc.signature.manifestId;
  }

  if (!targetManifestId && doc) {
    const manifests = await signatureService.listSignaturesForDocument(doc.id);
    if (manifests.length > 0) {
      targetManifestId = manifests[manifests.length - 1].manifestId;
    }
  }

  if (!targetManifestId) {
    return res.status(404).json({
      valid: false,
      status: 'NOT_FOUND',
      message: 'No PKI digital signature manifest found for document'
    });
  }

  const currentPayloadHash = doc ? doc.payloadHash : undefined;
  const result = await signatureService.verifyManifest(targetManifestId, currentPayloadHash);

  res.json({
    valid: result.valid,
    status: result.status,
    reasons: result.reasons,
    signedBy: doc && doc.signature ? doc.signature.signedBy : result.manifest?.signerId,
    signerRole: doc && doc.signature ? doc.signature.signerRole : 'Signer',
    dateSigned: result.manifest?.signedAt,
    docHashRecorded: result.manifest?.sha256,
    docHashInManifest: result.manifest?.sha256,
    manifest: result.manifest
  });
});

/**
 * DELETE /api/signature/signatures/:signatureId
 * Revoke a signature
 */
router.delete('/signatures/:signatureId', async (req, res) => {
  const { reason } = req.body || {};
  if (!reason) {
    return res.status(400).json({ error: 'MISSING_REASON', message: 'reason is required to revoke a signature' });
  }

  // Check user role
  const roleOK = REVOKER_ROLES.includes(req.user.role);
  if (!roleOK && req.user.clearanceLevel < 4) {
    return res.status(403).json({ error: 'FORBIDDEN_ROLE', message: 'Only Compliance Auditor or Admin can revoke signatures' });
  }

  try {
    const revocation = await signatureService.revokeSignature(req.params.signatureId, {
      reason,
      revokedBy: req.user.name || req.user.id,
    });

    // Anchor to Blockchain Ledger
    ledgerService.addBlock({
      action: 'SIGNATURE_REVOKED',
      actorId: req.user.id,
      actorName: req.user.name,
      details: { signatureId: req.params.signatureId, reason }
    });

    res.json({ message: 'Signature successfully revoked', signatureId: req.params.signatureId, ...revocation });
  } catch (err) {
    res.status(404).json({ error: 'REVOCATION_FAILED', message: err.message });
  }
});

export default router;
