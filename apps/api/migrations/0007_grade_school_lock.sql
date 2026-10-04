-- Grade lock (per academic year) + hard school lock, and note provenance fields.

-- users: grade lifecycle + school lock
ALTER TABLE users ADD COLUMN grade_year INTEGER;
ALTER TABLE users ADD COLUMN grade_set_at INTEGER;
ALTER TABLE users ADD COLUMN held_back INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN graduated_at INTEGER;
ALTER TABLE users ADD COLUMN school_locked_at INTEGER;

-- notes: school denormalization + provenance + license
ALTER TABLE notes ADD COLUMN school_id TEXT;
ALTER TABLE notes ADD COLUMN content_hash TEXT;
ALTER TABLE notes ADD COLUMN license TEXT NOT NULL DEFAULT 'all-rights-reserved';

-- Backfill: treat existing grade/school choices as already committed.
UPDATE users
   SET grade_year = CAST(strftime('%Y', created_at / 1000, 'unixepoch') AS INTEGER),
       grade_set_at = created_at
 WHERE grade IS NOT NULL;

UPDATE users SET school_locked_at = created_at WHERE school_id IS NOT NULL;

UPDATE notes
   SET school_id = (SELECT u.school_id FROM users u WHERE u.id = notes.uploader_id)
 WHERE school_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_grade ON users (grade);
CREATE INDEX IF NOT EXISTS idx_notes_grade ON notes (grade);
CREATE INDEX IF NOT EXISTS idx_notes_school ON notes (school_id);
CREATE INDEX IF NOT EXISTS idx_notes_content_hash ON notes (content_hash);
