// src/hooks/useParticipantsRanking.ts (VERSÃO CORRIGIDA)

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/utils/pointsCalculator/types';

export type Participant = User & {
  points: number;
  matchesPlayed: number;
  accuracy: string;
  exactScores: number;
  correctWinners: number;
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
      // 1. Busca todos os usuários do bolão atual
      const { data: usersData, error: usersError } = await supabase
        .from('users_custom')
        .select('*')
        .eq('pool_id', user.pool_id);
      if (usersError) throw usersError;

      // 2. Busca todas as estatísticas de pontos
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*');
      if (statsError) throw statsError;

      // 3. Junta os dados no frontend, como era feito antes
      const rankedParticipants = (usersData || [])
        .map(u => {
          const stats = statsData?.find(s => s.user_id === u.id);
          return {
            ...u,
            points: stats?.total_points || 0,
            matchesPlayed: stats?.matches_played || 0,
            accuracy: `${stats?.accuracy_percentage || 0}%`,
            exactScores: stats?.exact_scores_count || 0,
            correctWinners: stats?.correct_winners_count || 0,
          };
        })
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
          if (b.correctWinners !== a.correctWinners) return b.correctWinners - a.correctWinners;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

      setParticipants(rankedParticipants);

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