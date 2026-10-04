-- Note ownership / takedown: abuse & stolen-note reports.
CREATE TABLE IF NOT EXISTS note_reports (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL REFERENCES notes(id),
  reporter_id TEXT NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at INTEGER NOT NULL,
  resolved_by TEXT,
  resolved_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_reports_note ON note_reports (note_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON note_reports (status);
