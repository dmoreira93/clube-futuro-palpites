
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
        // Buscar usuários com seus palpites
        const { data: usersData, error: usersError } = await supabase
          .from('users_custom')
          .select('id, name, username')
          .order('name');
          
        if (usersError) throw usersError;
        
        if (usersData && usersData.length > 0) {
          // Buscar estatísticas para cada usuário
          const usersWithStats = await Promise.all(
            usersData.map(async (user) => {
              // Tentar obter estatísticas existentes
              const { data: statsData } = await supabase
                .from('user_stats')
                .select('total_points, matches_played, accuracy_percentage')
                .eq('user_id', user.id)
                .maybeSingle();

              // Se não houver estatísticas, criar valores padrão
              return {
                id: user.id,
                name: user.name,
                nickname: user.username || user.name.split(' ')[0],
                points: statsData?.total_points || 0,
                matches: statsData?.matches_played || 0,
                accuracy: statsData ? `${statsData.accuracy_percentage || 0}%` : "0%"
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
