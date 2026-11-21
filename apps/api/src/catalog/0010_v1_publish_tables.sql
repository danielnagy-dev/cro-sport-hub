-- Phase C slice 3: publish slots, network posts, slot clocks, sources.
-- Safe to run again. 0001–0009 are unchanged.
CREATE TABLE IF NOT EXISTS publish_slot_clocks (
  id text PRIMARY KEY,
  label text NOT NULL,
  clock_time time NOT NULL,
  sort_order integer NOT NULL,
  active boolean NOT NULL DEFAULT true
);
INSERT INTO publish_slot_clocks (id, label, clock_time, sort_order, active) VALUES
  ('slot-clock-1530', '15:30', '15:30', 1, true),
  ('slot-clock-2200', '22:00', '22:00', 2, true)
ON CONFLICT (id) DO NOTHING;
CREATE TABLE IF NOT EXISTS publish_slots (
  id text PRIMARY KEY,
  slot_date date NOT NULL,
  slot_clock_id text NOT NULL REFERENCES publish_slot_clocks (id),
  status text NOT NULL,
  slide_order jsonb NOT NULL DEFAULT '[]',
  creator_kind text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT publish_slots_date_clock UNIQUE (slot_date, slot_clock_id),
  CONSTRAINT publish_slots_status CHECK (
    status IN (
      'planned',
      'waiting_for_data',
      'ready_for_review',
      'approved',
      'published',
      'skipped',
      'error'
    )),
  CONSTRAINT publish_slots_creator CHECK (creator_kind IN ('bot', 'manual'))
);
CREATE INDEX IF NOT EXISTS publish_slots_date_status ON publish_slots (slot_date, status);
CREATE INDEX IF NOT EXISTS publish_slots_status_date ON publish_slots (status, slot_date);
CREATE TABLE IF NOT EXISTS network_posts (
  id text PRIMARY KEY,
  publish_slot_id text NOT NULL REFERENCES publish_slots (id),
  network text NOT NULL,
  body_text text NOT NULL DEFAULT '',
  status text NOT NULL,
  external_post_id text,
  creator_kind text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CONSTRAINT network_posts_slot_network UNIQUE (publish_slot_id, network),
  CONSTRAINT network_posts_network CHECK (network IN ('instagram', 'facebook', 'x')),
  CONSTRAINT network_posts_status CHECK (
    status IN (
      'planned',
      'ready_for_review',
      'approved',
      'published',
      'skipped',
      'error'
    )),
  CONSTRAINT network_posts_creator CHECK (creator_kind IN ('bot', 'manual'))
);
CREATE INDEX IF NOT EXISTS network_posts_status ON network_posts (status);
CREATE INDEX IF NOT EXISTS network_posts_slot ON network_posts (publish_slot_id);
CREATE TABLE IF NOT EXISTS sources (
  id text PRIMARY KEY,
  url text NOT NULL,
  fetched_at timestamptz NOT NULL,
  creator_kind text NOT NULL,
  created_at timestamptz NOT NULL,
  CONSTRAINT sources_creator CHECK (creator_kind IN ('bot', 'manual'))
);
CREATE TABLE IF NOT EXISTS appearance_sources (
  appearance_id text NOT NULL REFERENCES appearances (id),
  source_id text NOT NULL REFERENCES sources (id),
  field_path text,
  disagrees boolean NOT NULL DEFAULT false,
  PRIMARY KEY (appearance_id, source_id)
);
CREATE INDEX IF NOT EXISTS appearance_sources_source ON appearance_sources (source_id);
