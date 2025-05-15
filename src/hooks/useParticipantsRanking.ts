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
        // Buscar usuários com seus palpites e pontuação
        const { data: usersData, error: usersError } = await supabase
          .from('users_custom')
          .select(`
            id, 
            name, 
            username, 
            avatar_url,
            user_stats (
              total_points,
              matches_played,
              accuracy_percentage
            )
          `)
          .order('name');

        if (usersError) throw usersError;

        if (usersData && usersData.length > 0) {
          // Buscar estatísticas para cada usuário
          const usersWithStats = await Promise.all(
            usersData.map(async (user) => {
              // Tentar obter estatísticas existentes
              // Se não houver estatísticas, criar valores padrão
              return {
                id: user.id,
                name: user.name,
                nickname: user.username || user.name.split(' ')[0],
                points: user.user_stats?.[0]?.total_points || 0,
                matches: user.user_stats?.[0]?.matches_played || 0,
                accuracy: user.user_stats ? `${user.user_stats[0]?.accuracy_percentage || 0}%` : "0%",
                avatar_url: user.avatar_url
              };
            })
          );

          // Ordenar por pontos (do maior para o menor)
          const sortedData = usersWithStats.sort((a, b) => b.points - a.points);
          setParticipants(sortedData);
        } else {
          setParticipants([]);
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