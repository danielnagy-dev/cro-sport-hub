-- Additive football tables. Safe to run again. matches and the tennis tables are unchanged.
CREATE TABLE IF NOT EXISTS football_matches (
  match_id text PRIMARY KEY, sport_slug text NOT NULL,
  home_team_id text NOT NULL REFERENCES teams (id),
  away_team_id text NOT NULL REFERENCES teams (id),
  home_goals integer NOT NULL, away_goals integer NOT NULL,
  CONSTRAINT football_matches_sport CHECK (sport_slug = 'football'),
  CONSTRAINT football_matches_clubs CHECK (home_team_id <> away_team_id),
  CONSTRAINT football_matches_match FOREIGN KEY (match_id, sport_slug) REFERENCES matches (id, sport_slug)
);
CREATE TABLE IF NOT EXISTS appearances (
  match_id text NOT NULL, match_sport text NOT NULL,
  athlete_id text NOT NULL, athlete_sport text NOT NULL,
  team_id text NOT NULL REFERENCES teams (id),
  started boolean NOT NULL, minutes integer NOT NULL,
  goals integer NOT NULL, assists integer NOT NULL,
  yellow_cards integer NOT NULL, red_card boolean NOT NULL,
  PRIMARY KEY (match_id, athlete_id),
  CONSTRAINT appearances_sport CHECK (match_sport = 'football' AND athlete_sport = 'football'),
  CONSTRAINT appearances_match FOREIGN KEY (match_id, match_sport) REFERENCES matches (id, sport_slug),
  CONSTRAINT appearances_score FOREIGN KEY (match_id) REFERENCES football_matches (match_id),
  CONSTRAINT appearances_athlete_sport FOREIGN KEY (athlete_id, athlete_sport) REFERENCES athletes (id, sport_slug)
);
CREATE INDEX IF NOT EXISTS appearances_athlete ON appearances (athlete_id);
