-- Optional personalization blob (dashboard modal → enrollment bridge)
ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS personalization_data jsonb;
