-- Rendered PNG bytes per gallery slide. Safe to run again. 0001–0007 are unchanged.
ALTER TABLE gallery_slides ADD COLUMN IF NOT EXISTS png bytea;
