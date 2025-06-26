// src/hooks/useParticipantsRanking.ts

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
  matchesplayed: number; // Total de palpites
  scored_matches: number; // Jogos com pontuação > 0
  exactscores: number;
  // Campos calculados no frontend
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
      const { data, error: rpcError } = await supabase.rpc('get_pool_ranking', {
        p_pool_id: pool.id,
      });

      if (rpcError) {
        throw rpcError;
      }
      
      const formattedData = data.map((p: any) => ({...p, points: p.total_points || 0}));

      setParticipants(formattedData as Participant[]);
    } catch (err: any) {
      setError(err.message);
      console.error("Erro ao buscar ranking via RPC:", err);
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