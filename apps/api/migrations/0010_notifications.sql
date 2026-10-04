-- In-app notifications + daily email digest.
ALTER TABLE users ADD COLUMN notify_email INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN last_digest_at INTEGER;

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  link TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  read_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, read_at);
