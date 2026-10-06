-- Live presence: one row per open browser (anonymous client id), refreshed by
-- a heartbeat every ~30s while the tab is visible. "Online now" is the count of
-- rows whose last_seen is inside the trailing window, so a row that goes stale
-- simply drops out of the count and is pruned later.
CREATE TABLE IF NOT EXISTS presence (
  client_id TEXT PRIMARY KEY,
  user_id TEXT,
  path TEXT,
  first_seen INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON presence (last_seen);
