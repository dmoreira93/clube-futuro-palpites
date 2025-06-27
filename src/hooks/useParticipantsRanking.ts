// src/hooks/useParticipantsRanking.ts (VERSÃO FINAL E CORRETA)

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Participant {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  points: number;
  is_admin: boolean;
  matchesplayed: number;
  scored_matches: number; 
  exactscores: number;
  rank?: number;
  accuracy?: string;
  prize?: string | null;
}

const useParticipantsRanking = () => {
  const { pool } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRanking = useCallback(async () => {
    if (!pool?.id) {
      setParticipants([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Busca os usuários e faz um join para buscar os tipos de pontos de cada um
      const { data, error: fetchError } = await supabase
        .from('users_custom')
        .select(`
          id, name, username, avatar_url, total_points, is_admin,
          user_points ( points, points_type )
        `)
        .eq('pool_id', pool.id)
        .order('total_points', { ascending: false })
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      
      // Mapeia os dados e calcula as estatísticas no frontend
      const formattedData = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        username: p.username,
        avatar_url: p.avatar_url,
        is_admin: p.is_admin,
        points: p.total_points || 0,
        matchesplayed: p.user_points.length,
        scored_matches: p.user_points.filter((up: any) => up.points > 0).length,
        exactscores: p.user_points.filter((up: any) => up.points_type === 'EXACT_SCORE').length,
      }));

      setParticipants(formattedData as Participant[]);
    } catch (err: any) {
      setError(err.message);
      console.error("Erro ao buscar ranking:", err);
    } finally {
      setLoading(false);
    }
  }, [pool?.id]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  return { participants, loading, error };
};

export default useParticipantsRanking;