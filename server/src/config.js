import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'sakshya_chain_jwt_access_secret_2026_super_secure_9921',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'sakshya_chain_jwt_refresh_secret_2026_super_secure_8812',
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '8h',
  KMS_MASTER_KEY_HEX: process.env.KMS_MASTER_KEY_HEX || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  MFA_OTP_TTL_SECONDS: 120, // 2 Minutes OTP TTL
  MFA_MAX_ATTEMPTS: 3,
  BREAK_GLASS_GRANT_MINUTES: 30,
  DATA_DIR: path.join(__dirname, '../data'),
  VAULT_DIR: path.join(__dirname, '../data/vault'),
  DB_FILE: path.join(__dirname, '../data/db.json'),
  LEDGER_FILE: path.join(__dirname, '../data/ledger.json'),
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://gksffenmjzibtiqcuhxp.supabase.co',
  SUPABASE_KEY: process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_zmj3nBPCOw232xyCqUw0lg_Y19a6ae_'
};
