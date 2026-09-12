-- SakshyaChain Supabase PostgreSQL Database Schema

-- Drop existing tables to clear any mismatched old schema
DROP TABLE IF EXISTS manifests CASCADE;
DROP TABLE IF EXISTS revocations CASCADE;
DROP TABLE IF EXISTS ledger_blocks CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(100) NOT NULL,
  role_title VARCHAR(255),
  department VARCHAR(50) NOT NULL,
  department_name VARCHAR(255),
  clearance_level INT NOT NULL DEFAULT 1,
  public_key TEXT,
  private_key TEXT,
  assigned_cases JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Cases Table
CREATE TABLE cases (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  
  fir_number VARCHAR(100),
  status VARCHAR(100) NOT NULL DEFAULT 'UNDER_TRIAL',
  lead_investigator VARCHAR(255),
  prosecutor VARCHAR(255),
  presiding_judge VARCHAR(255),
  date_filed VARCHAR(100),
  description TEXT,
  clearance_required INT NOT NULL DEFAULT 1,
  departments_access JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Documents Table
CREATE TABLE documents (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  case_id VARCHAR(64) NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  case_title VARCHAR(255),
  category VARCHAR(100) NOT NULL,
  clearance_level INT NOT NULL DEFAULT 1,
  author_id VARCHAR(64) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_role VARCHAR(100),
  department VARCHAR(50) NOT NULL,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  status VARCHAR(100) NOT NULL DEFAULT 'VERIFIED',
  extracted_text TEXT,
  mime_type VARCHAR(100) DEFAULT 'application/pdf',
  original_file_name VARCHAR(255),
  payload_hash VARCHAR(64) NOT NULL,
  file_size BIGINT,
  encryption_metadata JSONB,
  signature JSONB,
  ai_entities JSONB DEFAULT '[]'::jsonb,
  version_history JSONB DEFAULT '[]'::jsonb,
  chain_of_custody JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Manifests (PKI Signatures) Table
CREATE TABLE manifests (
  manifest_id VARCHAR(64) PRIMARY KEY,
  document_id VARCHAR(64) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_id VARCHAR(20) NOT NULL,
  sha256 VARCHAR(64) NOT NULL,
  signer_id VARCHAR(64) NOT NULL,
  signature_id VARCHAR(64) NOT NULL,
  signature TEXT NOT NULL,
  signature_provider VARCHAR(100),
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  metadata JSONB
);

-- 5. Revocations Table
CREATE TABLE revocations (
  signature_id VARCHAR(64) PRIMARY KEY,
  reason TEXT NOT NULL,
  revoked_by VARCHAR(255) NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Audit Ledger Blocks Table
CREATE TABLE ledger_blocks (
  block_index INT PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  actor_id VARCHAR(64) NOT NULL,
  actor_name VARCHAR(255) NOT NULL,
  case_id VARCHAR(64),
  doc_id VARCHAR(64),
  doc_hash VARCHAR(64),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  previous_hash VARCHAR(64) NOT NULL,
  current_hash VARCHAR(64) NOT NULL,
  nonce BIGINT DEFAULT 0,
  details JSONB
);

-- 7. Disable Row Level Security (RLS) for seamless API backend write access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE manifests DISABLE ROW LEVEL SECURITY;
ALTER TABLE revocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_blocks DISABLE ROW LEVEL SECURITY;

