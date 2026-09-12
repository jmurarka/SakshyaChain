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
