// src/hooks/useParticipantsRanking.ts (VERSÃO ATUALIZADA)

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// O tipo agora corresponde à saída da nossa função SQL
export type Participant = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  points: number;
  matchesPlayed: number;
  accuracy: string;
  exactScores: number;
  correctWinners: number;
  createdAt: string;
  prize: string | null; // O prêmio já vem calculado!
};

const useParticipantsRanking = () => {
  const { user, signOut } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRanking = useCallback(async () => {
    if (!user?.pool_id) {
      setLoading(false);
      setParticipants([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Chamada simples para a nova função RPC
      const { data, error: rpcError } = await supabase.rpc('get_pool_ranking', {
        p_pool_id: user.pool_id
      });

      if (rpcError) throw rpcError;

      setParticipants(data || []);

    } catch (error: any) {
      console.error("Erro ao carregar o ranking:", error);
      setError(error.message);
      if (error?.message?.includes('JWT')) {
        await signOut();
      }
    } finally {
      setLoading(false);
    }
  }, [user?.pool_id, signOut]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  return { participants, loading, error, refetch: fetchRanking };
};

export default useParticipantsRanking;