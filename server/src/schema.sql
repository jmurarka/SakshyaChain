-- SakshyaChain Supabase PostgreSQL Database Schema

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS cases (
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
CREATE TABLE IF NOT EXISTS documents (
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
CREATE TABLE IF NOT EXISTS manifests (
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
CREATE TABLE IF NOT EXISTS revocations (
  signature_id VARCHAR(64) PRIMARY KEY,
  reason TEXT NOT NULL,
  revoked_by VARCHAR(255) NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Audit Events (The Blocks)
CREATE TABLE IF NOT EXISTS audit_events (
  event_id        UUID PRIMARY KEY,
  document_id     UUID NOT NULL,
  case_id         UUID NOT NULL,
  version_id      UUID,
  action          TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  user_role       TEXT NOT NULL,
  timestamp       TIMESTAMPTZ NOT NULL,
  data_hash       TEXT NOT NULL,
  parent_hashes   TEXT[] NOT NULL,
  event_hash      TEXT NOT NULL,
  metadata        JSONB
);

-- 7. Audit Edges (The Parent Links)
CREATE TABLE IF NOT EXISTS audit_edges (
  child_id   UUID NOT NULL REFERENCES audit_events(event_id),
  parent_id  UUID NOT NULL REFERENCES audit_events(event_id),
  PRIMARY KEY (child_id, parent_id)
);

-- 8. Audit Anchors (Daily Blockchain Anchors)
CREATE TABLE IF NOT EXISTS audit_anchors (
  anchor_id      UUID PRIMARY KEY,
  merkle_root    TEXT NOT NULL,
  from_event_id  UUID NOT NULL,
  to_event_id    UUID NOT NULL,
  anchored_at    TIMESTAMPTZ NOT NULL,
  fabric_tx_id   TEXT NOT NULL
);

