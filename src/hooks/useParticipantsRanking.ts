
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
        // Buscar usuários com suas estatísticas
        const { data, error } = await supabase
          .from('users')
          .select('id, name');
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Buscar estatísticas para cada usuário
          const usersWithStats = await Promise.all(
            data.map(async (user) => {
              const { data: statsData } = await supabase
                .from('user_stats')
                .select('total_points, matches_played, accuracy_percentage')
                .eq('user_id', user.id)
                .maybeSingle();
                
              return {
                id: user.id,
                name: user.name,
                nickname: user.name.split(' ')[0],
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
          // Usar dados de amostra se não houver dados reais
          setParticipants([
            { id: "1", name: "Carlos Silva", nickname: "Carlão", points: 145, matches: 12, accuracy: "80%" },
            { id: "2", name: "Ana Souza", nickname: "Ana Gol", points: 132, matches: 12, accuracy: "75%" },
            { id: "3", name: "Pedro Santos", nickname: "Pedrinho", points: 120, matches: 12, accuracy: "65%" },
            { id: "4", name: "Mariana Lima", nickname: "Mari", points: 118, matches: 12, accuracy: "63%" },
            { id: "5", name: "João Ferreira", nickname: "JF", points: 105, matches: 12, accuracy: "58%" },
          ]);
        }
      } catch (error) {
        console.error('Erro ao carregar ranking:', error);
        // Usar dados de amostra em caso de erro
        setParticipants([
          { id: "1", name: "Carlos Silva", nickname: "Carlão", points: 145, matches: 12, accuracy: "80%" },
          { id: "2", name: "Ana Souza", nickname: "Ana Gol", points: 132, matches: 12, accuracy: "75%" },
          { id: "3", name: "Pedro Santos", nickname: "Pedrinho", points: 120, matches: 12, accuracy: "65%" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchParticipants();
  }, []);

  return { participants, loading };
};
