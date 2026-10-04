-- Official (EduRank Team) notes + public/SEO fields.
ALTER TABLE notes ADD COLUMN is_official INTEGER NOT NULL DEFAULT 0;
ALTER TABLE notes ADD COLUMN slug TEXT;
ALTER TABLE notes ADD COLUMN body TEXT;
ALTER TABLE notes ADD COLUMN body_updated_at INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_slug ON notes (slug);

-- The hidden team account that owns official notes. It cannot log in (invalid
-- password hash) and is excluded from leaderboards (role != 'user').
INSERT OR IGNORE INTO users (id, email, password_hash, display_name, role, bio, referral_code, created_at)
VALUES (
  'edurank-team',
  'team@edurank.co.za',
  '!',
  'EduRank Team',
  'admin',
  'Official notes from the EduRank team.',
  'TEAM01',
  CAST(strftime('%s','now') AS INTEGER) * 1000
);
