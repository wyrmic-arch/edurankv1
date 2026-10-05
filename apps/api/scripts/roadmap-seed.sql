-- Seed a few roadmap entries so the public roadmap isn't empty on day one.
-- Authored by the team account. Idempotent (INSERT OR IGNORE by id).
INSERT OR IGNORE INTO suggestions (id, user_id, title, body, category, status, created_at, updated_at) VALUES
 ('seed-road-1','edurank-team','Airtime & data vouchers','Earn real rewards: cash your PTS into airtime or data vouchers — no bank account needed.','idea','planned',CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
 ('seed-road-2','edurank-team','Ratings & reviews','Rate notes you have unlocked, so the best material rises to the top.','idea','planned',CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
 ('seed-road-3','edurank-team','Tutor marketplace','Find and book tutors from your own school, paid with PTS.','idea','planned',CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
 ('seed-road-4','edurank-team','Free official notes','Original CAPS-aligned notes for Grades 11–12, free and public.','content','done',CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
 ('seed-road-5','edurank-team','Ideas & feedback board','Submit improvement ideas and follow them onto this roadmap.','idea','done',CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000);
