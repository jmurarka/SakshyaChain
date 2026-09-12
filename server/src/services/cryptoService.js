import crypto from 'crypto';

/**
 * Computes SHA-256 hash digest (Hex format) for string or Buffer
 */
export function computeSHA256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generates a random 256-bit (32 byte) Data Encryption Key (DEK)
 */
export function generateDEK() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Encrypts a DEK with the Master Key Encryption Key (KEK) using AES-256-GCM
 */
export function encryptDEK(dekHex, kekHex) {
  const kek = Buffer.from(kekHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', kek, iv);
  
  let encrypted = cipher.update(dekHex, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return {
    encryptedDEK: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag
  };
}

/**
 * Decrypts a DEK using KEK
 */
export function decryptDEK(encryptedDEKHex, kekHex, ivHex, authTagHex) {
  const kek = Buffer.from(kekHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', kek, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedDEKHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * AES-256-GCM File Payload Encryption
 */
export function encryptBufferAES256GCM(buffer, dekHex) {
  const dek = Buffer.from(dekHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
  
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    payloadHash: computeSHA256(buffer)
  };
}

/**
 * AES-256-GCM File Payload Decryption
 */
export function decryptBufferAES256GCM(ciphertextBuffer, dekHex, ivHex, authTagHex) {
  const dek = Buffer.from(dekHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([decipher.update(ciphertextBuffer), decipher.final()]);
  return decrypted;
}

/**
 * RSA-2048 Cryptographic Keypair Generation for PKI Signatures
 */
export function generateRSAKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  return { publicKey, privateKey };
}

/**
 * Signs a canonical document manifest using RSA-SHA256
 */
export function signCanonicalManifest(manifestObj, privateKeyPem) {
  const canonicalString = JSON.stringify(manifestObj, Object.keys(manifestObj).sort());
  const signer = crypto.createSign('SHA256');
  signer.update(canonicalString);
  signer.end();
  return signer.sign(privateKeyPem, 'base64');
}

/**
 * Verifies an RSA-SHA256 PKI digital signature over a canonical manifest
 */
export function verifyCanonicalManifest(manifestObj, signatureBase64, publicKeyPem) {
  try {
    const canonicalString = JSON.stringify(manifestObj, Object.keys(manifestObj).sort());
    const verifier = crypto.createVerify('SHA256');
    verifier.update(canonicalString);
    verifier.end();
    return verifier.verify(publicKeyPem, signatureBase64, 'base64');
  } catch (err) {
    return false;
  }
}

/**
 * Wraps plain text content into a valid minimal binary PDF buffer
 */
export function wrapTextInPDFBuffer(title, text) {
  const sanitize = (str) => (str || '').replace(/[\(\)\\]/g, '\\$&').replace(/[\r\n]+/g, ' ');
  const safeTitle = sanitize(title);
  const rawLines = (text || '').split('\n').map(l => sanitize(l.trim())).filter(Boolean);
  if (rawLines.length === 0) rawLines.push('Standard Legal Document Content');

  const textCommands = rawLines.map(line => `(${line}) Tj T*`).join('\n');
  const streamBody = `BT\n/F1 16 Tf\n50 740 Td\n20 TL\n(${safeTitle}) Tj\nT* T*\n/F1 11 Tf\n14 TL\n${textCommands}\nET`;

  const header = '%PDF-1.4\n%';
  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`;
  const obj4 = `4 0 obj\n<< /Length ${Buffer.byteLength(streamBody, 'utf-8')} >>\nstream\n${streamBody}\nendstream\nendobj\n`;
  const obj5 = `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  // Dynamic xref byte offsets
  const offset1 = Buffer.byteLength(header, 'utf-8');
  const offset2 = offset1 + Buffer.byteLength(obj1, 'utf-8');
  const offset3 = offset2 + Buffer.byteLength(obj2, 'utf-8');
  const offset4 = offset3 + Buffer.byteLength(obj3, 'utf-8');
  const offset5 = offset4 + Buffer.byteLength(obj4, 'utf-8');
  const xrefOffset = offset5 + Buffer.byteLength(obj5, 'utf-8');

  const pad = (num) => String(num).padStart(10, '0');

  const xref = `xref\n0 6\n0000000000 65535 f \n${pad(offset1)} 00000 n \n${pad(offset2)} 00000 n \n${pad(offset3)} 00000 n \n${pad(offset4)} 00000 n \n${pad(offset5)} 00000 n \n`;
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer, 'utf-8');
}
