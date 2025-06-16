// src/hooks/useParticipantsRanking.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Tipo de dados do usuário vindo do banco
type FetchedUser = {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    total_points: number | null;
    is_admin: boolean;
    created_at: string;
    pool_id?: string | null;
    user_stats: {
        accuracy_percentage: number;
        exact_scores_count: number;
        correct_winners_count: number;
    }[];
};

// Tipo de dados que o componente do ranking usará
export type Participant = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  points: number;
  exactScores: number; // Para a coluna "Placares"
  correctWinners: number; // Para a coluna "Vencedores"
  accuracy: string;
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
      
      // Busca usuários e suas estatísticas de uma só vez
      const { data: usersData, error: usersError } = await supabase
        .from('users_custom')
        .select(`
            id, name, username, avatar_url, is_admin, total_points, created_at,
            user_stats ( accuracy_percentage, exact_scores_count, correct_winners_count )
        `)
        .eq('pool_id', user.pool_id);

      if (usersError) throw usersError;
      
      const nonAdminUsers = (usersData as FetchedUser[]).filter(u => !u.is_admin);
      
      const finalRanking: Participant[] = nonAdminUsers.map((dbUser) => {
        const stats = dbUser.user_stats?.[0] || { 
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
          exactScores: stats.exact_scores_count,
          correctWinners: stats.correct_winners_count,
          accuracy: `${stats.accuracy_percentage}%`,
          createdAt: dbUser.created_at,
        };
      }).sort((a, b) => { // Ordena pelo critério completo
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