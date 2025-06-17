// src/hooks/useParticipantsRanking.ts - DEPOIS (VERSÃO CORRIGIDA)

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client"; // 1. IMPORTE O CLIENTE SUPABASE

export interface Participant {
  id: string; // O SQL já foi corrigido para retornar 'id'
  name: string;
  username: string;
  avatar_url: string | null;
  points: number;
  matchesplayed: number;
  accuracy: string;
  exactscores: number;
  correctwinners: number;
  createdat: string;
  prize: string | null;
}

const useParticipantsRanking = () => {
  const { pool } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 2. USAMOS O useCallback PARA MEMORIZAR A FUNÇÃO
  const fetchRanking = useCallback(async () => {
    if (!pool?.id) {
      // Se não há bolão, não há o que buscar.
      setParticipants([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // 3. FAZ A CHAMADA RPC DIRETAMENTE PARA O SUPABASE
      const { data, error: rpcError } = await supabase.rpc('get_pool_ranking', {
        p_pool_id: pool.id,
      });

      if (rpcError) {
        throw rpcError;
      }

      setParticipants(data as Participant[]);
    } catch (err: any) {
      setError(err.message);
      console.error("Erro ao buscar ranking via RPC:", err);
    } finally {
      setLoading(false);
    }
  }, [pool?.id]); // A função será recriada se o ID do bolão mudar

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]); // O useEffect agora apenas chama a função memorizada

  return { participants, loading, error };
};

export default useParticipantsRanking;
