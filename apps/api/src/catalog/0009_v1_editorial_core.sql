-- Expand–contract: rename football match player rows, add ADR-010 core tables.
-- Safe to run again. 0001–0008 are unchanged.
DO $rename$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appearances'
      AND column_name = 'match_id'
  ) THEN
    ALTER TABLE appearances RENAME TO match_appearances;
    ALTER INDEX IF EXISTS appearances_athlete RENAME TO match_appearances_athlete;
    ALTER INDEX IF EXISTS appearances_pkey RENAME TO match_appearances_pkey;
  END IF;
END
$rename$;
ALTER TABLE match_appearances DROP CONSTRAINT IF EXISTS appearances_sport;
ALTER TABLE match_appearances DROP CONSTRAINT IF EXISTS match_appearances_sport;
ALTER TABLE match_appearances ADD CONSTRAINT match_appearances_sport CHECK (
  match_sport = 'football' AND athlete_sport = 'football');
ALTER TABLE match_appearances DROP CONSTRAINT IF EXISTS appearances_match;
ALTER TABLE match_appearances DROP CONSTRAINT IF EXISTS match_appearances_match;
ALTER TABLE match_appearances ADD CONSTRAINT match_appearances_match
  FOREIGN KEY (match_id, match_sport) REFERENCES matches (id, sport_slug);
ALTER TABLE match_appearances DROP CONSTRAINT IF EXISTS appearances_score;
ALTER TABLE match_appearances DROP CONSTRAINT IF EXISTS match_appearances_score;
ALTER TABLE match_appearances ADD CONSTRAINT match_appearances_score
  FOREIGN KEY (match_id) REFERENCES football_matches (match_id);
ALTER TABLE match_appearances DROP CONSTRAINT IF EXISTS appearances_athlete_sport;
ALTER TABLE match_appearances DROP CONSTRAINT IF EXISTS match_appearances_athlete_sport;
ALTER TABLE match_appearances ADD CONSTRAINT match_appearances_athlete_sport
  FOREIGN KEY (athlete_id, athlete_sport) REFERENCES athletes (id, sport_slug);
ALTER TABLE sports DROP CONSTRAINT IF EXISTS sports_slug;
ALTER TABLE sports ADD CONSTRAINT sports_slug CHECK (
  slug IN ('tennis', 'football', 'basketball'));
INSERT INTO sports (id, slug, name) VALUES
  ('sport-basketball', 'basketball', 'Basketball')
ON CONFLICT (id) DO NOTHING;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS club_name text;
CREATE TABLE IF NOT EXISTS national_teams (
  id text PRIMARY KEY, sport_id text NOT NULL, sport_slug text NOT NULL,
  slug text NOT NULL UNIQUE, name text NOT NULL, selection text NOT NULL,
  age_band text NOT NULL, sex text, country text NOT NULL,
  CONSTRAINT national_teams_id_sport UNIQUE (id, sport_slug),
  CONSTRAINT national_teams_sport FOREIGN KEY (sport_id, sport_slug)
    REFERENCES sports (id, slug),
  CONSTRAINT national_teams_sex CHECK (sex IS NULL OR sex IN ('open', 'women', 'men'))
);
CREATE INDEX IF NOT EXISTS national_teams_sport_slug ON national_teams (sport_slug);
CREATE TABLE IF NOT EXISTS appearances (
  id text PRIMARY KEY, sport_id text NOT NULL, sport_slug text NOT NULL,
  competition_id text NOT NULL REFERENCES competitions (id),
  athlete_id text, athlete_sport text, national_team_id text,
  opponent_label text NOT NULL, starts_at timestamptz NOT NULL, ends_at timestamptz,
  status text NOT NULL, result jsonb, creator_kind text NOT NULL,
  created_at timestamptz NOT NULL, updated_at timestamptz NOT NULL,
  CONSTRAINT appearances_id_sport UNIQUE (id, sport_slug),
  CONSTRAINT appearances_sport FOREIGN KEY (sport_id, sport_slug)
    REFERENCES sports (id, slug),
  CONSTRAINT appearances_sport_slug CHECK (
    sport_slug IN ('tennis', 'football', 'basketball')),
  CONSTRAINT appearances_status CHECK (
    status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  CONSTRAINT appearances_creator CHECK (creator_kind IN ('bot', 'manual')),
  CONSTRAINT appearances_participant CHECK (
    (athlete_id IS NOT NULL AND national_team_id IS NULL)
    OR (athlete_id IS NULL AND national_team_id IS NOT NULL)),
  CONSTRAINT appearances_athlete_fields CHECK (
    (athlete_id IS NULL AND athlete_sport IS NULL)
    OR (athlete_id IS NOT NULL AND athlete_sport IS NOT NULL
      AND athlete_sport = sport_slug)),
  CONSTRAINT appearances_athlete FOREIGN KEY (athlete_id, athlete_sport)
    REFERENCES athletes (id, sport_slug),
  CONSTRAINT appearances_national_team FOREIGN KEY (national_team_id, sport_slug)
    REFERENCES national_teams (id, sport_slug)
);
CREATE INDEX IF NOT EXISTS appearances_starts_sport ON appearances (starts_at, sport_slug);
CREATE INDEX IF NOT EXISTS appearances_athlete_starts ON appearances (athlete_id, starts_at);
CREATE INDEX IF NOT EXISTS appearances_team_starts ON appearances (national_team_id, starts_at);
CREATE INDEX IF NOT EXISTS appearances_status_starts ON appearances (status, starts_at);
CREATE TABLE IF NOT EXISTS lineup_entries (
  appearance_id text NOT NULL REFERENCES appearances (id),
  athlete_id text NOT NULL, athlete_sport text NOT NULL,
  started boolean NOT NULL, minutes integer, stats jsonb NOT NULL,
  PRIMARY KEY (appearance_id, athlete_id),
  CONSTRAINT lineup_entries_athlete FOREIGN KEY (athlete_id, athlete_sport)
    REFERENCES athletes (id, sport_slug)
);
CREATE INDEX IF NOT EXISTS lineup_entries_athlete ON lineup_entries (athlete_id);
