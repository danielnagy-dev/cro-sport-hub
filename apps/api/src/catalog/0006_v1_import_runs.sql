-- Import run log. Safe to run again. 0001–0005 are unchanged.
CREATE TABLE IF NOT EXISTS import_runs (
  id text PRIMARY KEY,
  started_at text NOT NULL,
  finished_at text NOT NULL,
  created_count integer NOT NULL,
  updated_count integer NOT NULL,
  skipped_count integer NOT NULL,
  error text NOT NULL
);
