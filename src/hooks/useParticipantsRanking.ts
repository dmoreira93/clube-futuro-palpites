// src/hooks/useParticipantsRanking.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from "@/contexts/AuthContext";

export interface Participant {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  points: number;
  is_admin: boolean;
  is_ai: boolean; // Novo campo
  matchesplayed: number;
  scored_matches: number;
  exactscores: number;
  rank: number;
  accuracy: string;
  prize?: string | null;
}

const fetchRanking = async (poolId: string): Promise<Participant[]> => {
  try {
    const { data, error } = await supabase
      .from('participations')
      .select(`
        points,
        exact_scores,
        matches_played,
        is_admin,
        user:users_custom (
          id,
          name,
          username,
          avatar_url,
          is_ai 
        )
      `) // ^^^ O 'is_ai' tem de estar AQUI DENTRO, junto com o nome e avatar
      .eq('pool_id', poolId)
      .order('points', { ascending: false })
      .order('exact_scores', { ascending: false });

    if (error) throw error;

    return data.map((entry: any, index: number) => {
      const user = entry.user;
      const matches = entry.matches_played || 0;
      const exacts = entry.exact_scores || 0;
      
      const accuracy = matches > 0 
        ? `${Math.round((exacts / matches) * 100)}%` 
        : '0%';

      return {
        id: user?.id || 'unknown',
        name: user?.name || 'Participante',
        username: user?.username || '',
        avatar_url: user?.avatar_url || null,
        is_ai: user?.is_ai || false, // Mapeia do objeto de usuário
        points: entry.points || 0,
        is_admin: entry.is_admin || false,
        matchesplayed: matches,
        scored_matches: matches,
        exactscores: exacts,
        rank: index + 1,
        accuracy: accuracy,
        prize: null
      };
    });

  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    return [];
  }
};

const useParticipantsRanking = (poolIdOverride?: string) => {
  const { activePool } = useAuth();
  
  const targetPoolId = poolIdOverride || activePool?.id;

  const { 
    data: participants = [], 
    isLoading: loading, 
    error 
  } = useQuery({
    queryKey: ['poolRanking', targetPoolId], 
    queryFn: () => {
      if (!targetPoolId) return [];
      return fetchRanking(targetPoolId);
    },
    enabled: !!targetPoolId,
    staleTime: 1000 * 60 * 1, 
  });

  return { 
    participants, 
    loading, 
    error: error ? (error as Error).message : null 
  };
};

export default useParticipantsRanking;