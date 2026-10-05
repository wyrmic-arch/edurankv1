-- Feature/improvement suggestions submitted by users.
CREATE TABLE IF NOT EXISTS suggestions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'idea', -- idea | bug | content | other
  status TEXT NOT NULL DEFAULT 'open',   -- open | planned | done | declined
  admin_note TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_suggestions_user ON suggestions (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions (status, created_at);
