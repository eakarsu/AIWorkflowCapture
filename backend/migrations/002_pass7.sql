-- Pass 7 — full backlog: recording substrate, scopes, audit, marketplace

-- Top-priority recording substrate (was missing entirely)
CREATE TABLE IF NOT EXISTS recording_sessions (
  id SERIAL PRIMARY KEY,
  workflow_name VARCHAR(255),
  operator VARCHAR(150),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status VARCHAR(40) DEFAULT 'recording',
  app_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rec_sessions_workflow ON recording_sessions (workflow_name);

CREATE TABLE IF NOT EXISTS frames (
  id SERIAL PRIMARY KEY,
  session_id INTEGER,
  seq INTEGER DEFAULT 0,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  image_ref VARCHAR(500),
  ocr_text TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_frames_session_seq ON frames (session_id, seq);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  session_id INTEGER,
  seq INTEGER DEFAULT 0,
  ts TIMESTAMPTZ DEFAULT NOW(),
  kind VARCHAR(40),
  target_selector VARCHAR(500),
  value TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_session_seq ON events (session_id, seq);

-- Permission scopes (per-user, per-workflow or app)
CREATE TABLE IF NOT EXISTS permission_scopes (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(150),
  scope_type VARCHAR(40),
  scope_value VARCHAR(255),
  can_view BOOLEAN DEFAULT TRUE,
  can_replay BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_perm_scopes_user ON permission_scopes (user_email);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  actor VARCHAR(150),
  action VARCHAR(80),
  resource_type VARCHAR(60),
  resource_id VARCHAR(80),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_created ON audit_log (actor, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log (resource_type, resource_id);

-- Marketplace listings (shareable workflows)
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id SERIAL PRIMARY KEY,
  workflow_name VARCHAR(255),
  publisher VARCHAR(150),
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(120),
  version VARCHAR(40) DEFAULT '1.0.0',
  rating NUMERIC(3,2) DEFAULT 0,
  install_count INTEGER DEFAULT 0,
  status VARCHAR(40) DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace_listings (category);

CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER,
  reviewer VARCHAR(150),
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_listing ON marketplace_reviews (listing_id);
