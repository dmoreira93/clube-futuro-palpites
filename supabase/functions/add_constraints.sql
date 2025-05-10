
-- Add unique constraint to user_points to prevent duplicate entries
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_points_user_id_match_id_key'
  ) THEN
    ALTER TABLE user_points 
    ADD CONSTRAINT user_points_user_id_match_id_key 
    UNIQUE (user_id, match_id);
  END IF;
END $$;
