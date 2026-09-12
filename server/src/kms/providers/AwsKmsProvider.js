import KMSProvider from '../KMSProvider.js';

/**
 * AwsKmsProvider — production implementation backed by real AWS KMS.
 *
 * - Envelope encryption: GenerateDataKey/Decrypt call out to a symmetric CMK.
 * - Digital signatures: uses an ASYMMETRIC CMK (RSA_2048) with the Sign API.
 *   The private key is generated inside, and never leaves, AWS KMS/CloudHSM.
 */
export default class AwsKmsProvider extends KMSProvider {
  constructor() {
    super();
    let KMSClient, GenerateDataKeyCommand, DecryptCommand, SignCommand, VerifyCommand, GetPublicKeyCommand;
    try {
      // Dynamic import wrapper or throw if @aws-sdk/client-kms not installed
      // eslint-disable-next-line global-require
      const awsKms = require('@aws-sdk/client-kms');
      ({ KMSClient, GenerateDataKeyCommand, DecryptCommand, SignCommand, VerifyCommand, GetPublicKeyCommand } = awsKms);
    } catch (err) {
      throw new Error(
        'AwsKmsProvider requires the "@aws-sdk/client-kms" package. ' +
        'Install it with: npm install @aws-sdk/client-kms\n' +
        `Original error: ${err.message}`
      );
    }
    this._cmds = { GenerateDataKeyCommand, DecryptCommand, SignCommand, VerifyCommand, GetPublicKeyCommand };
    this._client = new KMSClient({ region: process.env.AWS_REGION || 'ap-south-1' });
    this._symmetricKeyId = requireEnv('KMS_SYMMETRIC_KEY_ID');
    this._signingKeyMap = JSON.parse(process.env.KMS_SIGNING_KEY_MAP_JSON || '{}');
  }

  get providerName() {
    return `aws-kms-${process.env.AWS_REGION || 'ap-south-1'}`;
  }

  _resolveSigningKeyArn(keyId) {
    const arn = this._signingKeyMap[keyId];
    if (!arn) {
      throw new Error(
        `No AWS KMS signing key ARN mapped for keyId "${keyId}". ` +
        `Provision a CMK for this user and add it to KMS_SIGNING_KEY_MAP_JSON ` +
        `(or the signing_keys DB table in production).`
      );
    }
    return arn;
  }

  // ---- Envelope encryption ----

  async generateDataKey(/* keyId */) {
    const { GenerateDataKeyCommand } = this._cmds;
    const res = await this._client.send(
      new GenerateDataKeyCommand({ KeyId: this._symmetricKeyId, KeySpec: 'AES_256' })
    );
    return {
      plaintextKey: Buffer.from(res.Plaintext),
      wrappedKey: Buffer.from(res.CiphertextBlob).toString('base64'),
      provider: this.providerName,
    };
  }

  async unwrapDataKey(wrappedKey /*, keyId */) {
    const { DecryptCommand } = this._cmds;
    const res = await this._client.send(
      new DecryptCommand({
        CiphertextBlob: Buffer.from(wrappedKey, 'base64'),
        KeyId: this._symmetricKeyId,
      })
    );
    return Buffer.from(res.Plaintext);
  }

  // ---- Signing — private key never leaves AWS KMS ----

  async provisionSigningKey(keyId) {
    throw new Error(
      `provisionSigningKey is not supported at runtime for AwsKmsProvider. ` +
      `Provision a CMK (KeyUsage=SIGN_VERIFY, KeySpec=RSA_2048) via IaC for ` +
      `keyId "${keyId}", then add its ARN to KMS_SIGNING_KEY_MAP_JSON.`
    );
  }

  async getPublicKey(keyId) {
    const { GetPublicKeyCommand } = this._cmds;
    const arn = this._resolveSigningKeyArn(keyId);
    const res = await this._client.send(new GetPublicKeyCommand({ KeyId: arn }));
    const der = Buffer.from(res.PublicKey);
    const b64 = der.toString('base64').match(/.{1,64}/g).join('\n');
    return `-----BEGIN PUBLIC KEY-----\n${b64}\n-----END PUBLIC KEY-----\n`;
  }

  async sign(keyId, digest) {
    const { SignCommand } = this._cmds;
    const arn = this._resolveSigningKeyArn(keyId);
    const res = await this._client.send(
      new SignCommand({
        KeyId: arn,
        Message: digest,
        MessageType: 'DIGEST',
        SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256',
      })
    );
    return {
      signature: Buffer.from(res.Signature).toString('base64'),
      keyId,
      provider: this.providerName,
      signedAt: new Date().toISOString(),
    };
  }

  async verify(keyId, digest, signatureBase64) {
    const { VerifyCommand } = this._cmds;
    const arn = this._resolveSigningKeyArn(keyId);
    const res = await this._client.send(
      new VerifyCommand({
        KeyId: arn,
        Message: digest,
        MessageType: 'DIGEST',
        Signature: Buffer.from(signatureBase64, 'base64'),
        SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256',
      })
    );
    return res.SignatureValid === true;
  }
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}
