-- Supporting indexes for hot leaderboard + upvote anti-farm queries.
-- (weekly per-subject leaderboard scans points_ledger by subject + time;
--  the upvote reward guard scans by reason + note.)
CREATE INDEX IF NOT EXISTS idx_ledger_subject_created ON points_ledger (subject_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_reason_note ON points_ledger (reason, note_id);
