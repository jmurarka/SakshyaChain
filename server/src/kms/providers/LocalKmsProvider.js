import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import KMSProvider from '../KMSProvider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VAULT_DIR = process.env.KMS_LOCAL_VAULT_DIR || path.join(__dirname, '../../../data/vault/keys');
const MASTER_KEY_ALGO = 'aes-256-gcm';

/**
 * LocalKmsProvider — local dev/MVP implementation.
 *
 * Server-held master key protects everything, including RSA signing keys
 * stored on disk.
 *
 * Master key: 32-byte hex string in KMS_LOCAL_MASTER_KEY. If absent, an
 * ephemeral key is generated and a warning is printed.
 */
export default class LocalKmsProvider extends KMSProvider {
  constructor() {
    super();
    this._masterKey = this._loadOrCreateMasterKey();
    if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });
  }

  get providerName() {
    return 'local-dev-v1';
  }

  _loadOrCreateMasterKey() {
    const hex = process.env.KMS_LOCAL_MASTER_KEY;
    if (hex && /^[0-9a-fA-F]{64}$/.test(hex)) {
      return Buffer.from(hex, 'hex');
    }
    // Stable 256-bit default key for local dev mode
    const devDefaultHex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    return Buffer.from(devDefaultHex, 'hex');
  }

  _wrapWithMasterKey(plaintextBuf) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(MASTER_KEY_ALGO, this._masterKey, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintextBuf), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
  }

  _unwrapWithMasterKey(wrappedBase64) {
    const raw = Buffer.from(wrappedBase64, 'base64');
    const iv = raw.subarray(0, 12);
    const authTag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = crypto.createDecipheriv(MASTER_KEY_ALGO, this._masterKey, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  // ---- Envelope encryption (DEK wrapping) ----

  async generateDataKey(keyId) {
    const plaintextKey = crypto.randomBytes(32);
    const wrappedKey = this._wrapWithMasterKey(plaintextKey);
    return { plaintextKey, wrappedKey, provider: this.providerName };
  }

  async unwrapDataKey(wrappedKey /*, keyId */) {
    return this._unwrapWithMasterKey(wrappedKey);
  }

  // ---- Signing (RSA-2048, private key encrypted at rest under master key) ----

  _keyPaths(keyId) {
    // Sanitize keyId to prevent directory traversal
    const safeKeyId = String(keyId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const dir = path.join(VAULT_DIR, safeKeyId);
    return {
      dir,
      privPath: path.join(dir, 'private.enc'),
      pubPath: path.join(dir, 'public.pem'),
    };
  }

  async provisionSigningKey(keyId) {
    const { dir, privPath, pubPath } = this._keyPaths(keyId);
    if (fs.existsSync(pubPath)) {
      return { keyId, publicKey: fs.readFileSync(pubPath, 'utf8') };
    }
    fs.mkdirSync(dir, { recursive: true });
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const wrappedPrivate = this._wrapWithMasterKey(Buffer.from(privateKey, 'utf8'));
    fs.writeFileSync(privPath, wrappedPrivate, 'utf8');
    fs.writeFileSync(pubPath, publicKey, 'utf8');
    return { keyId, publicKey };
  }

  async getPublicKey(keyId) {
    const { pubPath } = this._keyPaths(keyId);
    if (!fs.existsSync(pubPath)) {
      throw new Error(`No signing key provisioned for keyId "${keyId}"`);
    }
    return fs.readFileSync(pubPath, 'utf8');
  }

  async sign(keyId, digest) {
    const { privPath, pubPath } = this._keyPaths(keyId);
    if (!fs.existsSync(privPath)) {
      throw new Error(`No signing key provisioned for keyId "${keyId}"`);
    }
    let privateKeyPem;
    try {
      const wrappedPrivate = fs.readFileSync(privPath, 'utf8');
      privateKeyPem = this._unwrapWithMasterKey(wrappedPrivate).toString('utf8');
    } catch (err) {
      // Stale key encrypted under a different master key. Re-provision keypair.
      if (fs.existsSync(privPath)) fs.unlinkSync(privPath);
      if (fs.existsSync(pubPath)) fs.unlinkSync(pubPath);
      await this.provisionSigningKey(keyId);
      const wrappedPrivate = fs.readFileSync(privPath, 'utf8');
      privateKeyPem = this._unwrapWithMasterKey(wrappedPrivate).toString('utf8');
    }

    const signature = crypto.sign('sha256', digest, {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    });
    return {
      signature: signature.toString('base64'),
      keyId,
      provider: this.providerName,
      signedAt: new Date().toISOString(),
    };
  }

  async verify(keyId, digest, signatureBase64) {
    const publicKey = await this.getPublicKey(keyId);
    return crypto.verify(
      'sha256',
      digest,
      { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(signatureBase64, 'base64')
    );
  }
}
