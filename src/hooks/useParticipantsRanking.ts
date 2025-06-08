import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext'; // <-- ADICIONADO

export type Participant = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  points: number;
  matches: number;
  accuracy: string;
};

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

const useParticipantsRanking = () => {
  const { signOut } = useAuth(); // <-- ADICIONADO
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: users, error: usersError } = await supabase
          .from('users_custom')
          .select('id, name, username, avatar_url, is_admin, total_points')
          .eq('is_admin', false);
        if (usersError) throw usersError;
        
        const { data: realMatchResults, error: realMatchResultsError } = await supabase
          .from('matches')
          .select('id, home_score, away_score, is_finished')
          .eq('is_finished', true);
        if (realMatchResultsError) throw realMatchResultsError;

        const matchResultsMap = new Map<string, MatchResult>();
        realMatchResults.forEach(match => matchResultsMap.set(match.id, match));

        const { data: matchPredictionsData, error: matchPredictionsError } = await supabase
          .from('match_predictions')
          .select('id, user_id, match_id, home_score, away_score');
        if (matchPredictionsError) throw matchPredictionsError;

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

        const finalRanking: Participant[] = (users as UserForRanking[])
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
          })
          .sort((a, b) => b.points - a.points);

        setParticipants(finalRanking);
        
      } catch (error: any) {
        console.error("Erro ao carregar o ranking:", error);
        setError(error.message);
        // Lógica de signOut em caso de erro de autenticação
        if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
          await signOut();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [signOut]); // <-- signOut adicionado como dependência

  return { participants, loading, error };
};

export default useParticipantsRanking;