-- Per-day text colour for the countdown number overlay
-- 'white' (default) or 'black' — pick black when the photo is light
ALTER TABLE daily_content
  ADD COLUMN IF NOT EXISTS number_color text NOT NULL DEFAULT 'white';
