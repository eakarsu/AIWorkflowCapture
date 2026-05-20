-- Workflow Capture & Replay schema
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(120) NOT NULL,
  name VARCHAR(120),
  role VARCHAR(30) DEFAULT 'commander',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_results (
  id SERIAL PRIMARY KEY,
  feature VARCHAR(80) NOT NULL,
  input JSONB,
  output JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_results_feature_created ON ai_results (feature, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  title VARCHAR(200),
  body TEXT,
  severity VARCHAR(20) DEFAULT 'info',
  source VARCHAR(80),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, read_at);

CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  resource_type VARCHAR(60),
  resource_id INTEGER,
  filename VARCHAR(255),
  original_name VARCHAR(255),
  mimetype VARCHAR(120),
  size_bytes INTEGER,
  uploaded_by VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120),
  url VARCHAR(500),
  secret VARCHAR(120),
  events TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER,
  event VARCHAR(120),
  payload JSONB,
  status_code INTEGER,
  response_body TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  app_name VARCHAR(255),
  intent TEXT,
  status VARCHAR(255),
  step_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS captured_steps (
  id SERIAL PRIMARY KEY,
  workflow_name VARCHAR(255),
  step_no INTEGER DEFAULT 0,
  semantic_label VARCHAR(255),
  element_hint TEXT,
  input_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS replay_runs (
  id SERIAL PRIMARY KEY,
  workflow_name VARCHAR(255),
  started_at TIMESTAMPTZ,
  status VARCHAR(255),
  duration_ms INTEGER DEFAULT 0,
  error_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS selector_library (
  id SERIAL PRIMARY KEY,
  app_name VARCHAR(255),
  semantic_label VARCHAR(255),
  css_selector VARCHAR(255),
  success_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS healing_events (
  id SERIAL PRIMARY KEY,
  workflow_name VARCHAR(255),
  step_no INTEGER DEFAULT 0,
  original_selector VARCHAR(255),
  patched_selector VARCHAR(255),
  confidence INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exceptions (
  id SERIAL PRIMARY KEY,
  workflow_name VARCHAR(255),
  step_no INTEGER DEFAULT 0,
  kind VARCHAR(255),
  status VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
