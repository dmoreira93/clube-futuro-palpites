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
  matchesplayed: number;  // Mapeado de matches_played
  scored_matches: number; // Sinônimo para manter compatibilidade visual
  exactscores: number;    // Mapeado de exact_scores
  rank: number;
  accuracy: string;
  prize?: string | null;
  is_ai: boolean;
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
        is_ai,
        user:users_custom (
          id,
          name,
          username,
          avatar_url
        )
      `)
      .eq('pool_id', poolId)
      .order('points', { ascending: false })
      .order('exact_scores', { ascending: false }); // Critério de desempate

    if (error) throw error;

    // Transforma os dados crus no formato que o componente de Ranking espera
    return data.map((entry: any, index: number) => {
      const user = entry.user;
      const matches = entry.matches_played || 0;
      const exacts = entry.exact_scores || 0;
      
      // Cálculo de precisão (evita divisão por zero)
      const accuracy = matches > 0 
        ? `${Math.round((exacts / matches) * 100)}%` 
        : '0%';

      return {
        id: user?.id || 'unknown',
        name: user?.name || 'Participante',
        username: user?.username || '',
        avatar_url: user?.avatar_url || null,
        points: entry.points || 0,
        is_admin: entry.is_admin || false,
        is_ai: user?.is_ai || false,
        matchesplayed: matches,
        scored_matches: matches, // Mantendo compatibilidade
        exactscores: exacts,
        rank: index + 1, // O índice + 1 é o ranking, pois já veio ordenado do DB
        accuracy: accuracy,
        prize: null // O cálculo de prêmio pode ser feito no componente visual se necessário
      };
    });

  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    return [];
  }
};

const useParticipantsRanking = (poolIdOverride?: string) => {
  const { activePool } = useAuth();
  
  // Prioriza o ID passado por parâmetro (útil para rotas /pool/:id)
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
    enabled: !!targetPoolId, // Só busca se tivermos um ID
    staleTime: 1000 * 60 * 1, // Cache de 1 minuto para não martelar o banco
  });

  return { 
    participants, 
    loading, 
    error: error ? (error as Error).message : null 
  };
};

export default useParticipantsRanking;