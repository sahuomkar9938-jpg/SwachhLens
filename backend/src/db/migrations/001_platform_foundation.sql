ALTER TABLE users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS ai_category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 100)),
  ADD COLUMN IF NOT EXISTS ai_volume VARCHAR(20),
  ADD COLUMN IF NOT EXISTS ai_severity VARCHAR(20),
  ADD COLUMN IF NOT EXISTS ai_objects_detected JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_estimated_count INTEGER CHECK (ai_estimated_count IS NULL OR ai_estimated_count >= 0),
  ADD COLUMN IF NOT EXISTS ai_condition TEXT,
  ADD COLUMN IF NOT EXISTS ai_clean_or_dirty VARCHAR(30),
  ADD COLUMN IF NOT EXISTS ai_wet_or_dry VARCHAR(30),
  ADD COLUMN IF NOT EXISTS ai_recyclable BOOLEAN,
  ADD COLUMN IF NOT EXISTS ai_amount VARCHAR(20),
  ADD COLUMN IF NOT EXISTS ai_disposal_recommendation TEXT,
  ADD COLUMN IF NOT EXISTS ai_description TEXT,
  ADD COLUMN IF NOT EXISTS ai_model VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ai_status VARCHAR(30) NOT NULL DEFAULT 'unavailable',
  ADD COLUMN IF NOT EXISTS duplicate_candidate BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS duplicate_of_report_id INTEGER REFERENCES reports(id),
  ADD COLUMN IF NOT EXISTS assigned_worker_id INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS assigned_authority_id INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;

ALTER TABLE reports
  ALTER COLUMN status SET DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cleanup_proofs (
  id SERIAL PRIMARY KEY,
  report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  worker_id INTEGER NOT NULL REFERENCES users(id),
  image_url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS reports_user_created_idx ON reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_status_priority_idx ON reports(status, priority);
CREATE INDEX IF NOT EXISTS reports_location_created_idx ON reports(latitude, longitude, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_worker_idx ON reports(assigned_worker_id, status);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications(user_id, is_read, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS reports_set_updated_at ON reports;
CREATE TRIGGER reports_set_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
