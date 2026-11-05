-- Draft galleries and slide snapshots. Safe to run again. 0001–0006 are unchanged.
CREATE TABLE IF NOT EXISTS galleries (
  id text PRIMARY KEY,
  status text NOT NULL,
  created_by text NOT NULL,
  reviewed_by text,
  published_at text,
  created_at text NOT NULL
);
CREATE TABLE IF NOT EXISTS gallery_slides (
  gallery_id text NOT NULL REFERENCES galleries (id),
  slide_index integer NOT NULL,
  match_id text NOT NULL,
  caption text,
  payload jsonb NOT NULL,
  PRIMARY KEY (gallery_id, slide_index)
);
