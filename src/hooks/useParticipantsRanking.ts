// src/hooks/useParticipantsRanking.ts (VERSÃO RESTAURADA E CORRIGIDA)

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/utils/pointsCalculator/types'; // Usando seu tipo User

// O tipo final que o componente de ranking usará
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

    try {
      setLoading(true);
      setError(null);
      
      // PASSO 1: Busca todos os usuários do bolão.
      const { data: usersData, error: usersError } = await supabase
        .from('users_custom')
        .select('id, name, username, avatar_url, is_admin, is_ai, total_points, created_at')
        .eq('pool_id', user.pool_id);

      if (usersError) throw usersError;
      
      const userIds = usersData.map(u => u.id);
      if (userIds.length === 0) {
        setParticipants([]);
        setLoading(false);
        return;
      }

      // PASSO 2: Busca as estatísticas para todos esses usuários.
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('user_id, matches_played, accuracy_percentage, exact_scores_count, correct_winners_count')
        .in('user_id', userIds);
      
      if (statsError) throw statsError;

      const statsMap = new Map<string, typeof statsData[0]>();
      statsData.forEach(stat => statsMap.set(stat.user_id, stat));

      // PASSO 3: Combina os dados e ordena.
      const finalRanking: Participant[] = usersData.map((dbUser) => {
        const stats = statsMap.get(dbUser.id);
        return {
          ...dbUser, // Mantém todos os campos de users_custom (id, name, is_admin, is_ai)
          points: dbUser.total_points || 0,
          matchesPlayed: stats?.matches_played || 0,
          accuracy: `${stats?.accuracy_percentage || 0}%`,
          exactScores: stats?.exact_scores_count || 0,
          correctWinners: stats?.correct_winners_count || 0,
          createdAt: dbUser.created_at,
        };
      }).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
        if (b.correctWinners !== a.correctWinners) return b.correctWinners - a.correctWinners;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      
      setParticipants(finalRanking);
      
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