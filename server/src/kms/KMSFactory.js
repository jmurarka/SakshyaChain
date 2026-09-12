import LocalKmsProvider from './providers/LocalKmsProvider.js';
import AwsKmsProvider from './providers/AwsKmsProvider.js';

/**
 * KMSFactory — KMS provider selection.
 *
 * Configured via process.env.KMS_PROVIDER ('local' or 'aws').
 */
let _instance = null;

export function getKmsProvider() {
  if (_instance) return _instance;

  const providerKey = (process.env.KMS_PROVIDER || 'local').toLowerCase();

  switch (providerKey) {
    case 'local': {
      _instance = new LocalKmsProvider();
      break;
    }
    case 'aws': {
      _instance = new AwsKmsProvider();
      break;
    }
    default:
      throw new Error(
        `Unknown KMS_PROVIDER "${providerKey}". Expected "local" or "aws".`
      );
  }

  console.log(`[KMSFactory] Active KMS provider: ${_instance.providerName}`);
  return _instance;
}

export function _resetForTests() {
  _instance = null;
}

export default { getKmsProvider, _resetForTests };
