// src/hooks/useParticipantsRanking.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Tipo para os dados dos usuários
type FetchedUser = {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    total_points: number | null;
    is_admin: boolean;
    created_at: string;
};

// Tipo para os dados das estatísticas
type FetchedStats = {
    user_id: string;
    matches_played: number;
    accuracy_percentage: number;
    exact_scores_count: number;
    correct_winners_count: number;
};

// Tipo final que o componente de ranking usará
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

    try {
      setLoading(true);
      setError(null);
      
      // PASSO 1: Busca todos os usuários (não-admins) do bolão.
      const { data: usersData, error: usersError } = await supabase
        .from('users_custom')
        .select('id, name, username, avatar_url, is_admin, total_points, created_at')
        .eq('is_admin', false)
        .eq('pool_id', user.pool_id);

      if (usersError) throw usersError;
      
      const userIds = usersData.map(u => u.id);
      if (userIds.length === 0) {
        setParticipants([]);
        setLoading(false);
        return;
      }

      // PASSO 2: Busca as estatísticas para todos esses usuários de uma vez.
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('user_id, matches_played, accuracy_percentage, exact_scores_count, correct_winners_count')
        .in('user_id', userIds);
      
      if (statsError) throw statsError;

      // Cria um mapa para facilitar a busca das estatísticas de cada usuário
      const statsMap = new Map<string, FetchedStats>();
      statsData.forEach(stat => statsMap.set(stat.user_id, stat));

      // PASSO 3: Combina os dados de usuário com suas respectivas estatísticas.
      const finalRanking: Participant[] = usersData.map((dbUser: FetchedUser) => {
        const stats = statsMap.get(dbUser.id) || { 
            matches_played: 0,
            accuracy_percentage: 0, 
            exact_scores_count: 0, 
            correct_winners_count: 0 
        };
        
        return {
          id: dbUser.id,
          name: dbUser.name,
          username: dbUser.username,
          avatar_url: dbUser.avatar_url,
          points: dbUser.total_points || 0,
          matchesPlayed: stats.matches_played,
          accuracy: `${stats.accuracy_percentage}%`,
          exactScores: stats.exact_scores_count,
          correctWinners: stats.correct_winners_count,
          createdAt: dbUser.created_at,
        };
      }).sort((a, b) => { // Critérios de desempate
        if (b.points !== a.points) return b.points - a.points;
        if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
        if (b.correctWinners !== a.correctWinners) return b.correctWinners - a.correctWinners;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      
      setParticipants(finalRanking);
      
    } catch (error: any) {
      console.error("Erro ao carregar o ranking:", error);
      setError(error.message);
      if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
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