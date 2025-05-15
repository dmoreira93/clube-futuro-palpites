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

        if (usersData) {
          const participantsData = usersData.map(user => ({
            id: user.id,
            name: user.name,
            nickname: user.username || user.name.split(' ')[0],
            points: 0,
            matches: 0,
            accuracy: "0%",
            avatar_url: user.avatar_url
          }));

          setParticipants(participantsData);
        }
      } catch (error) {
        console.error('Erro ao carregar ranking:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, []);

  return { participants, loading };
};