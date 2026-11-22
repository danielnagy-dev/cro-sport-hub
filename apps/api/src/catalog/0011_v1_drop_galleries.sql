-- Drop unused gallery catalog tables after Phase H removed every writer.
-- Safe to run again. 0001–0010 are unchanged.
DROP TABLE IF EXISTS gallery_slides;
DROP TABLE IF EXISTS galleries;
