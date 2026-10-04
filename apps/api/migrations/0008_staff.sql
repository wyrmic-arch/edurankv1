-- Staff: principal & teacher roles, invite codes, subject scoping, and
-- teacher note verifications.

CREATE TABLE IF NOT EXISTS staff_invites (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  school_id TEXT NOT NULL REFERENCES schools(id),
  role TEXT NOT NULL,
  subject_ids TEXT NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_by TEXT,
  used_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_staff_invites_code ON staff_invites (code);
CREATE INDEX IF NOT EXISTS idx_staff_invites_school ON staff_invites (school_id);

CREATE TABLE IF NOT EXISTS teacher_subjects (
  user_id TEXT NOT NULL REFERENCES users(id),
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  PRIMARY KEY (user_id, subject_id)
);

CREATE TABLE IF NOT EXISTS note_verifications (
  note_id TEXT NOT NULL REFERENCES notes(id),
  teacher_id TEXT NOT NULL REFERENCES users(id),
  verdict TEXT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (note_id, teacher_id)
);
