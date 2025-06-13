// src/hooks/useParticipantsRanking.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type UserData = {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    total_points: number | null;
    is_admin: boolean;
    created_at: string;
    pool_id?: string | null;
};

export type Participant = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  points: number;
  exactScores: number;
  correctWinners: number;
  accuracy: string;
  createdAt: string;
};

const useParticipantsRanking = () => {
  const { user, signOut } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // **MELHORIA**: useCallback agora depende apenas do pool_id do usuário.
  const fetchRanking = useCallback(async () => {
    if (!user?.pool_id) {
      setLoading(false);
      setParticipants([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // A lógica interna permanece a mesma
      const { data: usersData, error: usersError } = await supabase
        .from('users_custom')
        .select('id, name, username, avatar_url, is_admin, total_points, created_at')
        .eq('pool_id', user.pool_id);

      if (usersError) throw usersError;
      
      const nonAdminUsers = (usersData as UserData[]).filter(u => !u.is_admin);
      const userIds = nonAdminUsers.map(u => u.id);

      if (userIds.length === 0) {
        setParticipants([]);
        setLoading(false);
        return;
      }
      
      const { data: pointsData, error: pointsError } = await supabase.from('user_points').select('user_id, points_type').in('user_id', userIds);
      if (pointsError) throw pointsError;
      
      const userStats: { [userId: string]: { exactScores: number, correctWinners: number, totalPredictions: number } } = {};
      userIds.forEach(id => { userStats[id] = { exactScores: 0, correctWinners: 0, totalPredictions: 0 }; });

      (pointsData || []).forEach(point => {
        const stats = userStats[point.user_id];
        if (stats) {
          stats.totalPredictions += 1;
          if (point.points_type === 'EXACT_SCORE') {
            stats.exactScores += 1;
            stats.correctWinners += 1;
          } else if (point.points_type === 'CORRECT_WINNER') {
            stats.correctWinners += 1;
          }
        }
      });
      
      const finalRanking: Participant[] = nonAdminUsers.map((user) => {
        const stats = userStats[user.id] || { exactScores: 0, correctWinners: 0, totalPredictions: 0 };
        const accuracy = stats.totalPredictions > 0 ? ((stats.exactScores / stats.totalPredictions) * 100).toFixed(0) : "0";
        return {
          id: user.id,
          name: user.name,
          username: user.username,
          avatar_url: user.avatar_url,
          points: user.total_points || 0,
          exactScores: stats.exactScores,
          correctWinners: stats.correctWinners,
          accuracy: `${accuracy}%`,
          createdAt: user.created_at,
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
      if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
        await signOut();
      }
    } finally {
      setLoading(false);
    }
  }, [user?.pool_id, signOut]); // **MELHORIA**: A dependência agora é mais específica.

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  return { participants, loading, error, refetch: fetchRanking };
};

export default useParticipantsRanking;