
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Participant } from "@/types/participants";

export const useParticipantsRanking = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      setLoading(true);
      try {
        // Buscar usuários
        const { data: usersData, error: usersError } = await supabase
          .from('users_custom')
          .select('id, name, username, avatar_url')
          .order('name');

        if (usersError) throw usersError;

        // Buscar estatísticas separadamente
        const { data: statsData, error: statsError } = await supabase
          .from('user_stats')
          .select('user_id, total_points, matches_played, accuracy_percentage');

        if (statsError) throw statsError;

        if (usersData) {
          const usersWithStats = usersData.map(user => {
            const userStats = statsData?.find(stat => stat.user_id === user.id);
            return {
              id: user.id,
              name: user.name,
              nickname: user.username || user.name.split(' ')[0],
              points: userStats?.total_points || 0,
              matches: userStats?.matches_played || 0,
              accuracy: userStats ? `${userStats.accuracy_percentage || 0}%` : "0%",
              avatar_url: user.avatar_url
            };
          });

          // Ordenar por pontos (do maior para o menor)
          const sortedData = usersWithStats.sort((a, b) => b.points - a.points);
          setParticipants(sortedData);
        }
      } catch (error) {
        console.error('Erro ao carregar ranking:', error);
        setParticipants([]);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, []);

  return { participants, loading };
};
