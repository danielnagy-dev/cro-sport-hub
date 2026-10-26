-- Seeks published matches for one sport. Safe to run again. 0001–0003 are unchanged.
CREATE INDEX IF NOT EXISTS matches_sport_status_date ON matches (sport_id, status, match_date);
