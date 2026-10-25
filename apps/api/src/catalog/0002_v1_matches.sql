-- Additive match tables. Safe to run again. competitions is unchanged.
CREATE TABLE IF NOT EXISTS matches (
  id text PRIMARY KEY, sport_id text NOT NULL, sport_slug text NOT NULL,
  competition_id text NOT NULL REFERENCES competitions (id),
  match_date date NOT NULL, round text NOT NULL,
  status text NOT NULL, source text NOT NULL, source_ref text,
  created_by text NOT NULL REFERENCES users (id),
  reviewed_by text REFERENCES users (id), published_at text,
  CONSTRAINT matches_id_sport UNIQUE (id, sport_slug),
  CONSTRAINT matches_sport FOREIGN KEY (sport_id, sport_slug) REFERENCES sports (id, slug),
  CONSTRAINT matches_status CHECK (status IN ('draft', 'review', 'published')),
  CONSTRAINT matches_source CHECK (source IN ('manual', 'import')),
  CONSTRAINT matches_draft CHECK (status <> 'draft' OR (reviewed_by IS NULL AND published_at IS NULL)),
  CONSTRAINT matches_review CHECK (status <> 'review' OR published_at IS NULL),
  CONSTRAINT matches_published CHECK (
    status <> 'published' OR (reviewed_by IS NOT NULL AND published_at IS NOT NULL)),
  CONSTRAINT matches_import CHECK (source <> 'import' OR source_ref IS NOT NULL),
  CONSTRAINT matches_manual CHECK (source <> 'manual' OR source_ref IS NULL),
  CONSTRAINT matches_source_ref UNIQUE (source, source_ref)
);
CREATE INDEX IF NOT EXISTS matches_date_sport ON matches (match_date, sport_id);
CREATE TABLE IF NOT EXISTS tennis_matches (
  match_id text PRIMARY KEY, sport_slug text NOT NULL,
  player_a_id text NOT NULL, player_a_sport text NOT NULL,
  player_b_id text NOT NULL, player_b_sport text NOT NULL,
  winner_id text NOT NULL, best_of integer NOT NULL, score jsonb NOT NULL, retired boolean,
  CONSTRAINT tennis_matches_sport CHECK (
    sport_slug = 'tennis' AND player_a_sport = 'tennis' AND player_b_sport = 'tennis'),
  CONSTRAINT tennis_matches_players CHECK (player_a_id <> player_b_id),
  CONSTRAINT tennis_matches_winner CHECK (winner_id IN (player_a_id, player_b_id)),
  CONSTRAINT tennis_matches_best CHECK (best_of IN (3, 5)),
  CONSTRAINT tennis_matches_match FOREIGN KEY (match_id, sport_slug) REFERENCES matches (id, sport_slug),
  CONSTRAINT tennis_matches_player_a FOREIGN KEY (player_a_id, player_a_sport) REFERENCES athletes (id, sport_slug),
  CONSTRAINT tennis_matches_player_b FOREIGN KEY (player_b_id, player_b_sport) REFERENCES athletes (id, sport_slug)
);
CREATE TABLE IF NOT EXISTS tennis_match_stats (
  match_id text NOT NULL REFERENCES tennis_matches (match_id),
  athlete_id text NOT NULL, athlete_sport text NOT NULL,
  aces integer NOT NULL, double_faults integer NOT NULL,
  first_serve_in integer NOT NULL, first_serve_total integer NOT NULL,
  first_serve_points_won integer NOT NULL, second_serve_points_won integer NOT NULL,
  second_serve_total integer NOT NULL, break_points_saved integer NOT NULL,
  break_points_faced integer NOT NULL, break_points_won integer NOT NULL,
  break_points_total integer NOT NULL, winners integer, unforced_errors integer,
  total_points_won integer NOT NULL,
  PRIMARY KEY (match_id, athlete_id),
  CONSTRAINT tennis_stats_sport CHECK (athlete_sport = 'tennis'),
  CONSTRAINT tennis_stats_athlete FOREIGN KEY (athlete_id, athlete_sport) REFERENCES athletes (id, sport_slug)
);
CREATE INDEX IF NOT EXISTS tennis_match_stats_athlete ON tennis_match_stats (athlete_id);
