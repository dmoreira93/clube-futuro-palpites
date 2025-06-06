import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext'; // <-- PASSO 1: Importa o useAuth

// Tipos locais para clareza
type UserForRanking = {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    total_points: number | null;
};

type MatchResult = {
    id: string;
    home_score: number | null;
    away_score: number | null;
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
  const { signOut } = useAuth(); // <-- PASSO 2: Pega a função signOut do contexto
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch de todos os usuários não-administradores
        const { data: users, error: usersError } = await supabase
          .from('users_custom')
          .select('id, name, username, avatar_url, is_admin, total_points')
          .eq('is_admin', false);

        if (usersError) throw usersError;
        
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

        matchPredictionsData.forEach((prediction: Prediction) => {
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

        // 5. Constrói o ranking final
        const finalRanking: Participant[] = (users as UserForRanking[])
          .map((user: UserForRanking) => {
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
          })
          .sort((a, b) => b.points - a.points); // Ordena por pontos

        setParticipants(finalRanking);
        
      } catch (error: any) {
        console.error("Erro ao carregar o ranking:", error);
        setError(error.message);

        // <-- PASSO 3: Lógica para deslogar em caso de erro de autenticação
        // Se a mensagem de erro indicar um token inválido (JWT), força o logout.
        // O código 'PGRST301' também pode indicar um JWT expirado ou inválido.
        if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
          await signOut();
        }

      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [signOut]); // <-- PASSO 4: Adiciona signOut como dependência do useEffect

  return { participants, loading, error };
};

export default useParticipantsRanking;