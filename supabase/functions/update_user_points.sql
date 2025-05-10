
-- Create function to update user points for a specific match
CREATE OR REPLACE FUNCTION public.update_user_points_for_match(match_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  match_record RECORD;
  prediction_record RECORD;
  points_earned INT;
  points_type TEXT;
BEGIN
  -- Get match result
  SELECT INTO match_record * FROM matches WHERE id = match_id_param;
  
  IF match_record.is_finished = FALSE OR match_record.home_score IS NULL OR match_record.away_score IS NULL THEN
    RAISE EXCEPTION 'Match is not finished or scores are not set';
  END IF;
  
  -- Get scoring criteria
  DECLARE
    exact_score INT;
    winner INT;
    partial_score INT;
  BEGIN
    SELECT points INTO exact_score FROM scoring_criteria WHERE name = 'Placar exato' LIMIT 1;
    SELECT points INTO winner FROM scoring_criteria WHERE name = 'Acertar vencedor' LIMIT 1;
    SELECT points INTO partial_score FROM scoring_criteria WHERE name = 'Acertar um placar' LIMIT 1;
    
    -- Default values if not found
    exact_score := COALESCE(exact_score, 10);
    winner := COALESCE(winner, 5);
    partial_score := COALESCE(partial_score, 3);
    
    -- Process each prediction for this match
    FOR prediction_record IN 
      SELECT * FROM predictions WHERE match_id = match_id_param
    LOOP
      -- Calculate points based on prediction vs result
      IF prediction_record.home_score = match_record.home_score AND prediction_record.away_score = match_record.away_score THEN
        -- Exact score - highest points
        points_earned := exact_score;
        points_type := 'EXACT_SCORE';
      ELSIF (prediction_record.home_score > prediction_record.away_score AND match_record.home_score > match_record.away_score) OR
            (prediction_record.home_score < prediction_record.away_score AND match_record.home_score < match_record.away_score) OR
            (prediction_record.home_score = prediction_record.away_score AND match_record.home_score = match_record.away_score) THEN
        -- Correct winner/draw prediction
        points_earned := winner;
        points_type := 'CORRECT_WINNER';
      ELSIF prediction_record.home_score = match_record.home_score OR prediction_record.away_score = match_record.away_score THEN
        -- One score correct
        points_earned := partial_score;
        points_type := 'PARTIAL_SCORE';
      ELSE
        -- No points
        points_earned := 0;
        points_type := 'NO_POINTS';
      END IF;
      
      -- Save points for this prediction
      INSERT INTO user_points (
        user_id,
        match_id,
        points,
        points_type,
        prediction_id
      ) VALUES (
        prediction_record.user_id,
        match_id_param,
        points_earned,
        points_type,
        prediction_record.id
      )
      ON CONFLICT (user_id, match_id) DO UPDATE
      SET points = EXCLUDED.points,
          points_type = EXCLUDED.points_type,
          prediction_id = EXCLUDED.prediction_id,
          updated_at = now();
      
      -- Update user stats
      PERFORM update_user_stats_function(prediction_record.user_id);
    END LOOP;
  END;
END;
$$;

-- Create function to update user stats
CREATE OR REPLACE FUNCTION public.update_user_stats_function(user_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  total_points_sum INT;
  matches_played_count INT;
  accuracy_percentage_calc INT;
BEGIN
  -- Calculate total points
  SELECT COALESCE(SUM(points), 0) INTO total_points_sum
  FROM user_points
  WHERE user_id = user_id_param;
  
  -- Calculate matches played
  SELECT COUNT(*) INTO matches_played_count
  FROM user_points
  WHERE user_id = user_id_param;
  
  -- Calculate accuracy percentage
  -- (exact scores / total predictions) * 100
  SELECT 
    CASE 
      WHEN matches_played_count > 0 THEN
        (COUNT(*) * 100 / matches_played_count)
      ELSE 0
    END INTO accuracy_percentage_calc
  FROM user_points
  WHERE user_id = user_id_param AND points_type = 'EXACT_SCORE';
  
  -- Insert or update user stats
  INSERT INTO user_stats (
    user_id,
    total_points,
    matches_played,
    accuracy_percentage
  ) VALUES (
    user_id_param,
    total_points_sum,
    matches_played_count,
    accuracy_percentage_calc
  )
  ON CONFLICT (user_id) DO UPDATE
  SET total_points = EXCLUDED.total_points,
      matches_played = EXCLUDED.matches_played,
      accuracy_percentage = EXCLUDED.accuracy_percentage,
      updated_at = now();
END;
$$;
