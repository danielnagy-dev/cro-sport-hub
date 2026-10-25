CREATE TABLE IF NOT EXISTS sports (
  id text PRIMARY KEY, slug text NOT NULL UNIQUE, name text NOT NULL,
  CONSTRAINT sports_slug CHECK (slug IN ('tennis', 'football')),
  CONSTRAINT sports_id_slug UNIQUE (id, slug)
);
CREATE TABLE IF NOT EXISTS competitions (
  id text PRIMARY KEY, sport_id text NOT NULL REFERENCES sports (id),
  name text NOT NULL, season text NOT NULL, level text NOT NULL,
  CONSTRAINT competitions_level CHECK (level IN ('domestic', 'international'))
);
CREATE TABLE IF NOT EXISTS teams (
  id text PRIMARY KEY, sport_id text NOT NULL, sport_slug text NOT NULL,
  slug text NOT NULL UNIQUE, name text NOT NULL, short_name text NOT NULL,
  country text NOT NULL, crest_url text,
  CONSTRAINT teams_football CHECK (sport_slug = 'football'),
  CONSTRAINT teams_sport FOREIGN KEY (sport_id, sport_slug) REFERENCES sports (id, slug)
);
CREATE TABLE IF NOT EXISTS athletes (
  id text PRIMARY KEY, slug text NOT NULL UNIQUE, name text NOT NULL,
  sport_id text NOT NULL REFERENCES sports (id), sport_slug text NOT NULL,
  country text NOT NULL, birth_year integer, position text, photo_url text,
  CONSTRAINT athletes_id_sport UNIQUE (id, sport_slug),
  CONSTRAINT athletes_sport FOREIGN KEY (sport_id, sport_slug) REFERENCES sports (id, slug)
);
CREATE TABLE IF NOT EXISTS athlete_teams (
  athlete_id text NOT NULL, team_id text NOT NULL REFERENCES teams (id),
  from_date date NOT NULL, to_date date, athlete_sport text NOT NULL,
  PRIMARY KEY (athlete_id, team_id, from_date),
  CONSTRAINT athlete_teams_football CHECK (athlete_sport = 'football'),
  CONSTRAINT athlete_teams_order CHECK (to_date IS NULL OR to_date >= from_date),
  CONSTRAINT athlete_teams_athlete FOREIGN KEY (athlete_id, athlete_sport) REFERENCES athletes (id, sport_slug)
);
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY, role text NOT NULL,
  CONSTRAINT users_role CHECK (role IN ('editor', 'admin'))
);
INSERT INTO sports (id, slug, name) VALUES
  ('sport-tennis', 'tennis', 'Tennis'),
  ('sport-football', 'football', 'Football')
ON CONFLICT (id) DO NOTHING;
