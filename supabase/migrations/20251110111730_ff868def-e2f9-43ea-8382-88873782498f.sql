-- Drop e recria funções que já existem com tipos diferentes
DROP FUNCTION IF EXISTS public.get_pool_dashboard_stats(UUID);

CREATE OR REPLACE FUNCTION public.get_pool_dashboard_stats(p_pool_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'top_scorer', (SELECT json_build_object('name', u.name, 'points', p.points) 
                   FROM participations p 
                   JOIN users_custom u ON p.user_id = u.id 
                   WHERE p.pool_id = p_pool_id AND u.is_admin = false 
                   ORDER BY p.points DESC LIMIT 1),
    'most_exact', (SELECT json_build_object('name', u.name, 'exact_scores', 
                          (SELECT COUNT(*) FROM user_points up 
                           WHERE up.user_id = u.id AND up.points_type = 'EXACT_SCORE'))
                   FROM users_custom u
                   JOIN participations p ON u.id = p.user_id
                   WHERE p.pool_id = p_pool_id AND u.is_admin = false 
                   ORDER BY (SELECT COUNT(*) FROM user_points up 
                            WHERE up.user_id = u.id AND up.points_type = 'EXACT_SCORE') DESC 
                   LIMIT 1),
    'last_place', (SELECT json_build_object('name', u.name, 'points', p.points) 
                   FROM participations p 
                   JOIN users_custom u ON p.user_id = u.id 
                   WHERE p.pool_id = p_pool_id AND u.is_admin = false 
                   ORDER BY p.points ASC LIMIT 1),
    'points_gap', ((SELECT MAX(points) FROM participations WHERE pool_id = p_pool_id) - 
                   (SELECT MIN(points) FROM participations WHERE pool_id = p_pool_id))
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Adiciona funções de mensagens do bolão
CREATE OR REPLACE FUNCTION public.upsert_pool_message(
  p_pool_id UUID,
  p_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF NOT EXISTS (SELECT 1 FROM pools WHERE id = p_pool_id AND owner_id = v_user_id) THEN
    RAISE EXCEPTION 'Apenas o dono do bolão pode adicionar mensagens';
  END IF;
  
  INSERT INTO pool_messages (pool_id, user_id, message)
  VALUES (p_pool_id, v_user_id, p_message)
  RETURNING id INTO v_message_id;
  
  RETURN v_message_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_pool_message(p_message_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF NOT EXISTS (
    SELECT 1 FROM pool_messages pm
    JOIN pools p ON pm.pool_id = p.id
    WHERE pm.id = p_message_id AND p.owner_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Apenas o dono do bolão pode deletar mensagens';
  END IF;
  
  DELETE FROM pool_messages WHERE id = p_message_id;
END;
$$;