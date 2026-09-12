import { getKmsProvider } from './KMSFactory.js';

/**
 * Facade module for KMS services.
 * All application code imports from here rather than concrete providers.
 */

export async function generateDataKey(keyId) {
  return getKmsProvider().generateDataKey(keyId);
}

export async function unwrapDataKey(wrappedKey, keyId) {
  return getKmsProvider().unwrapDataKey(wrappedKey, keyId);
}

export async function provisionSigningKey(keyId) {
  return getKmsProvider().provisionSigningKey(keyId);
}

export async function getPublicKey(keyId) {
  return getKmsProvider().getPublicKey(keyId);
}

export async function sign(keyId, digest) {
  return getKmsProvider().sign(keyId, digest);
}

export async function verify(keyId, digest, signatureBase64) {
  return getKmsProvider().verify(keyId, digest, signatureBase64);
}

export function providerName() {
  return getKmsProvider().providerName;
}

export default {
  generateDataKey,
  unwrapDataKey,
  provisionSigningKey,
  getPublicKey,
  sign,
  verify,
  providerName,
};
