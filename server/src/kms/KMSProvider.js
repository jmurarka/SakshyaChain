/**
 * KMSProvider — abstract contract every key-management backend must implement.
 *
 * Seam that lets SākshyaChain swap between:
 *   Dev/MVP:    LocalKmsProvider   (master key in env, RSA keys encrypted on disk)
 *   Production: AwsKmsProvider     (AES key wrapping + RSA signing inside AWS KMS/CloudHSM)
 */

export default class KMSProvider {
  /** Machine-readable provider identity logged into audit events. */
  get providerName() {
    throw new Error('KMSProvider.providerName must be implemented by subclass');
  }

  /**
   * Generate a new Data Encryption Key (DEK) for envelope encryption.
   * @param {string} keyId
   * @returns {Promise<{plaintextKey: Buffer, wrappedKey: string, provider: string}>}
   */
  async generateDataKey(keyId) {
    throw new Error('Not implemented: generateDataKey');
  }

  /**
   * Unwrap a previously wrapped DEK for decryption.
   * @param {string} wrappedKey
   * @param {string} keyId
   * @returns {Promise<Buffer>}
   */
  async unwrapDataKey(wrappedKey, keyId) {
    throw new Error('Not implemented: unwrapDataKey');
  }

  /**
   * Sign a SHA-256 digest using an asymmetric signing key.
   * Private key material never leaves this method's boundary.
   * @param {string} keyId
   * @param {Buffer} digest
   * @returns {Promise<{signature: string, keyId: string, provider: string, signedAt: string}>}
   */
  async sign(keyId, digest) {
    throw new Error('Not implemented: sign');
  }

  /**
   * Verify a signature against a digest.
   * @returns {Promise<boolean>}
   */
  async verify(keyId, digest, signatureBase64) {
    throw new Error('Not implemented: verify');
  }

  /**
   * Return the public key (SPKI PEM) for external third-party verification.
   * @returns {Promise<string>} PEM-encoded public key
   */
  async getPublicKey(keyId) {
    throw new Error('Not implemented: getPublicKey');
  }

  /**
   * Provision a new signing keypair for a signer.
   * @returns {Promise<{keyId: string, publicKey: string}>}
   */
  async provisionSigningKey(keyId) {
    throw new Error('Not implemented: provisionSigningKey');
  }
}
