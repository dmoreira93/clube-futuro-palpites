import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Tipos locais para clareza
type UserForRanking = {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    total_points: number | null;
    is_admin: boolean; // Garantir que is_admin está no tipo
};

type MatchResult = {
    id: string;
    home_score: number | null;
    away_score: number | null;
    is_finished: boolean;
};

type Prediction = {
    user_id: string;
    match_id: string;
    home_score: number;
    away_score: number;
};

export type Participant = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  points: number;
  matches: number;
  accuracy: string;
};

const useParticipantsRanking = () => {
  const { signOut } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch de todos os usuários
        const { data: users, error: usersError } = await supabase
          .from('users_custom')
          .select('id, name, username, avatar_url, is_admin, total_points');
        if (usersError) throw usersError;

        // Filtra os admins APÓS o fetch
        const nonAdminUsers = (users as UserForRanking[]).filter(user => !user.is_admin);
        
        // 2. Fetch de todos os resultados de partidas finalizadas
        const { data: realMatchResults, error: realMatchResultsError } = await supabase
          .from('matches')
          .select('id, home_score, away_score, is_finished')
          .eq('is_finished', true);
        if (realMatchResultsError) throw realMatchResultsError;

        const matchResultsMap = new Map<string, MatchResult>();
        realMatchResults.forEach(match => matchResultsMap.set(match.id, match));

        // 3. Fetch dos palpites dos usuários
        const { data: matchPredictionsData, error: matchPredictionsError } = await supabase
          .from('match_predictions')
          .select('id, user_id, match_id, home_score, away_score');
        if (matchPredictionsError) throw matchPredictionsError;

        // 4. Calcula estatísticas de acerto
        const userStats: { [userId: string]: { correctMatches: number, totalMatches: number } } = {};
        (matchPredictionsData as Prediction[]).forEach((prediction) => {
          if (!userStats[prediction.user_id]) {
            userStats[prediction.user_id] = { correctMatches: 0, totalMatches: 0 };
          }
          const realResult = matchResultsMap.get(prediction.match_id);
          if (realResult) {
            userStats[prediction.user_id].totalMatches += 1;
            const predictionCorrect =
              prediction.home_score === realResult.home_score &&
              prediction.away_score === realResult.away_score;
            if (predictionCorrect) {
              userStats[prediction.user_id].correctMatches += 1;
            }
          }
        });

        // 5. Constrói a lista de participantes para o ranking (apenas não-admins)
        const finalRanking: Participant[] = nonAdminUsers
          .map((user) => {
            const stats = userStats[user.id] || { correctMatches: 0, totalMatches: 0 };
            const accuracy = stats.totalMatches > 0 ? ((stats.correctMatches / stats.totalMatches) * 100).toFixed(0) : "0";
            return {
              id: user.id,
              name: user.name,
              username: user.username,
              avatar_url: user.avatar_url,
              points: user.total_points || 0,
              matches: stats.totalMatches,
              accuracy: `${accuracy}%`,
            };
          });

        // --- INÍCIO DA MUDANÇA NA LÓGICA DE ORDENAÇÃO ---

        // 6. Verifica se todos os participantes têm zero pontos
        const allHaveZeroPoints = finalRanking.every(p => p.points === 0);

        if (allHaveZeroPoints) {
          // Se todos têm zero pontos, ordena alfabeticamente por nome
          finalRanking.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
        } else {
          // Caso contrário, usa a ordenação padrão: por pontos (desc) e depois por nome (asc)
          finalRanking.sort((a, b) => {
            if (b.points !== a.points) {
              return b.points - a.points;
            }
            return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
          });
        }
        
        // --- FIM DA MUDANÇA ---

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
    };

    fetchRanking();
  }, [signOut]);

  return { participants, loading, error };
};

export default useParticipantsRanking;